require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3002;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const groq = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

// Context 파일 내용 반환
app.get("/api/context", (_req, res) => {
  try {
    const content = fs.readFileSync(path.join(__dirname, "user-context.md"), "utf-8");
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DB 요약 — 최근 30일 transactions
app.get("/api/db-summary", async (_req, res) => {
  try {
    const { rows: catRows } = await pool.query(`
      SELECT type, category, SUM(amount) AS total, COUNT(*) AS cnt
      FROM transactions
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY type, category
      ORDER BY type, total DESC
    `);

    const { rows: recentRows } = await pool.query(`
      SELECT type, amount, category, memo, to_char(date, 'YYYY-MM-DD') AS date
      FROM transactions
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date DESC
      LIMIT 15
    `);

    let incomeTotal = 0;
    let expenseTotal = 0;
    const byCategory = {};

    for (const row of catRows) {
      const amt = Number(row.total);
      if (row.type === "income") incomeTotal += amt;
      else {
        expenseTotal += amt;
        byCategory[row.category] = (byCategory[row.category] || 0) + amt;
      }
    }

    res.json({
      incomeTotal,
      expenseTotal,
      balance: incomeTotal - expenseTotal,
      byCategory,
      recentTransactions: recentRows,
    });
  } catch (err) {
    console.error("[DB Summary]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// AI 채팅 — withContext true/false로 Before/After 분기
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], withContext } = req.body;

    let systemPrompt =
      "당신은 도움이 되는 AI 어시스턴트입니다. 한국어로 간결하게 답변하세요.";

    if (withContext) {
      // Context 파일 로드
      const contextMd = fs.readFileSync(
        path.join(__dirname, "user-context.md"),
        "utf-8"
      );

      // DB 데이터 로드
      const { rows: catRows } = await pool.query(`
        SELECT type, category, SUM(amount) AS total
        FROM transactions
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY type, category
        ORDER BY type, total DESC
      `);

      const { rows: recentRows } = await pool.query(`
        SELECT type, amount, category, memo, to_char(date, 'YYYY-MM-DD') AS date
        FROM transactions
        WHERE date >= CURRENT_DATE - INTERVAL '14 days'
        ORDER BY date DESC
      `);

      let incomeTotal = 0;
      let expenseTotal = 0;
      const catLines = [];

      for (const row of catRows) {
        const amt = Number(row.total);
        if (row.type === "income") incomeTotal += amt;
        else {
          expenseTotal += amt;
          catLines.push(`  - ${row.category}: ${amt.toLocaleString()}원`);
        }
      }

      const recentStr = recentRows
        .map(
          (r) =>
            `  - ${r.date} | ${r.type === "income" ? "수입" : "지출"} | ${Number(r.amount).toLocaleString()}원 | ${r.category}${r.memo ? ` (${r.memo})` : ""}`
        )
        .join("\n");

      systemPrompt = `당신은 이희석 님의 개인 AI 재정·학습 멘토입니다.
아래 사용자 Context와 실제 DB 데이터를 반드시 활용하여 개인화된 맞춤 답변을 제공하세요.
일반적인 조언 대신, 이 사람의 상황에 딱 맞는 구체적인 답변을 해야 합니다.

═══════════════════════════════
📋 사용자 AI Context
═══════════════════════════════
${contextMd}

═══════════════════════════════
📊 최근 30일 재정 현황 (실제 DB)
═══════════════════════════════
총 수입: ${incomeTotal.toLocaleString()}원
총 지출: ${expenseTotal.toLocaleString()}원
잔액: ${(incomeTotal - expenseTotal).toLocaleString()}원

카테고리별 지출:
${catLines.join("\n") || "  (데이터 없음)"}

최근 14일 거래 내역:
${recentStr || "  (내역 없음)"}

═══════════════════════════════
위 정보를 적극 활용해서 이희석 님에게 맞춤화된 조언을 하세요.
답변은 한국어로, 간결하고 실용적으로, 바로 실행 가능하도록 작성하세요.`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("[Chat]", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`🤖 AI 에이전트 서버 → http://localhost:${PORT}`)
  );
}

module.exports = app;
