require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "plant-shop-secret-2026";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plant_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS plant_products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price INTEGER NOT NULL,
      image_url TEXT,
      description TEXT,
      category VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS plant_cart (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES plant_users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES plant_products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );
  `);

  const { rows } = await pool.query("SELECT COUNT(*) FROM plant_products");
  if (parseInt(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO plant_products (name, price, image_url, description, category) VALUES
      ('몬스테라 델리시오사', 35000, 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&auto=format&fit=crop', '잎에 구멍이 뚫린 독특한 열대 식물. 공기 정화 효과 우수', '관엽'),
      ('피카스 움베르타', 45000, 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=400&auto=format&fit=crop', '반짝이는 큰 잎이 인상적인 고급 관엽식물. 인테리어에 최적', '관엽'),
      ('산세베리아', 18000, 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&auto=format&fit=crop', '물을 거의 안 줘도 되는 초보 식집사용 식물. 공기정화 1위', '다육'),
      ('스킨답서스', 12000, 'https://images.unsplash.com/photo-1600411833196-7c1f6b1a8b90?w=400&auto=format&fit=crop', '덩굴성 식물로 행잉 화분에 잘 어울림. 음지에서도 잘 자람', '덩굴'),
      ('알로에 베라', 15000, 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&auto=format&fit=crop', '화상과 피부 진정에 좋은 다육식물. 햇빛 좋아함', '다육'),
      ('칼라데아 오르비폴리아', 38000, 'https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?w=400&auto=format&fit=crop', '줄무늬 큰 잎이 아름다운 열대식물. 습도 높은 환경 선호', '관엽'),
      ('선인장 세트 (3종)', 22000, 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&auto=format&fit=crop', '물 안 줘도 되는 사막 식물. 인테리어 소품으로도 인기', '다육'),
      ('행운목', 28000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop', '행운과 번영을 상징. 키우기 쉽고 성장 빠름', '관엽'),
      ('아이비', 9000, 'https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=400&auto=format&fit=crop', '공기 중 포름알데히드 제거 효과. 반음지에서도 잘 자람', '덩굴'),
      ('필로덴드론 핑크 프린세스', 89000, 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=400&auto=format&fit=crop', '분홍빛 얼룩 무늬가 희귀하고 아름다운 프리미엄 식물', '관엽')
    `);
    console.log("✅ 식물 상품 10개 시드 완료");
  }
  console.log("✅ DB 초기화 완료");
}

const dbReady = initDB().catch(err => console.error("DB init error:", err.message));

app.use(async (_req, _res, next) => { await dbReady; next(); });

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "로그인이 필요합니다" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "유효하지 않은 토큰입니다" });
  }
}

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ error: "이메일, 비밀번호, 이름을 모두 입력하세요" });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO plant_users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
      [email, hash, name]
    );
    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, name: rows[0].name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ token, user: rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "이미 사용 중인 이메일입니다" });
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM plant_users WHERE email=$1", [email]);
    if (!rows.length)
      return res.status(401).json({ error: "이메일 또는 비밀번호가 틀렸습니다" });
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "이메일 또는 비밀번호가 틀렸습니다" });
    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, name: rows[0].name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: rows[0].id, email: rows[0].email, name: rows[0].name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    let q = "SELECT * FROM plant_products ORDER BY id";
    const params = [];
    if (category) {
      q = "SELECT * FROM plant_products WHERE category=$1 ORDER BY id";
      params.push(category);
    }
    const { rows } = await pool.query(q, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cart", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.quantity,
              p.id AS product_id, p.name, p.price, p.image_url, p.description, p.category
       FROM plant_cart c
       JOIN plant_products p ON c.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cart", auth, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO plant_cart (user_id, product_id, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = plant_cart.quantity + EXCLUDED.quantity
       RETURNING *`,
      [req.user.id, product_id, quantity]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/cart/:id", auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1)
      return res.status(400).json({ error: "수량은 1 이상이어야 합니다" });
    const { rows } = await pool.query(
      "UPDATE plant_cart SET quantity=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
      [quantity, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "항목을 찾을 수 없습니다" });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/cart/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM plant_cart WHERE id=$1 AND user_id=$2", [
      req.params.id,
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`🌿 초록 식물 가게 서버 → http://localhost:${PORT}`)
  );
}

module.exports = app;
