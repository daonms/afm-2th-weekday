require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 월 필터 헬퍼
function monthRange(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const end = `${nextY}-${String(nextM).padStart(2, "0")}-01`;
  return { start, end };
}

// 1. 내역 조회
app.get("/api/transactions", async (req, res) => {
  try {
    const { type, month } = req.query;
    console.log(`[API] GET /api/transactions type=${type || "-"} month=${month || "-"}`);

    const params = [];
    const conditions = [];

    if (type === "income" || type === "expense") {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    const range = monthRange(month);
    if (range) {
      params.push(range.start);
      conditions.push(`date >= $${params.length}`);
      params.push(range.end);
      conditions.push(`date < $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT id, type, amount, category, memo, to_char(date, 'YYYY-MM-DD') as date, created_at FROM transactions ${where} ORDER BY date DESC, created_at DESC`,
      params
    );
    res.json({ data: rows });
  } catch (err) {
    console.error("[API] GET /api/transactions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. 내역 등록
app.post("/api/transactions", async (req, res) => {
  try {
    const { type, amount, category, memo, date } = req.body;
    console.log(`[API] POST /api/transactions type=${type} amount=${amount} category=${category}`);

    if (type !== "income" && type !== "expense")
      return res.status(400).json({ error: "type은 income 또는 expense여야 합니다" });
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0)
      return res.status(400).json({ error: "amount는 양수여야 합니다" });
    if (!category) return res.status(400).json({ error: "category는 필수입니다" });
    if (!date) return res.status(400).json({ error: "date는 필수입니다" });

    const { rows } = await pool.query(
      `INSERT INTO transactions (type, amount, category, memo, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, amount, category, memo, to_char(date, 'YYYY-MM-DD') as date, created_at`,
      [type, amountNum, category, memo || "", date]
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    console.error("[API] POST /api/transactions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. 내역 수정
app.put("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, memo, date } = req.body;
    console.log(`[API] PUT /api/transactions/${id}`);

    if (type !== "income" && type !== "expense")
      return res.status(400).json({ error: "type은 income 또는 expense여야 합니다" });
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0)
      return res.status(400).json({ error: "amount는 양수여야 합니다" });
    if (!category) return res.status(400).json({ error: "category는 필수입니다" });
    if (!date) return res.status(400).json({ error: "date는 필수입니다" });

    const { rows } = await pool.query(
      `UPDATE transactions SET type=$1, amount=$2, category=$3, memo=$4, date=$5
       WHERE id=$6
       RETURNING id, type, amount, category, memo, to_char(date, 'YYYY-MM-DD') as date, created_at`,
      [type, amountNum, category, memo || "", date, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "내역을 찾을 수 없습니다" });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error("[API] PUT /api/transactions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. 내역 삭제
app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[API] DELETE /api/transactions/${id}`);
    await pool.query("DELETE FROM transactions WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("[API] DELETE /api/transactions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. 요약 통계
app.get("/api/summary", async (req, res) => {
  try {
    const { month } = req.query;
    console.log(`[API] GET /api/summary month=${month || "-"}`);

    const params = [];
    const conditions = [];
    const range = monthRange(month);
    if (range) {
      params.push(range.start);
      conditions.push(`date >= $${params.length}`);
      params.push(range.end);
      conditions.push(`date < $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT type, category, amount FROM transactions ${where}`,
      params
    );

    let income_total = 0;
    let expense_total = 0;
    const categoryMap = {};

    for (const row of rows) {
      const amt = Number(row.amount) || 0;
      if (row.type === "income") {
        income_total += amt;
      } else {
        expense_total += amt;
        categoryMap[row.category] = (categoryMap[row.category] || 0) + amt;
      }
    }

    const by_category = Object.entries(categoryMap)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    // 프론트엔드 호환 형식으로 변환
    const byCategory = {};
    for (const item of by_category) {
      byCategory[item.category] = item.total;
    }
    res.json({
      income_total,
      expense_total,
      by_category,
      // 프론트엔드 키 형식
      totalIncome: income_total,
      totalExpense: expense_total,
      byCategory,
    });
  } catch (err) {
    console.error("[API] GET /api/summary error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Vercel serverless 환경에서는 listen() 호출하지 않음
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`💰 가계부 서버 시작 → http://localhost:${PORT}`);
  });
}

module.exports = app;
