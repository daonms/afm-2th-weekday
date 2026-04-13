const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;

// ========================================
// DB 연결 (Supabase PostgreSQL)
// ========================================
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres.ggvsoogzuvdjoelkwmdh:UaW1CjaVA6fT6GwL@aws-1-us-east-1.pooler.supabase.com:6543/postgres').trim(),
  ssl: { rejectUnauthorized: false },
});

// ========================================
// DB 초기화 (테이블 생성)
// ========================================
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;

  await pool.query("SET client_encoding TO 'UTF8'");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id         SERIAL PRIMARY KEY,
      category   TEXT NOT NULL,
      content    TEXT NOT NULL,
      likes      INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS replies (
      id         SERIAL PRIMARY KEY,
      post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  dbInitialized = true;
  console.log('DB 초기화 완료 (posts 테이블)');
}

// ========================================
// 미들웨어
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// DB 초기화 미들웨어
app.use(async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('DB 초기화 실패:', err);
    res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// ========================================
// 게시글 API
// ========================================

// 게시글 목록 조회
// GET /api/posts?sort=latest|likes
app.get('/api/posts', async (req, res) => {
  try {
    const sort = req.query.sort || 'latest';
    const orderBy = sort === 'likes'
      ? 'likes DESC, created_at DESC'
      : 'created_at DESC';

    const result = await pool.query(
      `SELECT * FROM posts ORDER BY ${orderBy}`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('게시글 조회 실패:', err);
    res.status(500).json({ success: false, message: '게시글 조회 실패' });
  }
});

// 게시글 생성
// POST /api/posts  body: { category, content }
app.post('/api/posts', async (req, res) => {
  const { category, content } = req.body;

  if (!category || !category.trim()) {
    return res.status(400).json({ success: false, message: '카테고리는 필수입니다' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: '내용은 필수입니다' });
  }

  const validCategories = ['고민', '칭찬', '응원'];
  if (!validCategories.includes(category.trim())) {
    return res.status(400).json({ success: false, message: '카테고리는 고민, 칭찬, 응원 중 하나여야 합니다' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO posts (category, content) VALUES ($1, $2) RETURNING *',
      [category.trim(), content.trim()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('게시글 생성 실패:', err);
    res.status(500).json({ success: false, message: '게시글 생성 실패' });
  }
});

// 공감 +1
// POST /api/posts/:id/like
app.post('/api/posts/:id/like', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE posts SET likes = likes + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('공감 처리 실패:', err);
    res.status(500).json({ success: false, message: '공감 처리 실패' });
  }
});

// ========================================
// 댓글 API
// ========================================

// 댓글 목록 조회
// GET /api/posts/:id/replies
app.get('/api/posts/:id/replies', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM replies WHERE post_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('댓글 조회 실패:', err);
    res.status(500).json({ success: false, message: '댓글 조회 실패' });
  }
});

// 댓글 작성
// POST /api/posts/:id/replies  body: { content }
app.post('/api/posts/:id/replies', async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: '내용은 필수입니다' });
  }

  try {
    // 게시글 존재 확인
    const post = await pool.query('SELECT id FROM posts WHERE id = $1', [req.params.id]);
    if (post.rowCount === 0) {
      return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다' });
    }

    const result = await pool.query(
      'INSERT INTO replies (post_id, content) VALUES ($1, $2) RETURNING *',
      [req.params.id, content.trim()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('댓글 작성 실패:', err);
    res.status(500).json({ success: false, message: '댓글 작성 실패' });
  }
});

// ========================================
// index.html 서빙
// ========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========================================
// 서버 시작
// ========================================
if (require.main === module) {
  app.listen(PORT, async () => {
    await initDB();
    console.log(`서버 실행 중: http://localhost:${PORT}`);
    console.log('게시글 API: /api/posts');
  });
}

module.exports = app;
