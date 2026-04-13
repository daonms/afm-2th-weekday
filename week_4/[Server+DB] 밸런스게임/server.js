require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown';
}

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      option_a   TEXT NOT NULL,
      option_b   TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS votes (
      id          SERIAL PRIMARY KEY,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      choice      TEXT NOT NULL CHECK (choice IN ('A', 'B')),
      voter_ip    TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(question_id, voter_ip)
    );
    CREATE TABLE IF NOT EXISTS daily_questions (
      id             SERIAL PRIMARY KEY,
      day_group      INTEGER NOT NULL,
      question_order INTEGER NOT NULL,
      title          TEXT NOT NULL,
      option_a       TEXT NOT NULL,
      option_b       TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS daily_votes (
      id          SERIAL PRIMARY KEY,
      question_id INTEGER NOT NULL REFERENCES daily_questions(id) ON DELETE CASCADE,
      choice      TEXT NOT NULL CHECK (choice IN ('A', 'B')),
      voter_ip    TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(question_id, voter_ip)
    );
  `);
  await seedDailyQuestions();
  console.log('DB 초기화 완료');
}

async function seedDailyQuestions() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM daily_questions');
  if (parseInt(rows[0].count) > 0) return;

  const data = [
    // Day 1 — 직장/돈
    [1,1,'직장 선택','월급 500만원 + 주7일 출근','월급 300만원 + 주4일 출근'],
    [1,2,'일의 의미','평생 하기 싫은 일 하며 부자','평생 좋아하는 일 하며 평범'],
    [1,3,'직장 환경','싫어하는 상사 + 최고의 팀원','좋아하는 상사 + 최악의 팀원'],
    [1,4,'커리어 선택','안정적인 대기업','도전적인 스타트업'],
    [1,5,'목돈 vs 월급','10억 지금 당장 받기','매월 500만원씩 평생'],
    [1,6,'야근 딜레마','야근 후 두 배 성과급','칼퇴 후 기본 월급'],
    [1,7,'근무 방식','재택근무 풀타임','매일 오피스 출퇴근'],
    [1,8,'취업 전략','전문직 높은 연봉 오랜 공부','일반직 낮은 연봉 빠른 취업'],
    [1,9,'직장 내 평판','상사에게 인정받는 직원','동료들에게 사랑받는 직원'],
    [1,10,'은퇴 계획','30살 성공 후 50살 조기 은퇴','70살까지 하고 싶은 일'],

    // Day 2 — 연애/관계
    [2,1,'연애 스타일','설레지만 불안한 열정적 연애','편하지만 심심한 안정적 연애'],
    [2,2,'이상형','완벽하지만 나만 사랑하는 연인','약점 있지만 서로 깊이 사랑'],
    [2,3,'연인의 소통','솔직하게 다 말하는 연인','배려해서 필터링하는 연인'],
    [2,4,'거리와 마음','멀리 있지만 진심인 사람','가까이 있지만 애매한 사람'],
    [2,5,'우정의 깊이','친구 100명 알고 지내기','친구 5명과 깊게 사귀기'],
    [2,6,'연인과 시간','연인과 24시간 함께','연인과 적당한 거리 유지'],
    [2,7,'새 인연','첫사랑과 다시 시작','새로운 완벽한 인연 만남'],
    [2,8,'친구의 종류','내 모든 걸 아는 오래된 친구','나를 이상적으로 보는 새 친구'],
    [2,9,'가족과 독립','가족과 가까이 살기','독립해서 자유롭게 살기'],
    [2,10,'인생의 동반자','혼자지만 성공한 삶','평범하지만 사랑하는 사람과 함께'],

    // Day 3 — 초능력/판타지
    [3,1,'비행 vs 투명','하늘을 날 수 있는 능력','투명인간이 될 수 있는 능력'],
    [3,2,'언어 vs 이동','모든 언어를 구사하는 능력','어디든 순간이동하는 능력'],
    [3,3,'불로 vs 치유','영원히 늙지 않는 몸','어떤 병도 고칠 수 있는 능력'],
    [3,4,'기억 조작','기억을 지울 수 있는 능력','남의 마음을 읽는 능력'],
    [3,5,'시간 여행','과거로 돌아갈 수 있다','미래를 미리 볼 수 있다'],
    [3,6,'몸의 자유','잠을 안 자도 되는 몸','뭐든 먹어도 안 살찌는 몸'],
    [3,7,'무한 자원','무한한 돈을 만드는 능력','무한한 시간을 갖는 능력'],
    [3,8,'변신 vs 정지','원하는 모습으로 변신하는 능력','시간을 멈추는 능력'],
    [3,9,'영생의 딜레마','죽지 않는 불사의 삶','원할 때 편안히 떠날 수 있는 삶'],
    [3,10,'궁극의 능력','세상 모든 지식을 아는 것','세상 모든 사람과 친구가 되는 것'],

    // Day 4 — 음식/일상
    [4,1,'식사 선택','평생 한식만 먹기','평생 양식만 먹기'],
    [4,2,'일상의 포기','커피 없는 삶','유튜브 없는 삶'],
    [4,3,'평생 하나만','평생 같은 음식만 먹기','평생 같은 옷만 입기'],
    [4,4,'생활 패턴','아침형 인간','저녁형 인간'],
    [4,5,'하루 1시간','매일 운동 1시간','매일 독서/공부 1시간'],
    [4,6,'여행 스타일','여름 해외여행 1주일','사계절 국내여행'],
    [4,7,'주거 선택','도심의 작고 편리한 집','외곽의 넓고 조용한 집'],
    [4,8,'출퇴근 방법','대중교통으로 출퇴근','자가용으로 출퇴근'],
    [4,9,'디지털 디톡스','핸드폰 없는 한 달','SNS만 없는 한 달'],
    [4,10,'건강 vs 맛','맛없지만 몸에 좋은 음식만','맛있지만 건강에 나쁜 음식만'],

    // Day 5 — 인생철학
    [5,1,'시간 여행 선택','10년 전으로 돌아간다면','10년 후를 미리 본다면'],
    [5,2,'수명의 질','후회 없이 살다 일찍 죽기','아쉬움 있지만 오래 살기'],
    [5,3,'명성의 종류','전 세계가 아는 유명인','아는 사람 모두에게 사랑받는 사람'],
    [5,4,'삶의 의미','내 삶의 주인공으로 살기','누군가의 영웅이 되는 삶'],
    [5,5,'기억의 역설','기억 잃어도 행복한 삶','고통스럽지만 모든 걸 기억하는 삶'],
    [5,6,'꿈과 의미','꿈을 이루고 평범하게 살기','꿈은 못 이뤘지만 의미 있는 삶'],
    [5,7,'나 vs 타인','나를 위한 삶','타인을 위한 삶'],
    [5,8,'현재 vs 미래','지금 이 순간에 충실하기','미래를 위해 현재를 희생하기'],
    [5,9,'영향력의 범위','세상을 바꾸는 혁신가','가까운 사람들을 행복하게 하는 사람'],
    [5,10,'삶의 속도','짧고 굵게 사는 삶','길고 안정적으로 사는 삶'],

    // Day 6 — 미래/기술
    [6,1,'AI 세상','AI가 모든 일 대신하는 세상','사람이 직접 하는 아날로그 세상'],
    [6,2,'현실 vs 가상','가상현실 속 완벽한 삶','불완전하지만 현실의 삶'],
    [6,3,'기억 저장','기억을 USB에 저장하는 미래','기억이 자연스럽게 사라지는 삶'],
    [6,4,'디지털 친구','로봇 친구와 사는 미래','동물 친구와 사는 현재'],
    [6,5,'탐험의 꿈','우주여행이 가능한 미래','지구 심해 탐험'],
    [6,6,'정보 공개','모든 정보가 투명하게 공개','개인정보가 철저히 보호'],
    [6,7,'SNS 딜레마','SNS가 없는 세상','모든 생각이 공유되는 세상'],
    [6,8,'판결의 미래','AI가 판사인 세상','사람이 판사인 지금 세상'],
    [6,9,'노화 선택','노화를 막는 약이 있는 세상','자연스럽게 늙어가는 지금'],
    [6,10,'일의 미래','재택근무 완전 정착 세상','오피스 문화 그대로인 세상'],

    // Day 7 — 사회/현실
    [7,1,'계절의 저주','평생 여름만 있는 세상','평생 겨울만 있는 세상'],
    [7,2,'교육 시스템','시험이 없는 교육 시스템','지금처럼 시험으로 평가'],
    [7,3,'경제 체계','돈 없는 공유 경제 세상','지금처럼 자본주의 세상'],
    [7,4,'평화의 대가','전쟁 없지만 자유 제한','자유롭지만 갈등 있는 지금'],
    [7,5,'임금 평등','모두 같은 연봉 받는 세상','능력대로 차등 지급되는 지금'],
    [7,6,'진실의 세상','거짓말이 불가능한 세상','거짓말이 가능한 지금 세상'],
    [7,7,'교육 방식','학교 교육 완전 온라인화','직접 만나 배우는 지금 학교'],
    [7,8,'나이의 의미','나이 차별이 없는 세상','경험과 연차가 존중받는 지금'],
    [7,9,'국경의 의미','국가 없이 지구인으로 사는 세상','나라별 정체성 있는 지금'],
    [7,10,'미디어 선택','가짜뉴스 없지만 검열 있는 세상','자유롭지만 가짜뉴스 있는 지금'],
  ];

  for (const [dg, ord, title, a, b] of data) {
    await pool.query(
      'INSERT INTO daily_questions (day_group, question_order, title, option_a, option_b) VALUES ($1,$2,$3,$4,$5)',
      [dg, ord, title, a, b]
    );
  }
  console.log('일일 질문 시드 완료');
}

// ─── 커뮤니티 질문 ─────────────────────────────────

app.get('/api/questions', async (req, res) => {
  try {
    const { rows: questions } = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
    const results = await Promise.all(questions.map(q => aggregateVotes(q, 'votes', 'question_id')));
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/questions', async (req, res) => {
  const { title, option_a, option_b } = req.body;
  if (!title || !option_a || !option_b)
    return res.status(400).json({ error: '제목과 A/B 선택지를 모두 입력해주세요.' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO questions (title, option_a, option_b) VALUES ($1, $2, $3) RETURNING *',
      [title, option_a, option_b]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/votes', async (req, res) => {
  await handleVote(req, res, 'votes', 'questions');
});

app.get('/api/questions/:id/results', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM questions WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: '질문을 찾을 수 없습니다.' });
    res.json(await aggregateVotes(rows[0], 'votes', 'question_id'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── 일일 질문 ─────────────────────────────────────

app.get('/api/daily-questions', async (req, res) => {
  try {
    const dayGroup = (Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 7) + 1;
    const { rows: questions } = await pool.query(
      'SELECT * FROM daily_questions WHERE day_group = $1 ORDER BY question_order',
      [dayGroup]
    );
    const results = await Promise.all(questions.map(q => aggregateVotes(q, 'daily_votes', 'question_id')));
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/daily-votes', async (req, res) => {
  await handleVote(req, res, 'daily_votes', 'daily_questions');
});

// ─── 공통 헬퍼 ─────────────────────────────────────

async function aggregateVotes(q, voteTable, idCol) {
  const { rows } = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE choice = 'A') AS votes_a,
      COUNT(*) FILTER (WHERE choice = 'B') AS votes_b,
      COUNT(*) AS total
     FROM ${voteTable} WHERE ${idCol} = $1`,
    [q.id]
  );
  const vA = parseInt(rows[0].votes_a) || 0;
  const vB = parseInt(rows[0].votes_b) || 0;
  const tot = parseInt(rows[0].total) || 0;
  const pA = tot === 0 ? 50 : Math.round((vA / tot) * 100);
  return { ...q, votes_a: vA, votes_b: vB, total_votes: tot, percent_a: pA, percent_b: 100 - pA };
}

async function handleVote(req, res, voteTable, questionTable) {
  const { question_id, choice } = req.body;
  const voter_ip = getClientIp(req);
  if (!question_id || !['A', 'B'].includes(choice))
    return res.status(400).json({ error: '올바른 question_id와 choice가 필요합니다.' });
  try {
    const { rows: existing } = await pool.query(
      `SELECT id, choice FROM ${voteTable} WHERE question_id = $1 AND voter_ip = $2`,
      [question_id, voter_ip]
    );
    if (existing.length > 0) {
      if (existing[0].choice === choice)
        return res.status(409).json({ error: '이미 투표했습니다.', already_voted: true, choice });
      await pool.query(`UPDATE ${voteTable} SET choice = $1 WHERE id = $2`, [choice, existing[0].id]);
      return res.json({ message: '투표가 변경되었습니다.', changed: true });
    }
    await pool.query(
      `INSERT INTO ${voteTable} (question_id, choice, voter_ip) VALUES ($1, $2, $3)`,
      [question_id, choice, voter_ip]
    );
    res.status(201).json({ message: '투표 완료!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

initDB().then(() => {
  app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
}).catch(err => {
  console.error('DB 초기화 실패:', err.message);
  process.exit(1);
});
