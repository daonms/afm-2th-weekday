/**
 * 메모 앱 Express 서버
 *
 * - PostgreSQL(Supabase) 연결 · pg.Pool 방식
 * - 테이블: memo_app_memos (서버 시작 또는 첫 요청 시 자동 생성)
 * - CRUD API: GET/POST/PUT/DELETE /api/memos
 * - 정적 파일 서빙: index.html (같은 폴더)
 * - 로컬(`node server.js`) · Vercel 서버리스 듀얼 모드 지원
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// DB 연결 (Supabase Pooler)
// ---------------------------------------------------------------------------
// 환경변수가 있으면 우선 사용하고, 없으면 기본값(요청받은 URL) 사용.
// `.trim()`으로 trailing newline 방지.
const DEFAULT_DB_URL =
  'postgresql://postgres.hnwlvlnhfzwqwslndbzq:AFMom9mnyBNbc@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const connectionString = (process.env.DATABASE_URL || DEFAULT_DB_URL).trim();

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('[pg pool error]', err);
});

// ---------------------------------------------------------------------------
// DB 초기화 (lazy init — cold start 대응)
// ---------------------------------------------------------------------------
let dbInitialized = false;

// 테이블명: Supabase 공유 DB에 이전 버전의 `memo_app_memos`가 `id text` 스키마로
// 존재해 INSERT 충돌이 발생하므로, 이 앱 전용으로 v2 테이블을 사용한다.
const TABLE = 'memo_app_v2_memos';

async function initDB() {
  if (dbInitialized) return;
  const createSQL = `
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await pool.query(createSQL);
  dbInitialized = true;
  console.log(`[DB] ${TABLE} 테이블 준비 완료`);
}

// ---------------------------------------------------------------------------
// 미들웨어
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// /api 라우트 진입 전에 DB 초기화 보장
app.use('/api', async (_req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('[initDB 실패]', err);
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
    });
  }
});

// ---------------------------------------------------------------------------
// API 라우트
// ---------------------------------------------------------------------------

// GET /api/memos — 전체 메모 목록 (최근 수정순)
app.get('/api/memos', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, content, created_at, updated_at FROM ${TABLE} ORDER BY updated_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET /api/memos]', err);
    res.status(500).json({ success: false, message: '메모 목록 조회 실패' });
  }
});

// POST /api/memos — 메모 생성
app.post('/api/memos', async (req, res) => {
  try {
    const { title = '', content = '' } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO ${TABLE} (title, content)
       VALUES ($1, $2)
       RETURNING id, title, content, created_at, updated_at`,
      [String(title).slice(0, 200), String(content)]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[POST /api/memos]', err);
    res.status(500).json({ success: false, message: '메모 생성 실패' });
  }
});

// PUT /api/memos/:id — 메모 수정 (updated_at 갱신)
app.put('/api/memos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: '유효하지 않은 id' });
    }
    const { title = '', content = '' } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE ${TABLE}
       SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, title, content, created_at, updated_at`,
      [String(title).slice(0, 200), String(content), id]
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: '메모를 찾을 수 없습니다' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[PUT /api/memos/:id]', err);
    res.status(500).json({ success: false, message: '메모 수정 실패' });
  }
});

// DELETE /api/memos/:id — 메모 삭제
app.delete('/api/memos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: '유효하지 않은 id' });
    }
    const { rowCount } = await pool.query(
      `DELETE FROM ${TABLE} WHERE id = $1`,
      [id]
    );
    if (rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: '메모를 찾을 수 없습니다' });
    }
    res.json({ success: true, data: { id } });
  } catch (err) {
    console.error('[DELETE /api/memos/:id]', err);
    res.status(500).json({ success: false, message: '메모 삭제 실패' });
  }
});

// ---------------------------------------------------------------------------
// SPA fallback — index.html 서빙
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------------------------------------------------------------------------
// 에러 처리 미들웨어
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ success: false, message: '서버 오류' });
});

// ---------------------------------------------------------------------------
// 서버 시작 (로컬) · Vercel export (서버리스)
// ---------------------------------------------------------------------------
if (require.main === module) {
  // 로컬 실행: DB 초기화를 먼저 시도하되, 실패해도 서버는 계속 살려둠
  initDB().catch((err) => {
    console.error('[DB 초기 연결 실패 — 첫 요청 시 재시도]', err);
  });
  app.listen(PORT, () => {
    console.log(`메모 앱 서버 실행 중: http://localhost:${PORT}`);
  });
}

module.exports = app;
