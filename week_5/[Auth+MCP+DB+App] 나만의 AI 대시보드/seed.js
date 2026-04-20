require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'expense',
      amount NUMERIC(12,2) NOT NULL,
      description VARCHAR(255),
      date TIMESTAMP DEFAULT NOW()
    )
  `);
  // 기존 테이블에 컬럼이 없으면 추가
  await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description VARCHAR(255)`);
  await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'expense'`)
    .catch(() => {}); // 이미 있으면 무시

  // 기존 30일 내 샘플 데이터 삭제 후 재삽입
  await pool.query(`DELETE FROM transactions WHERE date >= NOW() - INTERVAL '30 days'`);

  const rows = [
    ['카페', 'expense', 4500, '스타벅스 아메리카노', -1],
    ['카페', 'expense', 5200, '블루보틀 라떼', -3],
    ['카페', 'expense', 4000, '투썸 아이스티', -5],
    ['카페', 'expense', 6800, '카페 디저트 세트', -7],
    ['카페', 'expense', 4500, '이디야 커피', -10],
    ['식비', 'expense', 12000, '점심 한식', -1],
    ['식비', 'expense', 15000, '저녁 삼겹살', -2],
    ['식비', 'expense', 8500, '편의점 도시락', -4],
    ['식비', 'expense', 22000, '회식 치킨', -6],
    ['식비', 'expense', 9500, '국밥 점심', -8],
    ['식비', 'expense', 11000, '비빔밥 정식', -11],
    ['교통', 'expense', 1400, '지하철', -1],
    ['교통', 'expense', 1400, '지하철', -2],
    ['교통', 'expense', 12500, '택시', -4],
    ['교통', 'expense', 1400, '버스', -7],
    ['교통', 'expense', 45000, '기차 KTX', -14],
    ['쇼핑', 'expense', 35000, '의류 구매', -3],
    ['쇼핑', 'expense', 18900, '생활용품', -9],
    ['쇼핑', 'expense', 52000, '온라인 주문', -15],
    ['구독', 'expense', 13900, '넷플릭스', -5],
    ['구독', 'expense', 8900, '유튜브 프리미엄', -5],
    ['구독', 'expense', 11900, 'Cursor Pro', -5],
    ['수입', 'income', 3500000, '월급', -1],
    ['수입', 'income', 250000, '프리랜서 수당', -10],
  ];

  for (const [category, type, amount, description, daysAgo] of rows) {
    await pool.query(
      `INSERT INTO transactions (category, type, amount, description, date)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '${daysAgo} days')`,
      [category, type, amount, description]
    );
  }

  const result = await pool.query(`SELECT category, COUNT(*) as cnt, SUM(amount) as total FROM transactions WHERE date >= NOW() - INTERVAL '30 days' GROUP BY category ORDER BY total DESC`);
  console.log('\n✅ 삽입 완료\n');
  console.table(result.rows.map(r => ({ category: r.category, 건수: r.cnt, 합계: parseInt(r.total).toLocaleString() + '원' })));
  await pool.end();
}

seed().catch(err => { console.error('❌', err.message); process.exit(1); });
