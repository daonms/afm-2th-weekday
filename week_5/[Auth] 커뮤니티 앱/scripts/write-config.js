/**
 * Vercel 빌드 시 환경 변수로 supabase-config.js 생성
 * 대시보드 → Settings → Environment Variables: SUPABASE_URL, SUPABASE_ANON_KEY
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const url = (process.env.SUPABASE_URL || "").trim();
const key = (process.env.SUPABASE_ANON_KEY || "").trim();

const contents = `/* Auto-generated at build — do not commit secrets to public repos unnecessarily */
window.SUPABASE_URL = ${JSON.stringify(url)};
window.SUPABASE_ANON_KEY = ${JSON.stringify(key)};
`;

fs.writeFileSync(path.join(root, "supabase-config.js"), contents, "utf8");
if (!url || !key) {
  console.warn(
    "[write-config] SUPABASE_URL 또는 SUPABASE_ANON_KEY가 비어 있습니다. Vercel 환경 변수를 설정한 뒤 다시 배포하세요."
  );
} else {
  console.log("[write-config] supabase-config.js 생성 완료");
}
