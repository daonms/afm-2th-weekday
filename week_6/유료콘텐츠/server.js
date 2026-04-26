/**
 * AI 노트 잠금 해제 — 유료 콘텐츠 (Toss + JWT + PostgreSQL/Supabase)
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "afm-note-secret-change-in-prod";
const TOSS_SECRET_KEY =
  process.env.TOSS_SECRET_KEY || "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL 없음 — 로컬은 .env를 설정하세요");
    return;
  }
  // Pooler(특히 Supabase)는 한 연결에 다구문 나열이 실패하는 경우가 있어 구문별 실행
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contents (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      preview TEXT NOT NULL,
      body TEXT NOT NULL,
      price INTEGER NOT NULL,
      category VARCHAR(100),
      sales_count INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      is_best BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES content_users(id) ON DELETE CASCADE,
      content_id INTEGER NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
      payment_key VARCHAR(255) NOT NULL,
      order_id VARCHAR(255) NOT NULL,
      amount INTEGER NOT NULL,
      paid_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, content_id),
      UNIQUE (payment_key)
    )`);
  await pool.query(
    `ALTER TABLE contents ADD COLUMN IF NOT EXISTS is_best BOOLEAN NOT NULL DEFAULT false`
  );
  const { rows: cnt } = await pool.query("SELECT COUNT(*)::int AS c FROM contents");
  if (cnt[0].c === 0) {
    const rows = [
      {
        t: "Cursor에서 Claude / GPT를 쓰는 것과 '에이전트'로 쓰는 것의 경계",
        p: "요약 프롬프트만 쓰다 보면, 언젠가 동일한 질문에 피로해진다. 여기서는 '역할·맥락·검증 루프'를 한 장으로 고정하는 법을 정리한다.\n\n(미리보기) 룰 파일은 '규율'이지 '자동화'가 아니다. 팀 룰을 코드 리뷰하듯 주기적으로 갱신하지 않으면…",
        b: `## 1. 시스템 vs 유저 메시지
역할(시스템)과 질문(유저)을 섞지 않는다. 한 세션에 '불변 조건'은 시스템에 둔다.

## 2. 검증 루프
출력 → 스스로 "반례 2개" → 수정. 이 3문장만 추가해도 품질이 달라진다.

## 3. 토큰 예산
긴 맥락 대신, **요약 슬롯**을 먼저 쓰고 본질을 붙인다.

---
이하 실전 템플릿·금지어 목록·팀 룰 샘플 … (유료 본문)`,
        price: 1900,
        cat: "프롬프트·에이전트",
        img: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop",
        sc: 128,
        best: true,
      },
      {
        t: "Vercel / Docker 없이 '작동 수준'의 백엔드 붙이기",
        p: "과제·사이드 프로젝트에서 Express 한 파일 + Vercel serverless로 API를 띄우는 경로. 실패하는 지점(콜드스타트, env, CORS)만 짚는다.\n\n(미리보기) '배포됐다'와 'API가 살아있다'는 다르다. health 경로가 없으면…",
        b: `## 1. 최소 API 계약
GET /api/health — 배포·도메인·DNS 트리블슈의 기준점.

## 2. Vercel + Express
@vercel/node 단일 server.js + catch-all. 환경 변수는 Vercel 대시보드에만.

## 3. CORS
로컬 file://이 아니라 **항상 http 서버**로 열기.

---
Nginx·로그·SSL … (유료 본문)`,
        price: 2900,
        cat: "배포·운영",
        img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop",
        sc: 96,
        best: true,
      },
      {
        t: "회의 30분을 5분 AI 브리핑으로 줄이는 프롬프트",
        p: "녹취를 넣지 않아도, '의사결정 3개 + 미해결 2개 + 다음 액션' 형식으로만 받으면 문서가 된다. 반복 질의용 슬롯.\n\n(미리보기) 회의가 길어지는 이유는 '정보'가 아니라 '책임'이 흩어져서다…",
        b: `## 브리핑 슬롯
1) 결론 2) 근거 3) 리스크 4) 누가 5) 다음 마감

## 팀에 던질 질문
"이걸 **안 하면** 어떤 비용이 드는가?"

---
실제 프롬프트 전문·팀별 변형 5종 … (유료 본문)`,
        price: 1500,
        cat: "업무 효율",
        img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop",
        sc: 210,
        best: true,
      },
      {
        t: "LLM + DB + 툴 호출 구조를 그림으로 고정하는 법",
        p: "에이전트 흐름이 복잡해지면, '누가 기억하고 누가 도구를 쓰는지'가 흐트러진다. 이 노트는 레이어를 나누는 체크리스트다.\n\n(미리보기) RAG는 검색이지 추론이 아니다. 인덱싱이 아니라 **질문 정규화**가 먼저다…",
        b: `## 다이어그램
User → Policy → LLM → Tools (HTTP/SQL) → 답

## 경계
- **상태**는 DB, **휘발 대화**는 윈도우.
- **비밀**은 툴 쪽, 프롬프트에는 ID만.

---
시퀀스 다이어그램 Mermaid, 장애 시나리오 … (유료 본문)`,
        price: 3900,
        cat: "아키텍처",
        img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop",
        sc: 64,
        best: false,
      },
      {
        t: "API 키·로그·프롬프트 주입 점검 12항목",
        p: "프롬프트에 비밀을 넣지 않는다는 누구나 말한다. 여기서는 **레포·로그·에러 응답**에서 터지는 케이스만 모았다.\n\n(미리보기) .env는 커밋되지 않는다는 원칙을 CI와 로그에도 적용한다…",
        b: `## 12항목
1) 키 prefix 노출 2) 스택 트레이스 3) 쿠키·로컬스토리지 4) …

## 사고 났을 때
즉시 rotate → 영향 API 목록 → 공지.

---
체크리스트 인쇄용 … (유료 본문)`,
        price: 1200,
        cat: "보안",
        img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop",
        sc: 42,
        best: false,
      },
    ];
    for (const r of rows) {
      await pool.query(
        `INSERT INTO contents
         (title, preview, body, price, category, image_url, sales_count, is_best)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [r.t, r.p, r.b, r.price, r.cat, r.img, r.sc, r.best]
      );
    }
    console.log("✅ 콘텐츠 시드 완료");
  }
  console.log("✅ content DB 초기화 완료");
}

const dbReady = initDB().catch((err) => {
  console.error("DB init error:", err.message);
});

app.use(async (req, res, next) => {
  if (!req.path.startsWith("/api")) return next();
  try {
    await dbReady;
    return next();
  } catch (e) {
    return res.status(503).json({ error: "DB를 사용할 수 없습니다" });
  }
});

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "paid-content-notes",
    hasDb: !!process.env.DATABASE_URL,
  });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.name } });
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: "DATABASE_URL이 설정되지 않았습니다" });
    }
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "이메일, 비밀번호, 이름을 모두 입력하세요" });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO content_users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name",
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
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: "DATABASE_URL이 설정되지 않았습니다" });
    }
    const { email, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM content_users WHERE email=$1", [email]);
    if (!rows.length) {
      return res.status(401).json({ error: "이메일 또는 비밀번호가 틀렸습니다" });
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "이메일 또는 비밀번호가 틀렸습니다" });
    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email, name: rows[0].name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: { id: rows[0].id, email: rows[0].email, name: rows[0].name },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 목록(본문 제외, 미리보기만)
app.get("/api/contents", async (_req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ data: [] });
    }
    const { rows } = await pool.query(
      `SELECT id, title, preview, price, category, sales_count, image_url, is_best
       FROM contents ORDER BY is_best DESC, sales_count DESC, id`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 상세: JWT 있으면 구매 여부에 따라 body — 서버에서만 본문 허용
app.get("/api/contents/:id", async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: "DB 미연결" });
    }
    const { rows } = await pool.query("SELECT * FROM contents WHERE id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "콘텐츠를 찾을 수 없습니다" });
    const c = rows[0];
    const publicFields = {
      id: c.id,
      title: c.title,
      preview: c.preview,
      price: c.price,
      category: c.category,
      sales_count: c.sales_count,
      image_url: c.image_url,
      is_best: c.is_best,
    };
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.json({ ...publicFields, purchased: false, body: null, locked: true });
    }
    let user;
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.json({ ...publicFields, purchased: false, body: null, locked: true });
    }
    const { rows: pr } = await pool.query(
      "SELECT 1 FROM purchases WHERE user_id=$1 AND content_id=$2",
      [user.id, c.id]
    );
    if (pr.length) {
      return res.json({ ...publicFields, purchased: true, body: c.body, locked: false });
    }
    return res.json({ ...publicFields, purchased: false, body: null, locked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 구매 이력
app.get("/api/purchases", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.content_id, p.amount, p.paid_at, p.order_id,
              c.title, c.category, c.image_url, c.price
       FROM purchases p
       JOIN contents c ON c.id = p.content_id
       WHERE p.user_id = $1
       ORDER BY p.paid_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 토스 승인 + purchases INSERT (결제 키 idempotent)
app.post("/api/payment/confirm-content", auth, async (req, res) => {
  const { paymentKey, orderId, amount, content_id } = req.body;
  if (!paymentKey || !orderId || amount == null || !content_id) {
    return res.status(400).json({ error: "paymentKey, orderId, amount, content_id가 필요합니다" });
  }
  const cid = parseInt(content_id, 10);
  if (Number.isNaN(cid)) return res.status(400).json({ error: "content_id가 올바르지 않습니다" });

  try {
    const { rows: exPay } = await pool.query("SELECT * FROM purchases WHERE payment_key = $1", [
      paymentKey,
    ]);
    if (exPay.length) {
      if (exPay[0].user_id !== req.user.id) {
        return res.status(403).json({ error: "결제 정보가 일치하지 않습니다" });
      }
      return res.json({
        success: true,
        orderId: exPay[0].order_id,
        amount: exPay[0].amount,
        content_id: exPay[0].content_id,
        already: true,
      });
    }

    const { rows: cr } = await pool.query("SELECT id, price FROM contents WHERE id = $1", [cid]);
    if (!cr.length) return res.status(404).json({ error: "콘텐츠를 찾을 수 없습니다" });
    if (Number(cr[0].price) !== Number(amount)) {
      return res.status(400).json({ error: "결제 금액이 콘텐츠 가격과 일치하지 않습니다" });
    }

    const { rows: dup } = await pool.query(
      "SELECT 1 FROM purchases WHERE user_id = $1 AND content_id = $2",
      [req.user.id, cid]
    );
    if (dup.length) {
      return res.status(400).json({ error: "이미 구매한 콘텐츠입니다" });
    }

    const authHeader = "Basic " + Buffer.from(TOSS_SECRET_KEY + ":").toString("base64");
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });
    const tossData = await tossRes.json();
    if (!tossRes.ok) {
      return res.status(400).json({ error: tossData.message || "토스 결제 승인 실패" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO purchases (user_id, content_id, payment_key, order_id, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, cid, paymentKey, orderId, Number(amount)]
      );
      await client.query("UPDATE contents SET sales_count = sales_count + 1 WHERE id = $1", [cid]);
      await client.query("COMMIT");
    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}
      if (e.code === "23505") {
        return res.status(409).json({ error: "중복 결제 처리 — 구매 이력을 확인하세요" });
      }
      console.error("DB after Toss success:", e.message);
      return res.status(500).json({
        error:
          "결제는 승인되었으나 기록 실패했습니다. 고객센터에 문의하세요. (paymentKey 보관)",
      });
    } finally {
      client.release();
    }

    return res.json({
      success: true,
      orderId,
      amount: Number(amount),
      content_id: cid,
      already: false,
    });
  } catch (err) {
    console.error("confirm-content:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

if (require.main === module) {
  app.listen(PORT, () => console.log(`📚 AI 노트 서버 → http://localhost:${PORT}`));
}

module.exports = app;
