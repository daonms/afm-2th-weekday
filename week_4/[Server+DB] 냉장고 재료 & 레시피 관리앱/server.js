const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3004;

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

  // 재료 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT '기타',
      quantity    TEXT NOT NULL DEFAULT '',
      expire_date DATE DEFAULT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 기존 테이블에 expire_date 컬럼이 없으면 추가 (마이그레이션)
  await pool.query(`
    ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS expire_date DATE DEFAULT NULL
  `);

  // 레시피 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id           SERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      ingredients  TEXT NOT NULL,
      instructions TEXT NOT NULL,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  dbInitialized = true;
  console.log('✅ DB 초기화 완료 (ingredients + recipes 테이블)');
}

// ========================================
// 미들웨어
// ========================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// DB 초기화 미들웨어
app.use(async (req, res, next) => {
  await initDB();
  next();
});

// ========================================
// 재료 API
// ========================================

// 유통기한 상태 계산 헬퍼
function getExpireStatus(expireDate) {
  if (!expireDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expireDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((exp - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { status: 'expired',  diffDays, label: `${Math.abs(diffDays)}일 초과` };
  if (diffDays === 0) return { status: 'today',    diffDays, label: '오늘 만료' };
  if (diffDays <= 3)  return { status: 'warning',  diffDays, label: `D-${diffDays}` };
  return               { status: 'ok',      diffDays, label: `D-${diffDays}` };
}

// 재료 전체 조회
app.get('/api/ingredients', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ingredients ORDER BY expire_date ASC NULLS LAST, category, name ASC'
    );
    const rows = result.rows.map(r => ({
      ...r,
      expireStatus: getExpireStatus(r.expire_date),
    }));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '재료 조회 실패' });
  }
});

// 재료 추가
app.post('/api/ingredients', async (req, res) => {
  const { name, category = '기타', quantity = '', expire_date = null } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '재료명은 필수입니다' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO ingredients (name, category, quantity, expire_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), category.trim(), quantity.trim(), expire_date || null]
    );
    const row = { ...result.rows[0], expireStatus: getExpireStatus(result.rows[0].expire_date) };
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '재료 추가 실패' });
  }
});

// 재료 삭제
app.delete('/api/ingredients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM ingredients WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '재료를 찾을 수 없습니다' });
    }
    res.json({ message: '삭제 완료', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '재료 삭제 실패' });
  }
});

// ========================================
// 레시피 API
// ========================================

// 레시피 전체 조회
app.get('/api/recipes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM recipes ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '레시피 조회 실패' });
  }
});

// 레시피 단건 조회
app.get('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '레시피를 찾을 수 없습니다' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '레시피 조회 실패' });
  }
});

// 레시피 추가
app.post('/api/recipes', async (req, res) => {
  const { title, ingredients, instructions } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: '요리명은 필수입니다' });
  }
  if (!ingredients || !ingredients.trim()) {
    return res.status(400).json({ error: '재료는 필수입니다' });
  }
  if (!instructions || !instructions.trim()) {
    return res.status(400).json({ error: '조리법은 필수입니다' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO recipes (title, ingredients, instructions) VALUES ($1, $2, $3) RETURNING *',
      [title.trim(), ingredients.trim(), instructions.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '레시피 추가 실패' });
  }
});

// 레시피 삭제
app.delete('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM recipes WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: '레시피를 찾을 수 없습니다' });
    }
    res.json({ message: '삭제 완료', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '레시피 삭제 실패' });
  }
});

// ========================================
// 냉장고를 부탁해 스크래핑 + 매칭 API
// ========================================

const SCRAPE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

// 10분 캐시 (불필요한 반복 스크래핑 방지)
let suggestCache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

// 만개의레시피 목록 페이지에서 레시피 카드 스크래핑
async function scrapeRecipeList(keyword = '냉장고를 부탁해', page = 1) {
  const url = `https://www.10000recipe.com/recipe/list.html?q=${encodeURIComponent(keyword)}&page=${page}`;
  const { data } = await axios.get(url, { headers: SCRAPE_HEADERS, timeout: 10000 });
  const $ = cheerio.load(data);

  const recipes = [];
  $('li.common_sp_list_li').each((_, el) => {
    const link = $(el).find('a.common_sp_link').attr('href');
    const img  = $(el).find('.common_sp_thumb img').attr('src') || '';
    const title = $(el).find('.common_sp_caption_tit').text().trim();
    if (!link || !title) return;
    const id = link.replace('/recipe/', '');
    if (!/^\d+$/.test(id)) return;
    recipes.push({ id, title, img, url: `https://www.10000recipe.com${link}` });
  });
  return recipes;
}

// 개별 레시피 상세 (재료 목록) 스크래핑
async function scrapeRecipeDetail(id) {
  const url = `https://www.10000recipe.com/recipe/${id}`;
  const { data } = await axios.get(url, { headers: SCRAPE_HEADERS, timeout: 10000 });
  const $ = cheerio.load(data);

  const ingredientNames = [];
  $('.ingre_list_name').each((_, el) => {
    const name = $(el).text().trim();
    if (name) ingredientNames.push(name);
  });

  return ingredientNames;
}

// 냉장고 재료와 레시피 재료 매칭
function calcMatch(fridgeIngredients, recipeIngredients) {
  if (!recipeIngredients.length) return { matched: [], missing: [], score: 0 };
  const fridgeSet = fridgeIngredients.map(f => f.name.toLowerCase());
  const matched = [];
  const missing = [];

  for (const ri of recipeIngredients) {
    const riLower = ri.toLowerCase();
    // 냉장고 재료 중 일부라도 포함되면 매칭 (예: '대파' ⊂ '대파 1/2대')
    const found = fridgeSet.some(f => riLower.includes(f) || f.includes(riLower));
    if (found) matched.push(ri);
    else missing.push(ri);
  }

  const score = Math.round((matched.length / recipeIngredients.length) * 100);
  return { matched, missing, score };
}

// GET /api/suggest?keyword=냉장고를+부탁해&page=1
app.get('/api/suggest', async (req, res) => {
  const keyword = req.query.keyword || '냉장고를 부탁해';
  const page    = parseInt(req.query.page) || 1;
  const cacheKey = `${keyword}-${page}`;

  // 캐시 유효 시 즉시 반환
  if (suggestCache && suggestCache.key === cacheKey && Date.now() - cacheTime < CACHE_TTL) {
    return res.json(suggestCache.data);
  }

  try {
    // 1) 냉장고 재료 조회
    const dbResult = await pool.query('SELECT name FROM ingredients');
    const fridgeIngredients = dbResult.rows;

    // 2) 레시피 목록 스크래핑
    console.log(`🔍 [suggest] 스크래핑: "${keyword}" page=${page}`);
    const recipeCards = await scrapeRecipeList(keyword, page);

    // 3) 각 레시피 상세(재료) 스크래핑 — 최대 12개 병렬
    const limited = recipeCards.slice(0, 12);
    const details = await Promise.allSettled(
      limited.map(async (r) => {
        const ingNames = await scrapeRecipeDetail(r.id);
        const match = calcMatch(fridgeIngredients, ingNames);
        return { ...r, recipeIngredients: ingNames, ...match };
      })
    );

    const results = details
      .filter(d => d.status === 'fulfilled')
      .map(d => d.value)
      .sort((a, b) => b.score - a.score); // 매칭률 높은 순 정렬

    // 캐시 저장
    suggestCache = { key: cacheKey, data: { results, fridgeCount: fridgeIngredients.length } };
    cacheTime = Date.now();

    res.json({ results, fridgeCount: fridgeIngredients.length });
  } catch (err) {
    console.error('suggest error:', err.message);
    res.status(500).json({ error: '레시피 추천 실패: ' + err.message });
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
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log('📦 재료 API: /api/ingredients');
  console.log('🍳 레시피 API: /api/recipes');
  console.log('🔍 추천 API: /api/suggest');
});
