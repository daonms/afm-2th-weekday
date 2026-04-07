const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_DIR = __dirname;
const CATEGORIES = ['work', 'study', 'personal', 'shopping', 'health'];

// ========================================
// 사용자 정의
// ========================================
const USERS = {
  admin: { id: 'admin', name: '관리자', password: '1234' },
};

const sessions = {}; // token → userId

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

// ========================================
// JSON 파일 로드/저장
// ========================================
let todos = [];
let nextId = 1;

function filePath(category) {
  return path.join(DATA_DIR, `todos_${category}.json`);
}

function loadAll() {
  todos = [];
  let globalId = 1;
  const today = new Date().toISOString().slice(0, 10);

  for (const category of CATEGORIES) {
    const fp = filePath(category);
    if (!fs.existsSync(fp)) continue;
    try {
      const items = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      for (const item of items) {
        todos.push({
          id: globalId++,
          category,
          title: item.title,
          done: !!item.done,
          user: item.user || 'admin',
          date: item.date || today,
        });
      }
    } catch (e) {
      console.error(`⚠️  ${fp} 읽기 실패:`, e.message);
    }
  }
  nextId = globalId;
  console.log(`✅ JSON 파일 로드 완료 — 총 ${todos.length}개`);
}

function saveCategory(category) {
  const items = todos
    .filter(t => t.category === category)
    .map((t, i) => ({ id: i + 1, title: t.title, done: t.done, user: t.user, date: t.date }));
  fs.writeFileSync(filePath(category), JSON.stringify(items, null, 2), 'utf-8');
}

loadAll();

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
// GET /
// ========================================
app.get('/', (req, res) => {
  res.json({ name: 'Todo JSON API', port: PORT, auth: '로그인 필요 (POST /api/login)' });
});

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
// GET /api/todos
// ========================================
app.get('/api/todos', auth, (req, res) => {
  try {
    const { category } = req.query;
    const data = todos.filter(t => {
      if (t.user !== req.userId) return false;
      if (category && t.category !== category) return false;
      return true;
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// GET /api/todos/:id
// ========================================
app.get('/api/todos/:id', auth, (req, res) => {
  try {
    const todo = todos.find(t => t.id === Number(req.params.id) && t.user === req.userId);
    if (!todo) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    res.json({ success: true, data: todo });
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
    if (!CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: '유효하지 않은 카테고리입니다.' });

    const newTodo = {
      id: nextId++,
      category,
      title: title.trim(),
      done: false,
      user: req.userId,
      date: date || new Date().toISOString().slice(0, 10),
    };
    todos.push(newTodo);
    saveCategory(category);
    res.status(201).json({ success: true, data: newTodo });
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
    const idx = todos.findIndex(t => t.id === Number(req.params.id) && t.user === req.userId);
    if (idx === -1) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });

    const oldCategory = todos[idx].category;
    todos[idx] = { ...todos[idx], category, title: title.trim(), done: !!done, date: date || todos[idx].date };
    if (oldCategory !== category) saveCategory(oldCategory);
    saveCategory(category);
    res.json({ success: true, data: todos[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// PATCH /api/todos/:id/toggle
// ========================================
app.patch('/api/todos/:id/toggle', auth, (req, res) => {
  try {
    const idx = todos.findIndex(t => t.id === Number(req.params.id) && t.user === req.userId);
    if (idx === -1) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    todos[idx].done = !todos[idx].done;
    saveCategory(todos[idx].category);
    res.json({ success: true, data: todos[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// DELETE /api/todos/:id
// ========================================
app.delete('/api/todos/:id', auth, (req, res) => {
  try {
    const idx = todos.findIndex(t => t.id === Number(req.params.id) && t.user === req.userId);
    if (idx === -1) return res.status(404).json({ success: false, message: '존재하지 않는 todo입니다.' });
    const [removed] = todos.splice(idx, 1);
    saveCategory(removed.category);
    res.json({ success: true, message: `todo #${removed.id} 삭제 완료` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// POST /api/reload
// ========================================
app.post('/api/reload', (req, res) => {
  try {
    loadAll();
    res.json({ success: true, message: `리로드 완료 — 총 ${todos.length}개` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// 서버 시작
// ========================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Todo JSON API: http://localhost:${PORT}`);
    console.log(`   POST /api/login   { id, password }`);
    console.log(`   GET  /api/me`);
    console.log(`   GET  /api/todos   (인증 필요)`);
  });
}

module.exports = app;
