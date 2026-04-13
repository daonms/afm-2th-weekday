require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3011;

const DATABASE_URL = (
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL ||
  ""
).trim();

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

let dbInitialized = false;

async function initDB() {
  if (!pool) throw new Error("DATABASE_URL is missing");
  if (dbInitialized) return;

  await pool.query("SET client_encoding TO 'UTF8'");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS salary_expense_entries (
      id SERIAL PRIMARY KEY,
      monthly_salary INTEGER NOT NULL CHECK (monthly_salary >= 0),
      monthly_expense INTEGER NOT NULL CHECK (monthly_expense >= 0),
      job_group TEXT NOT NULL,
      years_experience INTEGER NOT NULL CHECK (years_experience >= 0),
      food_expense INTEGER NOT NULL DEFAULT 0 CHECK (food_expense >= 0),
      housing_expense INTEGER NOT NULL DEFAULT 0 CHECK (housing_expense >= 0),
      transport_expense INTEGER NOT NULL DEFAULT 0 CHECK (transport_expense >= 0),
      subscription_expense INTEGER NOT NULL DEFAULT 0 CHECK (subscription_expense >= 0),
      etc_expense INTEGER NOT NULL DEFAULT 0 CHECK (etc_expense >= 0),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  dbInitialized = true;
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(async (req, res, next) => {
  try {
    await initDB();
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "DB 초기화 실패", detail: error.message });
  }
});

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

function validatePayload(body) {
  const payload = {
    monthly_salary: toInt(body.monthly_salary),
    monthly_expense: toInt(body.monthly_expense),
    job_group: String(body.job_group || "").trim(),
    years_experience: toInt(body.years_experience),
    food_expense: toInt(body.food_expense ?? 0),
    housing_expense: toInt(body.housing_expense ?? 0),
    transport_expense: toInt(body.transport_expense ?? 0),
    subscription_expense: toInt(body.subscription_expense ?? 0),
    etc_expense: toInt(body.etc_expense ?? 0),
  };

  const fields = [
    "monthly_salary",
    "monthly_expense",
    "years_experience",
    "food_expense",
    "housing_expense",
    "transport_expense",
    "subscription_expense",
    "etc_expense",
  ];
  for (const key of fields) {
    if (!Number.isFinite(payload[key]) || payload[key] < 0) {
      return { ok: false, message: `${key} 값이 올바르지 않습니다.` };
    }
  }
  if (!payload.job_group) return { ok: false, message: "job_group은 필수입니다." };

  return { ok: true, payload };
}

async function buildStats(entryId) {
  const overview = await pool.query(`
    SELECT
      COUNT(*)::int AS total_count,
      COALESCE(ROUND(AVG(monthly_salary))::int, 0) AS avg_monthly_salary,
      COALESCE(ROUND(AVG(monthly_expense))::int, 0) AS avg_monthly_expense
    FROM salary_expense_entries
  `);

  const distribution = await pool.query(`
    SELECT
      COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY monthly_salary), 0)::int AS salary_p25,
      COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY monthly_salary), 0)::int AS salary_p50,
      COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY monthly_salary), 0)::int AS salary_p75,
      COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY monthly_expense), 0)::int AS expense_p25,
      COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY monthly_expense), 0)::int AS expense_p50,
      COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY monthly_expense), 0)::int AS expense_p75
    FROM salary_expense_entries
  `);

  const categoryAvg = await pool.query(`
    SELECT
      COALESCE(ROUND(AVG(food_expense))::int, 0) AS food_avg,
      COALESCE(ROUND(AVG(housing_expense))::int, 0) AS housing_avg,
      COALESCE(ROUND(AVG(transport_expense))::int, 0) AS transport_avg,
      COALESCE(ROUND(AVG(subscription_expense))::int, 0) AS subscription_avg,
      COALESCE(ROUND(AVG(etc_expense))::int, 0) AS etc_avg
    FROM salary_expense_entries
  `);

  const result = {
    overview: overview.rows[0],
    distribution: distribution.rows[0],
    category_avg: categoryAvg.rows[0],
    my_position: null,
  };

  if (entryId) {
    const myEntryResult = await pool.query(
      `SELECT id, monthly_salary, monthly_expense
       FROM salary_expense_entries
       WHERE id = $1`,
      [entryId]
    );
    if (myEntryResult.rowCount > 0) {
      const mine = myEntryResult.rows[0];
      const total = result.overview.total_count || 1;
      const higherSalary = await pool.query(
        "SELECT COUNT(*)::int AS count FROM salary_expense_entries WHERE monthly_salary > $1",
        [mine.monthly_salary]
      );
      const lowerExpense = await pool.query(
        "SELECT COUNT(*)::int AS count FROM salary_expense_entries WHERE monthly_expense < $1",
        [mine.monthly_expense]
      );

      const topSalaryPercent = Math.round((higherSalary.rows[0].count / total) * 100);
      const spendingPercentile = Math.round((lowerExpense.rows[0].count / total) * 100);

      result.my_position = {
        entry_id: mine.id,
        salary_top_percent: topSalaryPercent,
        spending_percentile: spendingPercentile,
      };
    }
  }

  return result;
}

app.get("/api/health", async (_req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ ok: false, db: false, error: "DATABASE_URL missing" });
    }
    await pool.query("SELECT 1");
    res.json({ ok: true, db: true, api: true });
  } catch (error) {
    res.status(500).json({ ok: false, db: false, error: error.message });
  }
});

app.post("/api/submissions", async (req, res) => {
  const valid = validatePayload(req.body);
  if (!valid.ok) return res.status(400).json({ error: valid.message });

  const p = valid.payload;
  try {
    const inserted = await pool.query(
      `INSERT INTO salary_expense_entries
      (monthly_salary, monthly_expense, job_group, years_experience, food_expense, housing_expense, transport_expense, subscription_expense, etc_expense)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        p.monthly_salary,
        p.monthly_expense,
        p.job_group,
        p.years_experience,
        p.food_expense,
        p.housing_expense,
        p.transport_expense,
        p.subscription_expense,
        p.etc_expense,
      ]
    );
    const row = inserted.rows[0];
    const stats = await buildStats(row.id);
    res.status(201).json({ saved: row, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "데이터 저장 실패" });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const entryId = req.query.entry_id ? Number(req.query.entry_id) : null;
    const stats = await buildStats(Number.isFinite(entryId) ? entryId : null);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "통계 조회 실패" });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
