const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// .env 파일 로드
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
} catch {}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PORT = 3002;

// ========================================
// Gemini API 호출
// ========================================
function callGemini(name, personality, hobbies) {
  return new Promise((resolve, reject) => {
    const prompt = `다음 정보를 가진 사람에게 어울리는 재미있고 창의적인 별명을 5개 만들어줘.

이름: ${name}
성격: ${personality}
취미: ${hobbies}

조건:
- 별명은 한국어로, 짧고 기억에 남게
- 각 별명마다 짧은 이유(한 줄)도 같이 써줘
- 반드시 아래 JSON 형식으로만 응답해 (다른 텍스트 없이)

[
  { "nickname": "별명1", "reason": "이유1" },
  { "nickname": "별명2", "reason": "이유2" },
  { "nickname": "별명3", "reason": "이유3" },
  { "nickname": "별명4", "reason": "이유4" },
  { "nickname": "별명5", "reason": "이유5" }
]`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
    });

    console.log('[Gemini] 요청 시작...');
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 15000,
    }, (res) => {
      console.log('[Gemini] 응답 상태:', res.statusCode);
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log('[Gemini] 응답 내용:', data.slice(0, 200));
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          let content = parsed.candidates[0].content.parts[0].text.trim();
          // 마크다운 코드블록 제거
          content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          const match = content.match(/\[[\s\S]*\]/);
          if (!match) return reject(new Error('AI 응답 형식 오류: ' + content.slice(0, 100)));
          resolve(JSON.parse(match[0]));
        } catch (e) {
          reject(new Error('파싱 실패: ' + e.message));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Gemini 응답 시간 초과')); });
    req.on('error', (e) => { console.log('[Gemini] 오류:', e.message); reject(e); });
    req.write(body);
    req.end();
  });
}

// ========================================
// HTTP 서버
// ========================================
function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/generate') {
    if (!GEMINI_API_KEY) {
      return sendJSON(res, 500, { error: '.env에 GEMINI_API_KEY를 입력해주세요.' });
    }
    try {
      const { name, personality, hobbies } = await readBody(req);
      if (!name || !personality || !hobbies) {
        return sendJSON(res, 400, { error: '입력값이 부족합니다.' });
      }
      const nicknames = await callGemini(name, personality, hobbies);
      sendJSON(res, 200, { nicknames });
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  const filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(__dirname, filePath);
  fs.readFile(fullPath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not Found'); }
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript' };
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });

}).listen(PORT, () => {
  console.log('========================================');
  console.log('  AI 별명 생성기  →  http://localhost:' + PORT);
  console.log('========================================');
});
