const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3003;

// ========================================
// DB 연결 (Supabase PostgreSQL)
// ========================================
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres.ggvsoogzuvdjoelkwmdh:UaW1CjaVA6fT6GwL@aws-1-us-east-1.pooler.supabase.com:6543/postgres').trim(),
  ssl: { rejectUnauthorized: false },
});


// ========================================
// DB 초기화 (테이블 생성 + 기본 유저)
// ========================================
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      username  TEXT UNIQUE NOT NULL,
      name      TEXT NOT NULL,
      password  TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id         SERIAL PRIMARY KEY,
      username   TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      category   TEXT NOT NULL CHECK (category IN ('work','study','personal','shopping','health')),
      title      TEXT NOT NULL,
      done       BOOLEAN DEFAULT FALSE,
      date       DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 기본 유저 삽입 (없을 때만)
  // UTF-8 인코딩 명시
  await pool.query("SET client_encoding TO 'UTF8'");

  await pool.query(`
    INSERT INTO users (username, name, password)
    VALUES ('admin', '관리자', '1234')
    ON CONFLICT (username) DO NOTHING
  `);

  dbInitialized = true;
  console.log('✅ DB 초기화 완료');
}

// ========================================
// 세션 (메모리)
// ========================================
const sessions = {}; // token → username

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

// ========================================
// 미들웨어
// ========================================
app.use(cors());
app.use(express.json());

// API 요청마다 DB 초기화 보장
app.use('/api', async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB 초기화 실패: ' + err.message });
  }
});

// ========================================
// 인증 미들웨어
// ========================================
function auth(req, res, next) {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const username = sessions[token];
  if (!username) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  req.username = username;
  next();
}

// ========================================
// GET / — 안내
// ========================================
app.get('/', (req, res) => {
  res.json({ name: 'Todo PostgreSQL API', port: PORT, db: 'Supabase', auth: 'POST /api/login' });
});

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}));

// ========================================
// POST /api/login
// ========================================
app.post('/api/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    const { rows } = await pool.query(
      'SELECT username, name, password FROM users WHERE username = $1',
      [id]
    );
    if (!rows.length || rows[0].password !== password) {
      return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }
    const token = generateToken();
    sessions[token] = rows[0].username;
    res.json({ success: true, token, user: { id: rows[0].username, name: rows[0].name } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// POST /api/logout
// ========================================
app.post('/api/logout', auth, (req, res) => {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  delete sessions[token];
  res.json({ success: true, message: '로그아웃 완료' });
});

// ========================================
// GET /api/me
// ========================================
app.get('/api/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT username, name FROM users WHERE username = $1', [req.username]);
    if (!rows.length) return res.status(404).json({ success: false, message: '유저 없음' });
    res.json({ success: true, user: { id: rows[0].username, name: rows[0].name } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// GET /api/users — 전체 유저 목록
// ========================================
app.get('/api/users', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT username, name, created_at FROM users ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// POST /api/users — 유저 추가
// ========================================
app.post('/api/users', auth, async (req, res) => {
  try {
    const { username, name, password } = req.body;
    if (!username || !name || !password) {
      return res.status(400).json({ success: false, message: 'username, name, password 필수' });
    }
    const { rows } = await pool.query(
      'INSERT INTO users (username, name, password) VALUES ($1, $2, $3) RETURNING username, name, created_at',
      [username.trim(), name.trim(), password]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: '이미 존재하는 아이디입니다.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// GET /api/todos — 내 할 일 조회
// ========================================
app.get('/api/todos', auth, async (req, res) => {
  try {
    const { category } = req.query;
    const base = 'SELECT * FROM todos WHERE username = $1';
    const { rows } = category
      ? await pool.query(base + ' AND category = $2 ORDER BY id', [req.username, category])
      : await pool.query(base + ' ORDER BY id', [req.username]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// GET /api/todos/:id
// ========================================
app.get('/api/todos/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM todos WHERE id = $1 AND username = $2',
      [req.params.id, req.username]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// POST /api/todos
// ========================================
app.post('/api/todos', auth, async (req, res) => {
  try {
    const { category, title, date } = req.body;
    if (!category || !title) return res.status(400).json({ success: false, message: 'category와 title은 필수입니다.' });
    const todoDate = date || new Date().toISOString().slice(0, 10);
    const { rows } = await pool.query(
      'INSERT INTO todos (username, category, title, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.username, category, title.trim(), todoDate]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// PUT /api/todos/:id
// ========================================
app.put('/api/todos/:id', auth, async (req, res) => {
  try {
    const { category, title, done, date } = req.body;
    if (!category || !title) return res.status(400).json({ success: false, message: 'category와 title은 필수입니다.' });
    const { rows } = await pool.query(
      'UPDATE todos SET category=$1, title=$2, done=$3, date=$4 WHERE id=$5 AND username=$6 RETURNING *',
      [category, title.trim(), !!done, date || new Date().toISOString().slice(0,10), req.params.id, req.username]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// PATCH /api/todos/:id/toggle
// ========================================
app.patch('/api/todos/:id/toggle', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE todos SET done = NOT done WHERE id = $1 AND username = $2 RETURNING *',
      [req.params.id, req.username]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// DELETE /api/todos/:id
// ========================================
app.delete('/api/todos/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM todos WHERE id = $1 AND username = $2 RETURNING id',
      [req.params.id, req.username]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    res.json({ success: true, message: `todo #${req.params.id} 삭제 완료` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// 서버 시작
// ========================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Todo PostgreSQL API: http://localhost:${PORT}`);
    console.log(`   DB: Supabase (PostgreSQL)`);
    console.log(`\n📋 엔드포인트:`);
    console.log(`   POST  /api/login              로그인 { id, password }`);
    console.log(`   GET   /api/me                  내 정보`);
    console.log(`   GET   /api/users               유저 목록`);
    console.log(`   POST  /api/users               유저 추가 { username, name, password }`);
    console.log(`   GET   /api/todos               내 할 일 조회 (?category=work)`);
    console.log(`   POST  /api/todos               생성 { category, title, date }`);
    console.log(`   PUT   /api/todos/:id            수정`);
    console.log(`   PATCH /api/todos/:id/toggle     완료 토글`);
    console.log(`   DELETE /api/todos/:id           삭제`);
  });
}

module.exports = app;
