const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, '..', 'todos-db', 'todos.db');

// ========================================
// 사용자 정의
// ========================================
const USERS = {
  admin: { id: 'admin', name: '관리자', password: '1234' },
};

// 세션 토큰 저장소 (메모리)
const sessions = {}; // token → userId

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

// ========================================
// DB 초기화 (sql.js)
// ========================================
let db;

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function loadDB() {
  const SQL = await initSqlJs();
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ DB 파일 없음: ${DB_PATH}`);
    process.exit(1);
  }
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(buffer);

  // 마이그레이션: user, date 컬럼 추가
  const info = db.exec("PRAGMA table_info(todos)");
  const cols = info[0] ? info[0].values.map(r => r[1]) : [];
  let migrated = false;
  if (!cols.includes('user')) {
    db.run("ALTER TABLE todos ADD COLUMN user TEXT DEFAULT 'admin'");
    migrated = true;
  }
  if (!cols.includes('date')) {
    const today = new Date().toISOString().slice(0, 10);
    db.run(`ALTER TABLE todos ADD COLUMN date TEXT DEFAULT '${today}'`);
    migrated = true;
  }
  if (migrated) {
    saveDB();
    console.log('✅ DB 마이그레이션 완료 (user, date 컬럼 추가)');
  }
  console.log(`✅ DB 연결: ${DB_PATH}`);
}

// ========================================
// 미들웨어
// ========================================
app.use(cors());
app.use(express.json());

// ========================================
// 인증 미들웨어
// ========================================
function auth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.replace('Bearer ', '').trim();
  const userId = sessions[token];
  if (!userId) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  req.userId = userId;
  req.user = USERS[userId];
  next();
}

// ========================================
// GET / — API 안내
// ========================================
app.get('/', (req, res) => {
  res.json({ name: 'Todo SQLite API', port: PORT, auth: '로그인 필요 (POST /api/login)' });
});

// Chrome DevTools 자동 요청 방지
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}));

// ========================================
// POST /api/login
// ========================================
app.post('/api/login', (req, res) => {
  const { id, password } = req.body;
  const user = USERS[id];
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
  }
  const token = generateToken();
  sessions[token] = user.id;
  res.json({ success: true, token, user: { id: user.id, name: user.name } });
});

// ========================================
// POST /api/logout
// ========================================
app.post('/api/logout', auth, (req, res) => {
  const token = req.headers['authorization'].replace('Bearer ', '').trim();
  delete sessions[token];
  res.json({ success: true, message: '로그아웃 완료' });
});

// ========================================
// GET /api/me
// ========================================
app.get('/api/me', auth, (req, res) => {
  res.json({ success: true, user: { id: req.user.id, name: req.user.name } });
});

// ========================================
// 헬퍼: 행 읽기
// ========================================
function queryRows(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows.map(r => ({ ...r, done: r.done === 1 }));
}

// ========================================
// GET /api/todos
// ========================================
app.get('/api/todos', auth, (req, res) => {
  try {
    const { category } = req.query;
    const rows = category
      ? queryRows('SELECT * FROM todos WHERE user=? AND category=? ORDER BY id', [req.userId, category])
      : queryRows('SELECT * FROM todos WHERE user=? ORDER BY id', [req.userId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// GET /api/todos/:id
// ========================================
app.get('/api/todos/:id', auth, (req, res) => {
  try {
    const rows = queryRows('SELECT * FROM todos WHERE id=? AND user=?', [Number(req.params.id), req.userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// POST /api/todos
// ========================================
app.post('/api/todos', auth, (req, res) => {
  try {
    const { category, title, date } = req.body;
    if (!category || !title) return res.status(400).json({ success: false, message: 'category와 title은 필수입니다.' });
    const validCategories = ['work', 'study', 'personal', 'shopping', 'health'];
    if (!validCategories.includes(category)) return res.status(400).json({ success: false, message: '유효하지 않은 카테고리입니다.' });

    const todoDate = date || new Date().toISOString().slice(0, 10);
    db.run('INSERT INTO todos (category, title, done, user, date) VALUES (?,?,0,?,?)',
      [category, title.trim(), req.userId, todoDate]);
    saveDB();

    const rows = queryRows('SELECT * FROM todos WHERE id=(SELECT MAX(id) FROM todos WHERE user=?)', [req.userId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// PUT /api/todos/:id
// ========================================
app.put('/api/todos/:id', auth, (req, res) => {
  try {
    const { category, title, done, date } = req.body;
    if (!category || !title) return res.status(400).json({ success: false, message: 'category와 title은 필수입니다.' });
    const exists = queryRows('SELECT id FROM todos WHERE id=? AND user=?', [Number(req.params.id), req.userId]);
    if (!exists.length) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });

    const todoDate = date || new Date().toISOString().slice(0, 10);
    db.run('UPDATE todos SET category=?, title=?, done=?, date=? WHERE id=? AND user=?',
      [category, title.trim(), done ? 1 : 0, todoDate, Number(req.params.id), req.userId]);
    saveDB();

    const rows = queryRows('SELECT * FROM todos WHERE id=? AND user=?', [Number(req.params.id), req.userId]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// PATCH /api/todos/:id/toggle
// ========================================
app.patch('/api/todos/:id/toggle', auth, (req, res) => {
  try {
    const rows = queryRows('SELECT * FROM todos WHERE id=? AND user=?', [Number(req.params.id), req.userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    const newDone = rows[0].done ? 0 : 1;
    db.run('UPDATE todos SET done=? WHERE id=? AND user=?', [newDone, Number(req.params.id), req.userId]);
    saveDB();
    res.json({ success: true, data: { ...rows[0], done: newDone === 1 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// DELETE /api/todos/:id
// ========================================
app.delete('/api/todos/:id', auth, (req, res) => {
  try {
    const rows = queryRows('SELECT id FROM todos WHERE id=? AND user=?', [Number(req.params.id), req.userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    db.run('DELETE FROM todos WHERE id=? AND user=?', [Number(req.params.id), req.userId]);
    saveDB();
    res.json({ success: true, message: `todo #${req.params.id} 삭제 완료` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// 서버 시작
// ========================================
loadDB().then(() => {
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`\n🚀 Todo SQLite API: http://localhost:${PORT}`);
      console.log(`   POST /api/login   { id, password }`);
      console.log(`   GET  /api/me`);
      console.log(`   GET  /api/todos   (인증 필요)`);
    });
  }
});

module.exports = app;
