require('dotenv').config();
const express  = require('express');
const { Pool } = require('pg');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = (process.env.JWT_SECRET || 'afm-week5-secret').trim();

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

// ── 미들웨어 ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// JWT 인증
function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ success: false, message: '토큰이 유효하지 않습니다.' }); }
}

// admin 전용
function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
  next();
}

// ── 로그인 (admin만 허용) ──────────────────────────────────────
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
    if (user.role !== 'admin')
      return res.status(403).json({ success: false, message: '관리자 계정만 접근 가능합니다.' });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ success: true, data: { token, username: user.username, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── 대시보드 통계 ──────────────────────────────────────────────
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [users, todos, done, todayDue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM W5_todo_app_01_users'),
      pool.query('SELECT COUNT(*) FROM W5_todo_app_01'),
      pool.query('SELECT COUNT(*) FROM W5_todo_app_01 WHERE done = true'),
      pool.query('SELECT COUNT(*) FROM W5_todo_app_01 WHERE due_date = $1 AND done = false', [today]),
    ]);
    res.json({
      success: true,
      data: {
        totalUsers:   parseInt(users.rows[0].count),
        totalTodos:   parseInt(todos.rows[0].count),
        doneTodos:    parseInt(done.rows[0].count),
        todayDue:     parseInt(todayDue.rows[0].count),
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── 전체 유저 목록 (Todo 수 포함) ─────────────────────────────
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.username, u.role, u.email, u.picture, u.created_at,
        COUNT(t.id)                    AS todo_count,
        COUNT(t.id) FILTER (WHERE t.done) AS done_count
      FROM W5_todo_app_01_users u
      LEFT JOIN W5_todo_app_01 t ON t.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── 유저 역할 변경 ────────────────────────────────────────────
app.patch('/api/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: cur } = await pool.query('SELECT role, username FROM W5_todo_app_01_users WHERE id = $1', [id]);
    if (!cur.length) return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
    if (cur[0].username === 'admin') return res.status(400).json({ success: false, message: 'admin 계정의 역할은 변경할 수 없습니다.' });
    const newRole = cur[0].role === 'admin' ? 'user' : 'admin';
    const { rows } = await pool.query(
      'UPDATE W5_todo_app_01_users SET role = $1 WHERE id = $2 RETURNING id, username, role',
      [newRole, id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── 유저 삭제 ────────────────────────────────────────────────
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: cur } = await pool.query('SELECT username FROM W5_todo_app_01_users WHERE id = $1', [id]);
    if (!cur.length) return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
    if (cur[0].username === 'admin') return res.status(400).json({ success: false, message: 'admin 계정은 삭제할 수 없습니다.' });
    await pool.query('DELETE FROM W5_todo_app_01_users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── 전체 Todo 목록 ────────────────────────────────────────────
app.get('/api/admin/todos', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, u.username, u.picture
      FROM W5_todo_app_01 t
      LEFT JOIN W5_todo_app_01_users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Todo 삭제 ────────────────────────────────────────────────
app.delete('/api/admin/todos/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('DELETE FROM W5_todo_app_01 WHERE id = $1 RETURNING *', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Todo를 찾을 수 없습니다.' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── 완료 Todo 일괄 삭제 ───────────────────────────────────────
app.delete('/api/admin/todos/done/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM W5_todo_app_01 WHERE done = true');
    res.json({ success: true, data: { deleted: rowCount } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`✅ Admin 서버 실행 중: http://localhost:${PORT}`));
}
module.exports = app;
