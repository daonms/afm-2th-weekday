require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const ImageKit = require("imagekit");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "daon-bakery-secret-2026";
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "daon@daonms.com")
  .split(",")
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ImageKit 클라이언트 (관리자 이미지 업로드용)
const imagekit = process.env.IMAGEKIT_PUBLIC_KEY
  ? new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    })
  : null;

// multer 메모리 스토리지 (서버리스/Vercel 호환). 5MB 제한.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
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
      stock INTEGER NOT NULL DEFAULT 100,
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
      status VARCHAR(50) NOT NULL DEFAULT 'PAID',
      items JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS shop_payment_intents (
      order_id VARCHAR(80) PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      product_id INTEGER REFERENCES shop_products(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS content_unlocks (
      user_id INTEGER NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
      order_id VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, product_id)
    );
  `);

  // 기존 테이블에 stock 컬럼이 없을 수 있으므로 안전 추가
  await pool.query(`
    ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 100;
  `);
  await pool.query(`
    ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS content_body TEXT;
  `);
  await pool.query(`
    ALTER TABLE shop_payment_intents ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES shop_products(id) ON DELETE SET NULL;
  `);

  const { rows } = await pool.query("SELECT COUNT(*) FROM shop_products");
  if (parseInt(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO shop_products (name, price, image_url, description, category, stock, content_body) VALUES
      ('AI 프롬프트 엔지니어링 실전 노트', 4500, 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&auto=format&fit=crop',
        '팀에서 바로 쓰는 시스템 프롬프트·RAG·평가 루프만 요약한 PDF 스타일 가이드입니다.',
        '튜토리얼', 999,
        '## 1. 시스템 프롬프트\\n- 역할·톤·금지 사항을 한 번에 쓴다.\\n- 예시: “한국어로, 코드는 코드 블록만.”\\n\\n## 2. RAG\\n- 청크 크기 400~800자, 겹침 15% 권장.\\n- 출처 토큰을 답 끝에 붙이면 환각이 줄어든다.\\n\\n## 3. 평가\\n- 10개의 고정 질문으로 회귀 점검, 점수는 매주만 비교.'),

      ('1인 창업자를 위한 계약·세금 체크리스트', 9000, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&auto=format&fit=crop',
        '용역·SaaS·오픈마켓 정산을 가정한 필수 항목만 모았습니다. (법률·세무 자문이 아닙니다.)',
        '가이드', 999,
        '## A. 견적·계약\\n- 범위·수정 횟수·지연 합의를 문서에 남긴다.\\n- 정산일·환불·해지는 별도 조항.\\n\\n## B. 세무 메모\\n- 사업자·간이/일반, 현금영수증 의무는 업종·매출에 따라 다름.\\n- **반드시 세무사·국세청 안내로 확인하세요.**'),

      ('주니어의 코드 리뷰 생존 전략', 3000, 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop',
        'PR 설명, 커밋 쪼개기, 리뷰 답장 템플릿까지. 짧은 실무 텍스트 콘텐츠.',
        '커리어', 999,
        '### PR에 넣을 것\\n- 배경 3줄 / 변경 요약 / 스크린샷·재현 / 롤백 계획\\n\\n### 리뷰 코멘트\\n- “반영: …” / “질문: …” / “다음 티켓: …” 로 구분해 답한다.\\n\\n(본문은 예시이며, 팀 문화에 맞게 수정하세요.)'),

      ('Figma to HTML 워크플로 90분', 12000, 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=400&auto=format&fit=crop',
        '오토레이아웃·스펙 추출·클래스 네이밍까지. 미니 강의형 롱폼 (유료).',
        '디자인', 999,
        '1) 프레임 구조 먼저 읽기\\n2) 8pt 그리드·타이포 스케일 맞추기\\n3) Pretext/컴포넌트 쪼개기\\n4) 토큰(색·간격) 표로 뽑기\\n5) 퍼블 리뷰는 스크린샷 diff\\n\\n*본 콘텐츠는 학습용 예시 텍스트입니다.*')
    `);
    console.log("✅ 유료 콘텐츠 4개 시드 완료");
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

// 선택 로그인 (토큰 있으면 req.user)
function authOptional(req, _res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

// 관리자 가드 (auth 뒤에 사용)
function adminOnly(req, res, next) {
  const email = String(req.user?.email || "").toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  }
  next();
}

// ── 라우트 ──────────────────────────────────────────────

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

// 현재 로그인 사용자 정보 (관리자 여부 포함)
app.get("/api/me", auth, (req, res) => {
  const email = String(req.user.email || "").toLowerCase();
  res.json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name },
    isAdmin: ADMIN_EMAILS.includes(email),
  });
});

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
    const isAdmin = ADMIN_EMAILS.includes(rows[0].email.toLowerCase());
    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, name: rows[0].name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ token, user: rows[0], isAdmin });
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
    const isAdmin = ADMIN_EMAILS.includes(rows[0].email.toLowerCase());
    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, name: rows[0].name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: { id: rows[0].id, email: rows[0].email, name: rows[0].name },
      isAdmin,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 콘텐츠 목록 — 미구매 시 content_body 제외, purchased 플래그
app.get("/api/products", authOptional, async (req, res) => {
  try {
    const { category, q } = req.query;
    const conds = [];
    const params = [];
    if (category) {
      params.push(category);
      conds.push(`category = $${params.length}`);
    }
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      conds.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT id, name, price, image_url, description, category, stock, content_body, created_at
       FROM shop_products ${where} ORDER BY id`,
      params
    );

    let unlocked = new Set();
    if (req.user) {
      const { rows: u } = await pool.query(
        "SELECT product_id FROM content_unlocks WHERE user_id = $1",
        [req.user.id]
      );
      unlocked = new Set(u.map((x) => x.product_id));
    }

    const data = rows.map((r) => {
      const purchased = unlocked.has(r.id);
      const { content_body, ...rest } = r;
      return {
        ...rest,
        purchased,
        content_body: purchased ? (content_body || "") : null,
      };
    });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 단일 콘텐츠 본문 (구매한 사용자만)
app.get("/api/content/:id", auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: "잘못된 id" });
    const { rows: ok } = await pool.query(
      "SELECT 1 FROM content_unlocks WHERE user_id = $1 AND product_id = $2",
      [req.user.id, id]
    );
    if (!ok.length) return res.status(403).json({ error: "구매한 콘텐츠만 열람할 수 있어요" });
    const { rows } = await pool.query(
      "SELECT id, name, description, content_body, image_url, category, price FROM shop_products WHERE id = $1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "콘텐츠를 찾을 수 없어요" });
    res.json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 관리자: 이미지 업로드 ───────────────────────────────
app.post("/api/admin/upload", auth, adminOnly, upload.single("image"), async (req, res) => {
  if (!imagekit)
    return res.status(500).json({ error: "ImageKit 환경변수가 설정되지 않았습니다" });
  if (!req.file) return res.status(400).json({ error: "이미지 파일이 없습니다" });
  try {
    const safeName = (req.file.originalname || "image").replace(/[^\w.\-]/g, "_");
    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: `${Date.now()}_${safeName}`,
      folder: "/afm-shop",
    });
    res.json({ url: result.url, fileId: result.fileId, name: result.name });
  } catch (err) {
    console.error("ImageKit 업로드 오류:", err.message);
    res.status(500).json({ error: "업로드 실패: " + err.message });
  }
});

// ── 관리자: 상품 등록 ───────────────────────────────────
app.post("/api/admin/products", auth, adminOnly, async (req, res) => {
  try {
    const { name, price, image_url, description, category, stock, content_body } = req.body;
    if (!name || !price || !category)
      return res.status(400).json({ error: "이름, 가격, 카테고리는 필수입니다" });
    const { rows } = await pool.query(
      `INSERT INTO shop_products (name, price, image_url, description, category, stock, content_body)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        name,
        Number(price),
        image_url || null,
        description || null,
        category,
        Number(stock ?? 999),
        content_body || null,
      ]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 관리자: 상품 삭제 ───────────────────────────────────
app.delete("/api/admin/products/:id", auth, adminOnly, async (req, res) => {
  try {
    await pool.query("DELETE FROM shop_products WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 관리자: 전체 주문 조회 ───────────────────────────────
app.get("/api/admin/orders", auth, adminOnly, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, u.email AS buyer_email, u.name AS buyer_name
       FROM shop_orders o
       LEFT JOIN shop_users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── 관리자: 주문 상태 변경 ───────────────────────────────
app.patch("/api/admin/orders/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const allowed = ["PAID", "PREPARING", "SHIPPING", "DELIVERED", "CANCELED"];
    const { status } = req.body;
    if (!allowed.includes(status))
      return res.status(400).json({ error: `상태값은 ${allowed.join(", ")} 중 하나여야 합니다` });
    const { rows } = await pool.query(
      "UPDATE shop_orders SET status=$1 WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "주문을 찾을 수 없습니다" });
    res.json({ data: rows[0] });
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

// 결제 직전: 토스에 넘길 orderId + 금액 + user_id (+ 단일 콘텐츠 product_id) 기록
app.post("/api/payment/prepare", auth, async (req, res) => {
  const amount = Math.round(Number((req.body && req.body.amount) ?? 0));
  const productId =
    req.body && req.body.productId != null ? parseInt(String(req.body.productId), 10) : null;

  if (!Number.isFinite(amount) || amount < 1)
    return res.status(400).json({ error: "금액이 올바르지 않습니다" });

  try {
    await pool.query(
      `DELETE FROM shop_payment_intents WHERE created_at < NOW() - INTERVAL '40 minutes'`
    );

    if (productId && Number.isFinite(productId)) {
      const { rows: pr } = await pool.query(
        "SELECT id, price FROM shop_products WHERE id = $1",
        [productId]
      );
      if (!pr.length) return res.status(404).json({ error: "콘텐츠를 찾을 수 없어요" });
      if (pr[0].price !== amount)
        return res.status(400).json({ error: "결제 금액이 콘텐츠 가격과 일치하지 않아요" });
      const { rows: dup } = await pool.query(
        "SELECT 1 FROM content_unlocks WHERE user_id = $1 AND product_id = $2",
        [req.user.id, productId]
      );
      if (dup.length) return res.status(400).json({ error: "이미 구매한 콘텐츠예요" });
    }

    const orderId = "ORD_" + crypto.randomBytes(18).toString("base64url");
    await pool.query(
      `INSERT INTO shop_payment_intents (order_id, user_id, amount, product_id) VALUES ($1, $2, $3, $4)`,
      [orderId, req.user.id, amount, productId || null]
    );
    res.json({ orderId, amount });
  } catch (err) {
    console.error("prepare:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 토스페이먼츠 결제 승인 + 주문 저장 (auth 불필요: shop_payment_intents 의 orderId 로 사용자 식별)
app.post("/api/payment/confirm", async (req, res) => {
  const paymentKey = req.body && req.body.paymentKey;
  const orderId = req.body && req.body.orderId;
  const amount = Math.round(Number((req.body && req.body.amount) ?? 0));
  if (!paymentKey || !orderId || !Number.isFinite(amount) || amount < 1)
    return res.status(400).json({ error: "결제 정보가 올바르지 않습니다" });

  try {
    const { rows: intentRows } = await pool.query(
      `SELECT user_id, amount, product_id FROM shop_payment_intents WHERE order_id = $1`,
      [orderId]
    );
    let userId;
    const intentProductId =
      intentRows.length && intentRows[0].product_id != null
        ? intentRows[0].product_id
        : null;

    if (intentRows.length) {
      if (intentRows[0].amount !== amount) {
        return res.status(400).json({ error: "결제 금액이 주문과 일치하지 않습니다" });
      }
      userId = intentRows[0].user_id;
    } else {
      // 구버전: intent 없이 JWT만 쓰던 경우(로컬스토리지 토큰 있을 때)
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(400).json({
          error:
            "결제 세션이 없습니다. 장바구니에서 다시 결제하기를 눌러 주세요. (로그인 상태 유지)",
        });
      }
      try {
        userId = jwt.verify(token, JWT_SECRET).id;
      } catch {
        return res.status(401).json({ error: "로그인이 만료되었습니다. 다시 로그인 후 주문 내역을 확인해 주세요." });
      }
    }

    // 1) 토스페이먼츠 승인
    const authHeader = "Basic " + Buffer.from(TOSS_SECRET_KEY + ":").toString("base64");
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossData = await tossRes.json();
    if (!tossRes.ok) throw new Error(tossData.message || "토스 결제 승인 실패");

    if (intentRows.length) {
      await pool.query(`DELETE FROM shop_payment_intents WHERE order_id = $1`, [orderId]);
    }

    let items;

    if (intentProductId) {
      const { rows: pr } = await pool.query(
        "SELECT id, name, price FROM shop_products WHERE id = $1",
        [intentProductId]
      );
      if (!pr.length) throw new Error("콘텐츠를 찾을 수 없습니다");
      items = [
        {
          product_id: pr[0].id,
          name: pr[0].name,
          price: Number(pr[0].price),
          quantity: 1,
        },
      ];
    } else {
      const { rows: cartRows } = await pool.query(
        `SELECT c.quantity, p.id AS product_id, p.name, p.price, p.image_url
         FROM shop_cart c JOIN shop_products p ON c.product_id = p.id
         WHERE c.user_id = $1`,
        [userId]
      );
      items = cartRows.map((r) => ({
        product_id: r.product_id,
        name: r.name,
        price: Number(r.price),
        quantity: r.quantity,
      }));
    }

    await pool.query(
      `INSERT INTO shop_orders (user_id, payment_key, order_id, amount, status, items)
       VALUES ($1,$2,$3,$4,'PAID',$5)`,
      [userId, paymentKey, orderId, amount, JSON.stringify(items)]
    );

    if (intentProductId) {
      await pool.query(
        `INSERT INTO content_unlocks (user_id, product_id, order_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [userId, intentProductId, orderId]
      );
    } else {
      await pool.query("DELETE FROM shop_cart WHERE user_id=$1", [userId]);
      const seen = new Set();
      for (const it of items) {
        const pid = it.product_id;
        if (seen.has(pid)) continue;
        seen.add(pid);
        await pool.query(
          `INSERT INTO content_unlocks (user_id, product_id, order_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, product_id) DO NOTHING`,
          [userId, pid, orderId]
        );
      }
    }

    res.json({ success: true, orderId, amount, items, unlockedProductId: intentProductId || null });
  } catch (err) {
    console.error("결제 오류:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 주문 내역 조회 (본인만)
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
    console.log(`🔓 유료 콘텐츠(토스) 서버 → http://localhost:${PORT}`)
  );
}

module.exports = app;
