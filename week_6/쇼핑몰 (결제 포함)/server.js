require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "daon-bakery-secret-2026";
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// DB 초기화 (테이블 생성 + 상품 시드)
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shop_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS shop_products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price INTEGER NOT NULL,
      image_url TEXT,
      description TEXT,
      category VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS shop_cart (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES shop_users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES shop_products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS shop_orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES shop_users(id) ON DELETE SET NULL,
      payment_key VARCHAR(255) UNIQUE NOT NULL,
      order_id VARCHAR(255) UNIQUE NOT NULL,
      amount INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'DONE',
      items JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const { rows } = await pool.query("SELECT COUNT(*) FROM shop_products");
  if (parseInt(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO shop_products (name, price, image_url, description, category) VALUES
      ('딸기 생크림 케이크', 38000, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&auto=format&fit=crop', '신선한 딸기가 듬뿍 올라간 시그니처 케이크', '케이크'),
      ('초코 가나슈 케이크', 35000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop', '진한 벨기에 초콜릿 가나슈 레이어 케이크', '케이크'),
      ('마카롱 세트 (6개)', 18000, 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&auto=format&fit=crop', '바닐라·딸기·초코·피스타치오 등 6가지 맛 구성', '마카롱'),
      ('버터 크로아상', 4500, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop', '프랑스산 버터로 결을 살린 정통 크로아상', '빵'),
      ('바스크 치즈케이크', 32000, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&auto=format&fit=crop', '겉은 바삭, 속은 촉촉한 스페인식 치즈케이크', '케이크'),
      ('레드벨벳 케이크', 40000, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&auto=format&fit=crop', '크림치즈 프로스팅을 얹은 레드벨벳 레이어 케이크', '케이크'),
      ('크렘 브륄레', 8500, 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&auto=format&fit=crop', '표면을 불로 그을려 바삭한 설탕층이 일품인 디저트', '디저트'),
      ('티라미수', 9000, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&auto=format&fit=crop', '마스카포네 치즈와 에스프레소의 클래식 조화', '디저트'),
      ('마들렌 세트 (8개)', 15000, 'https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=400&auto=format&fit=crop', '촉촉한 레몬향 마들렌 8개 세트', '쿠키'),
      ('에클레어', 6500, 'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?w=400&auto=format&fit=crop', '슈 반죽에 바닐라 크림을 가득 채운 프랑스 디저트', '디저트')
    `);
    console.log("✅ 상품 10개 시드 완료");
  }
  console.log("✅ DB 초기화 완료");
}

// 모듈 로드 시 백그라운드로 DB 초기화 (요청 블로킹 없음)
initDB().catch(err => console.error("DB init error:", err.message));

// Auth 미들웨어
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

// ── 라우트 ──────────────────────────────────────────────

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

// 회원가입
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ error: "이메일, 비밀번호, 이름을 모두 입력하세요" });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO shop_users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
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

// 로그인
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM shop_users WHERE email=$1", [email]);
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

// 상품 목록 (공개)
app.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    let q = "SELECT * FROM shop_products ORDER BY id";
    const params = [];
    if (category) {
      q = "SELECT * FROM shop_products WHERE category=$1 ORDER BY id";
      params.push(category);
    }
    const { rows } = await pool.query(q, params);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 장바구니 조회
app.get("/api/cart", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.quantity,
              p.id AS product_id, p.name, p.price, p.image_url, p.description, p.category
       FROM shop_cart c
       JOIN shop_products p ON c.product_id = p.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 장바구니 담기 (중복 시 수량 +1)
app.post("/api/cart", auth, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO shop_cart (user_id, product_id, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = shop_cart.quantity + EXCLUDED.quantity
       RETURNING *`,
      [req.user.id, product_id, quantity]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 수량 변경
app.put("/api/cart/:id", auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1)
      return res.status(400).json({ error: "수량은 1 이상이어야 합니다" });
    const { rows } = await pool.query(
      "UPDATE shop_cart SET quantity=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
      [quantity, req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "항목을 찾을 수 없습니다" });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 장바구니 삭제
app.delete("/api/cart/:id", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM shop_cart WHERE id=$1 AND user_id=$2", [
      req.params.id,
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 토스페이먼츠 결제 승인 + 주문 저장
app.post("/api/payment/confirm", auth, async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;
  if (!paymentKey || !orderId || !amount)
    return res.status(400).json({ error: "결제 정보가 올바르지 않습니다" });

  try {
    // 1) 토스페이먼츠 서버에 승인 요청
    const authHeader = "Basic " + Buffer.from(TOSS_SECRET_KEY + ":").toString("base64");
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossData = await tossRes.json();
    if (!tossRes.ok) throw new Error(tossData.message || "토스 결제 승인 실패");

    // 2) 장바구니 조회 → 주문 저장
    const { rows: cartRows } = await pool.query(
      `SELECT c.quantity, p.id AS product_id, p.name, p.price, p.image_url
       FROM shop_cart c JOIN shop_products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    const items = cartRows.map(r => ({
      product_id: r.product_id,
      name: r.name,
      price: Number(r.price),
      quantity: r.quantity,
    }));

    await pool.query(
      `INSERT INTO shop_orders (user_id, payment_key, order_id, amount, status, items)
       VALUES ($1,$2,$3,$4,'DONE',$5)`,
      [req.user.id, paymentKey, orderId, amount, JSON.stringify(items)]
    );

    // 3) 장바구니 비우기
    await pool.query("DELETE FROM shop_cart WHERE user_id=$1", [req.user.id]);

    res.json({ success: true, orderId, amount, items });
  } catch (err) {
    console.error("결제 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 주문 내역 조회
app.get("/api/orders", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM shop_orders WHERE user_id=$1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`🧁 다온 베이커리 서버 → http://localhost:${PORT}`)
  );
}

module.exports = app;
