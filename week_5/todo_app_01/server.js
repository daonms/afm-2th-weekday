// ── single-server-specialist 패턴 ──────────────────────────────
require('dotenv').config();
const express  = require('express');
const { Pool } = require('pg');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { google } = require('googleapis');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = (process.env.JWT_SECRET || 'afm-week5-secret').trim();

// ── Google OAuth2 클라이언트 ───────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  (process.env.GOOGLE_CLIENT_ID     || '').trim(),
  (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
  (process.env.GOOGLE_REDIRECT_URI  || '').trim(),
);

// ── DB 연결 (UTF-8 + trim) ─────────────────────────────────────
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

// ── DB 초기화 (Lazy Init + 마이그레이션) ──────────────────────
let dbInitialized = false;
async function initDB() {
  if (dbInitialized) return;
  await pool.query("SET client_encoding = 'UTF8'");

  // 유저 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS W5_todo_app_01_users (
      id         SERIAL       PRIMARY KEY,
      username   VARCHAR(100) UNIQUE,
      password   TEXT,
      role       VARCHAR(10)  NOT NULL DEFAULT 'user',
      google_id  VARCHAR(100) UNIQUE,
      email      VARCHAR(255),
      picture    TEXT,
      google_access_token  TEXT,
      google_refresh_token TEXT,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  // 마이그레이션: 기존 테이블에 Google 컬럼 추가
  const googleCols = ['google_id VARCHAR(100)', 'email VARCHAR(255)', 'picture TEXT',
                      'google_access_token TEXT', 'google_refresh_token TEXT'];
  for (const col of googleCols) {
    await pool.query(`ALTER TABLE W5_todo_app_01_users ADD COLUMN IF NOT EXISTS ${col}`).catch(() => {});
  }
  // google_id unique 제약 (없으면 추가)
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'w5_todo_app_01_users_google_id_key'
      ) THEN
        ALTER TABLE W5_todo_app_01_users ADD CONSTRAINT w5_todo_app_01_users_google_id_key UNIQUE (google_id);
      END IF;
    END $$
  `).catch(() => {});

  // Todo 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS W5_todo_app_01 (
      id         SERIAL      PRIMARY KEY,
      title      TEXT        NOT NULL,
      done       BOOLEAN     NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  // 마이그레이션: user_id, due_date, calendar_event_id 추가
  await pool.query(`ALTER TABLE W5_todo_app_01 ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES W5_todo_app_01_users(id) ON DELETE CASCADE`).catch(() => {});
  await pool.query(`ALTER TABLE W5_todo_app_01 ADD COLUMN IF NOT EXISTS due_date DATE`).catch(() => {});
  await pool.query(`ALTER TABLE W5_todo_app_01 ADD COLUMN IF NOT EXISTS calendar_event_id TEXT`).catch(() => {});

  // 기존 todo의 user_id 없는 행 → admin으로 임시 할당
  await pool.query(`
    UPDATE W5_todo_app_01 SET user_id = (
      SELECT id FROM W5_todo_app_01_users WHERE username = 'admin' LIMIT 1
    ) WHERE user_id IS NULL
  `).catch(() => {});

  // 데모 유저 (비밀번호: 1234)
  const hash = await bcrypt.hash('1234', 10);
  await pool.query(`
    INSERT INTO W5_todo_app_01_users (username, password, role) VALUES
      ('admin', $1, 'admin'),
      ('daon',  $1, 'user'),
      ('alice', $1, 'user'),
      ('bob',   $1, 'user')
    ON CONFLICT (username) DO NOTHING
  `, [hash]);

  // 데모 Todo (비어있을 때만)
  const { rows: cnt } = await pool.query('SELECT COUNT(*) FROM W5_todo_app_01 WHERE user_id IS NOT NULL');
  if (parseInt(cnt[0].count) <= 1) {
    await pool.query(`
      INSERT INTO W5_todo_app_01 (user_id, title, done, due_date)
      SELECT u.id, v.title, v.done::boolean, v.due::date
      FROM W5_todo_app_01_users u
      JOIN (VALUES
        ('daon',  '부트캠프 과제 제출하기',   'false', '2026-04-18'),
        ('daon',  'React 복습하기',           'true',  NULL),
        ('daon',  'Supabase 문서 읽기',       'false', '2026-04-20'),
        ('alice', '포트폴리오 사이트 만들기',  'false', '2026-04-25'),
        ('alice', 'GitHub 정리하기',          'true',  NULL),
        ('bob',   'Node.js 강의 듣기',        'false', '2026-04-17'),
        ('bob',   'Express 예제 따라하기',    'false', NULL),
        ('bob',   'SQL 기초 공부',            'true',  NULL)
      ) AS v(uname, title, done, due) ON u.username = v.uname
    `).catch(() => {});
  }

  dbInitialized = true;
}

// ── Google Calendar 헬퍼 ───────────────────────────────────────
async function getCalendarClient(userId) {
  const { rows } = await pool.query(
    'SELECT google_access_token, google_refresh_token FROM W5_todo_app_01_users WHERE id = $1', [userId]
  );
  const u = rows[0];
  if (!u?.google_access_token) return null;
  const client = new google.auth.OAuth2(
    (process.env.GOOGLE_CLIENT_ID     || '').trim(),
    (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
  );
  client.setCredentials({ access_token: u.google_access_token, refresh_token: u.google_refresh_token });
  // 토큰 갱신 시 DB 저장
  client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await pool.query(
        'UPDATE W5_todo_app_01_users SET google_access_token = $1 WHERE id = $2',
        [tokens.access_token, userId]
      ).catch(() => {});
    }
  });
  return client;
}

async function createCalendarEvent(userId, todo) {
  if (!todo.due_date) return null;
  const client = await getCalendarClient(userId);
  if (!client) return null;
  try {
    const cal = google.calendar({ version: 'v3', auth: client });
    const ev  = await cal.events.insert({
      calendarId: 'primary',
      resource: {
        summary: todo.title,
        start:   { date: String(todo.due_date).slice(0, 10) },
        end:     { date: String(todo.due_date).slice(0, 10) },
        colorId: '1', // 빨강 (할 일)
      },
    });
    return ev.data.id;
  } catch { return null; }
}

async function updateCalendarEvent(userId, eventId, todo) {
  if (!eventId) return;
  const client = await getCalendarClient(userId);
  if (!client) return;
  try {
    const cal = google.calendar({ version: 'v3', auth: client });
    await cal.events.patch({
      calendarId: 'primary',
      eventId,
      resource: { colorId: todo.done ? '8' : '1', summary: todo.title },
    });
  } catch {}
}

async function deleteCalendarEvent(userId, eventId) {
  if (!eventId) return;
  const client = await getCalendarClient(userId);
  if (!client) return;
  try {
    const cal = google.calendar({ version: 'v3', auth: client });
    await cal.events.delete({ calendarId: 'primary', eventId });
  } catch {}
}

// ── 미들웨어 ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use('/api', async (_req, res, next) => {
  try { await initDB(); next(); }
  catch (err) { res.status(500).json({ success: false, message: 'DB 초기화 실패', error: err.message }); }
});

function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ success: false, message: '토큰이 유효하지 않습니다.' }); }
}

// ── 일반 로그인 / 회원가입 ─────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력하세요.' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM W5_todo_app_01_users WHERE username = $1', [username]
    );
    const user = rows[0];
    if (!user || !user.password || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, picture: user.picture },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ success: true, data: { token, username: user.username, role: user.role, picture: user.picture } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력하세요.' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO W5_todo_app_01_users (username, password) VALUES ($1, $2) RETURNING id, username, role',
      [username, hash]
    );
    const token = jwt.sign(
      { id: rows[0].id, username: rows[0].username, role: rows[0].role },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.status(201).json({ success: true, data: { token, username: rows[0].username, role: rows[0].role } });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: '이미 사용 중인 아이디입니다.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Google OAuth ───────────────────────────────────────────────
app.get('/api/auth/google', (_req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  });
  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.redirect(`/?auth_error=${encodeURIComponent(error)}`);
  try {
    const { tokens } = await oauth2Client.getToken(code);

    // 프로필 조회
    const tempClient = new google.auth.OAuth2(
      (process.env.GOOGLE_CLIENT_ID     || '').trim(),
      (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
    );
    tempClient.setCredentials(tokens);
    const oauth2Api = google.oauth2({ version: 'v2', auth: tempClient });
    const { data: profile } = await oauth2Api.userinfo.get();

    // DB upsert
    const { rows } = await pool.query(`
      INSERT INTO W5_todo_app_01_users
        (google_id, email, username, picture, google_access_token, google_refresh_token)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (google_id) DO UPDATE SET
        email                = EXCLUDED.email,
        username             = EXCLUDED.username,
        picture              = EXCLUDED.picture,
        google_access_token  = EXCLUDED.google_access_token,
        google_refresh_token = COALESCE(EXCLUDED.google_refresh_token, W5_todo_app_01_users.google_refresh_token)
      RETURNING id, username, role, email, picture
    `, [profile.id, profile.email, profile.name, profile.picture, tokens.access_token, tokens.refresh_token || null]);

    const user  = rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username || user.email, role: user.role, picture: user.picture },
      JWT_SECRET, { expiresIn: '24h' }
    );

    res.redirect(
      `/?token=${token}` +
      `&username=${encodeURIComponent(user.username || user.email)}` +
      `&role=${user.role}` +
      `&picture=${encodeURIComponent(user.picture || '')}`
    );
  } catch (err) {
    res.redirect(`/?auth_error=${encodeURIComponent(err.message)}`);
  }
});

// ── Todo API ───────────────────────────────────────────────────

// GET /api/todos
app.get('/api/todos', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const query = `
      SELECT t.*, u.username, u.picture
      FROM W5_todo_app_01 t
      LEFT JOIN W5_todo_app_01_users u ON t.user_id = u.id
      ${isAdmin ? '' : 'WHERE t.user_id = $1'}
      ORDER BY t.created_at DESC
    `;
    const { rows } = await pool.query(query, isAdmin ? [] : [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/todos
app.post('/api/todos', authMiddleware, async (req, res) => {
  const { title, due_date } = req.body;
  if (!title?.trim())
    return res.status(400).json({ success: false, message: '내용을 입력해주세요.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO W5_todo_app_01 (user_id, title, due_date)
       VALUES ($1, $2, $3)
       RETURNING *, (SELECT username FROM W5_todo_app_01_users WHERE id = $1) AS username,
                   (SELECT picture  FROM W5_todo_app_01_users WHERE id = $1) AS picture`,
      [req.user.id, title.trim(), due_date || null]
    );
    const todo = rows[0];

    // 구글 캘린더 이벤트 생성
    const eventId = await createCalendarEvent(req.user.id, todo);
    if (eventId) {
      await pool.query('UPDATE W5_todo_app_01 SET calendar_event_id = $1 WHERE id = $2', [eventId, todo.id]);
      todo.calendar_event_id = eventId;
    }
    res.status(201).json({ success: true, data: todo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/todos/:id — 완료 토글
app.patch('/api/todos/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';
  try {
    const cond   = isAdmin ? 'id = $1' : 'id = $1 AND user_id = $2';
    const params = isAdmin ? [id] : [id, req.user.id];
    const { rows } = await pool.query(
      `UPDATE W5_todo_app_01 SET done = NOT done WHERE ${cond} RETURNING *`, params
    );
    if (!rows.length) return res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다.' });
    const todo = rows[0];

    // 캘린더 색상 업데이트
    await updateCalendarEvent(todo.user_id, todo.calendar_event_id, todo);

    res.json({ success: true, data: todo });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';
  try {
    const cond   = isAdmin ? 'id = $1' : 'id = $1 AND user_id = $2';
    const params = isAdmin ? [id] : [id, req.user.id];
    const { rows } = await pool.query(
      `DELETE FROM W5_todo_app_01 WHERE ${cond} RETURNING *`, params
    );
    if (!rows.length) return res.status(404).json({ success: false, message: '항목을 찾을 수 없습니다.' });

    // 캘린더 이벤트 삭제
    await deleteCalendarEvent(rows[0].user_id, rows[0].calendar_event_id);

    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── 로컬 / Vercel 듀얼모드 ────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => console.log(`✅ 서버 실행 중: http://localhost:${PORT}`));
}
module.exports = app;
