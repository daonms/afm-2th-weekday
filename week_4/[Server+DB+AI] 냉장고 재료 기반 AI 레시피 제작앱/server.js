require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3010;

const DATABASE_URL = (
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL ||
  ""
).trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = (process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();

if (!DATABASE_URL) {
  console.warn("DATABASE_URL is missing. Set it in your environment.");
}

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

let dbInitialized = false;
let hasLegacyRecipeColumns = false;

async function initDB() {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (dbInitialized) return;
  await pool.query("SET client_encoding TO 'UTF8'");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '기타',
      quantity TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      ingredients_text TEXT NOT NULL,
      instructions_text TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'ai',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Backward compatibility for older schema (ingredients/instructions columns).
  await pool.query(`
    ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS ingredients_text TEXT
  `);
  await pool.query(`
    ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS instructions_text TEXT
  `);
  await pool.query(`
    ALTER TABLE recipes
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai'
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'recipes' AND column_name = 'ingredients'
      ) THEN
        UPDATE recipes
        SET ingredients_text = COALESCE(ingredients_text, ingredients)
        WHERE ingredients_text IS NULL;
      END IF;
    END $$;
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'recipes' AND column_name = 'instructions'
      ) THEN
        UPDATE recipes
        SET instructions_text = COALESCE(instructions_text, instructions)
        WHERE instructions_text IS NULL;
      END IF;
    END $$;
  `);

  // Detect legacy schema columns from previous app versions.
  const legacyCols = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'recipes'
       AND column_name IN ('ingredients', 'instructions')`
  );
  const names = legacyCols.rows.map((row) => row.column_name);
  hasLegacyRecipeColumns =
    names.includes("ingredients") && names.includes("instructions");

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
    res.status(500).json({
      error: "DB 초기화 실패",
      detail: error.message,
    });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        ok: false,
        db: false,
        api: true,
        error: "DATABASE_URL is missing",
      });
    }
    await pool.query("SELECT 1");
    res.json({
      ok: true,
      db: true,
      api: true,
      hasOpenAiKey: Boolean(OPENAI_API_KEY),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      db: false,
      api: true,
      error: error.message,
    });
  }
});

app.get("/api/ingredients", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM ingredients ORDER BY category ASC, name ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "재료 조회 실패" });
  }
});

app.post("/api/ingredients", async (req, res) => {
  const { name, category = "기타", quantity = "" } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "재료명은 필수입니다." });
  }

  try {
    const result = await pool.query(
      "INSERT INTO ingredients (name, category, quantity) VALUES ($1, $2, $3) RETURNING *",
      [name.trim(), String(category).trim(), String(quantity).trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "재료 추가 실패" });
  }
});

app.patch("/api/ingredients/:id", async (req, res) => {
  const { quantity } = req.body;
  if (typeof quantity !== "string") {
    return res.status(400).json({ error: "수량 형식이 올바르지 않습니다." });
  }

  try {
    const result = await pool.query(
      "UPDATE ingredients SET quantity = $1 WHERE id = $2 RETURNING *",
      [quantity.trim(), req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "재료를 찾을 수 없습니다." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "수량 수정 실패" });
  }
});

app.delete("/api/ingredients/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM ingredients WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "재료를 찾을 수 없습니다." });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "재료 삭제 실패" });
  }
});

function parseAiRecipe(text, ingredientNames) {
  const fallbackTitle = "AI 냉장고 레시피";
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let title = fallbackTitle;
  const titleLine = lines.find((line) => line.toLowerCase().startsWith("title:"));
  if (titleLine) {
    title = titleLine.replace(/title:/i, "").trim() || fallbackTitle;
  }

  const ingredientsLine = lines.find((line) =>
    line.toLowerCase().startsWith("ingredients:")
  );
  const instructionsLine = lines.find((line) =>
    line.toLowerCase().startsWith("instructions:")
  );

  const aiIngredients = ingredientsLine
    ? ingredientsLine.replace(/ingredients:/i, "").trim()
    : ingredientNames.join(", ");

  const aiInstructions = instructionsLine
    ? instructionsLine.replace(/instructions:/i, "").trim()
    : text.trim();

  return {
    title,
    ingredients_text: aiIngredients,
    instructions_text: aiInstructions,
  };
}

function extractOutputText(data) {
  if (data.output_text && String(data.output_text).trim()) {
    return String(data.output_text).trim();
  }

  const chunks = [];
  const outputs = Array.isArray(data.output) ? data.output : [];
  for (const item of outputs) {
    const contents = Array.isArray(item.content) ? item.content : [];
    for (const content of contents) {
      if (content.type === "output_text" && content.text) {
        chunks.push(String(content.text));
      }
      if (content.type === "text" && content.text) {
        chunks.push(String(content.text));
      }
    }
  }
  return chunks.join("\n").trim();
}

async function generateRecipeByAI(ingredients) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const ingredientText = ingredients
    .map((item) => `${item.name} (${item.quantity || "수량 미기입"})`)
    .join(", ");

  const prompt = [
    "당신은 자취생을 위한 초간단 레시피 도우미입니다.",
    "반드시 아래 규칙을 지키세요:",
    "1) 1인분 기준",
    "2) 15분 이내 조리",
    "3) 자취생 난이도",
    "4) 주어진 재료를 최대한 사용",
    "출력 형식은 반드시 한 줄씩 아래 3개로만 출력:",
    "Title: ...",
    "Ingredients: ...",
    "Instructions: ...",
    `현재 재료: ${ingredientText}`,
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${errorText}`);
  }

  const data = await response.json();
  const outputText = extractOutputText(data);
  if (!outputText.trim()) {
    throw new Error("AI 응답이 비어 있습니다.");
  }

  const parsed = parseAiRecipe(
    outputText,
    ingredients.map((item) => item.name)
  );
  return {
    ...parsed,
    raw_text: outputText,
    source: "ai",
  };
}

function generateRecipeFallback(ingredients, reason = "") {
  const names = ingredients.map((item) => item.name).slice(0, 5);
  const useText = names.join(", ");
  return {
    title: "냉장고 즉석 볶음 레시피",
    ingredients_text: useText || "냉장고 재료",
    instructions_text: [
      `팬에 기름을 두르고 ${useText} 재료를 센 불에서 2분 볶습니다.`,
      "물 2큰술을 넣고 뚜껑을 덮어 3분 익힙니다.",
      "소금, 간장, 후추로 간을 맞추고 2분 더 볶아 마무리합니다.",
      "1인분 기준으로 바로 담아 드세요.",
    ].join("\n"),
    source: "fallback",
    notice: reason
      ? `AI 연결 이슈로 임시 레시피를 제공했습니다. (${reason})`
      : "OPENAI_API_KEY가 없어 임시 레시피를 제공했습니다.",
  };
}

app.post("/api/recipes/generate", async (_req, res) => {
  try {
    const ingredientsResult = await pool.query(
      "SELECT name, quantity FROM ingredients ORDER BY name ASC"
    );
    const ingredients = ingredientsResult.rows;

    if (ingredients.length === 0) {
      return res.status(400).json({ error: "먼저 재료를 1개 이상 추가하세요." });
    }

    if (!OPENAI_API_KEY) {
      return res.json(generateRecipeFallback(ingredients));
    }

    const generated = await generateRecipeByAI(ingredients);
    res.json(generated);
  } catch (error) {
    console.error(error);
    try {
      const ingredientsResult = await pool.query(
        "SELECT name, quantity FROM ingredients ORDER BY name ASC"
      );
      return res.json(
        generateRecipeFallback(ingredientsResult.rows, error.message)
      );
    } catch (fallbackError) {
      console.error(fallbackError);
      res.status(500).json({ error: `AI 레시피 생성 실패: ${error.message}` });
    }
  }
});

app.post("/api/recipes", async (req, res) => {
  const { title, ingredients_text, instructions_text, source = "ai" } = req.body;
  if (!title || !ingredients_text || !instructions_text) {
    return res.status(400).json({ error: "레시피 필수값이 누락되었습니다." });
  }

  try {
    const params = [
      String(title).trim(),
      String(ingredients_text).trim(),
      String(instructions_text).trim(),
      String(source).trim() || "ai",
    ];

    const query = hasLegacyRecipeColumns
      ? `INSERT INTO recipes
           (title, ingredients_text, instructions_text, source, ingredients, instructions)
         VALUES ($1, $2, $3, $4, $2, $3)
         RETURNING *`
      : `INSERT INTO recipes
           (title, ingredients_text, instructions_text, source)
         VALUES ($1, $2, $3, $4)
         RETURNING *`;

    const result = await pool.query(query, params);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "레시피 저장 실패" });
  }
});

app.get("/api/recipes", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        title,
        COALESCE(ingredients_text, '') AS ingredients_text,
        COALESCE(instructions_text, '') AS instructions_text,
        COALESCE(source, 'ai') AS source,
        created_at
       FROM recipes
       ORDER BY created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "레시피 목록 조회 실패" });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
