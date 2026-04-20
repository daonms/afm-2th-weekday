const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'dashboard-secret';

function callGroq(messages, maxTokens = 400) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7
    });
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(process.env.GROK_API_KEY || '').trim()}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          resolve(json.choices[0].message.content);
        } catch (e) {
          reject(new Error('Groq 응답 파싱 실패: ' + data.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── DB 초기화 ──────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dashboard_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
initDB().catch(console.error);

// ── 미들웨어: JWT 검증 ────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '토큰이 유효하지 않습니다' });
  }
}

// ── Auth: 회원가입 ─────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: '이메일, 비밀번호, 이름을 모두 입력하세요' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO dashboard_users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hash, name]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: '이미 가입된 이메일입니다' });
    res.status(500).json({ error: err.message });
  }
});

// ── Auth: 로그인 ───────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요' });
  }
  try {
    const result = await pool.query('SELECT * FROM dashboard_users WHERE email=$1', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Auth: 내 정보 ──────────────────────────────────────────
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ── DB 요약 ────────────────────────────────────────────────
app.get('/api/db-summary', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM transactions
      WHERE date >= NOW() - INTERVAL '30 days'
      GROUP BY category
      ORDER BY total DESC
    `);

    const totalResult = await pool.query(`
      SELECT
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income,
        COUNT(*) as total_count
      FROM transactions
      WHERE date >= NOW() - INTERVAL '30 days'
    `);

    res.json({
      byCategory: result.rows,
      summary: totalResult.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 날씨 ───────────────────────────────────────────────────
app.get('/api/weather', requireAuth, (req, res) => {
  const url = 'https://wttr.in/Seoul?format=j1&lang=ko';
  https.get(url, { headers: { 'User-Agent': 'curl/7.68.0' } }, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try {
        const json = JSON.parse(data);
        const current = json.current_condition[0];
        const weather = {
          temp: current.temp_C,
          feels_like: current.FeelsLikeC,
          desc: current.weatherDesc[0].value,
          humidity: current.humidity,
          wind: current.windspeedKmph,
          city: 'Seoul'
        };
        res.json(weather);
      } catch {
        res.status(500).json({ error: '날씨 파싱 실패' });
      }
    });
  }).on('error', (err) => res.status(500).json({ error: err.message }));
});

// ── AI 브리핑 ──────────────────────────────────────────────
app.post('/api/briefing', requireAuth, async (req, res) => {
  const { weather, dbSummary } = req.body;
  const userName = req.user.name;

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  });

  const weatherText = weather
    ? `현재 서울 날씨: ${weather.temp}°C (체감 ${weather.feels_like}°C), ${weather.desc}, 습도 ${weather.humidity}%`
    : '날씨 정보 없음';

  const dbText = dbSummary
    ? `최근 30일 지출 요약:\n${dbSummary.byCategory.map(r =>
        `- ${r.category}: ${parseInt(r.total).toLocaleString()}원 (${r.count}건)`
      ).join('\n')}\n총 지출: ${parseInt(dbSummary.summary.total_expense).toLocaleString()}원`
    : '지출 데이터 없음';

  const systemPrompt = `당신은 ${userName}님의 개인 AI 어시스턴트입니다.
매일 아침 맞춤형 브리핑을 제공합니다.
사용자 정보: DAONMS AI 솔루션 대표, 부트캠프 수강 중, 카페를 즐겨 방문함.
간결하고 따뜻하게, 실용적인 인사이트를 담아 150단어 이내로 작성하세요.`;

  const userMsg = `오늘 날짜: ${today}
${weatherText}
${dbText}

위 정보를 바탕으로 ${userName}님을 위한 오늘 하루 AI 브리핑을 작성해주세요.
날씨에 맞는 조언, 지출 패턴 분석, 오늘의 동기부여 메시지를 포함하세요.`;

  try {
    const briefing = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMsg }
    ]);
    res.json({ briefing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 정적 파일 (index.html) ────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Dashboard running on http://localhost:${PORT}`));
module.exports = app;
