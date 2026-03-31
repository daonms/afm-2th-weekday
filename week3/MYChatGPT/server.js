const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// .env 파일 로드 (dotenv 없이 직접 파싱)
try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  });
} catch {}

const PORT = 3000;

// ========================================
// OpenAI API 설정 — 나중에 키 입력
// ========================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE';

const SYSTEM_PROMPT = `당신은 따뜻하고 공감적인 심리 상담사 "마음이"입니다.

## 상담 원칙
- 항상 공감과 경청을 최우선으로 합니다
- 판단하지 않고 내담자의 감정을 있는 그대로 수용합니다
- 열린 질문을 통해 내담자가 스스로 통찰을 얻도록 돕습니다
- 필요할 때 인지행동치료(CBT), 마음챙김 등 기법을 자연스럽게 활용합니다
- 위기 상황(자해/자살 언급)이 감지되면 즉시 전문 상담 기관(자살예방상담전화 1393, 정신건강위기상담전화 1577-0199)을 안내합니다

## 대화 스타일
- 존댓말을 사용하되 딱딱하지 않게 따뜻한 톤을 유지합니다
- 답변은 2~4문장 정도로 간결하게 합니다
- 적절한 감정 반영과 요약을 해줍니다
- 대화 시작 시 "안녕하세요, 마음이입니다. 오늘 어떤 이야기를 나누고 싶으신가요?" 라고 인사합니다`;

// ========================================
// OpenAI API 호출
// ========================================
function callOpenAI(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.8,
      max_tokens: 500,
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return reject(new Error(parsed.error.message));
          }
          resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(new Error('API 응답 파싱 실패'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ========================================
// HTTP 서버
// ========================================
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
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
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // POST /api/chat — 채팅 메시지 전송
  if (req.method === 'POST' && req.url === '/api/chat') {
    if (OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
      return sendJSON(res, 500, {
        error: 'API 키가 설정되지 않았습니다. 환경변수 OPENAI_API_KEY를 설정하거나 server.js에 키를 입력해주세요.',
      });
    }

    try {
      const { messages } = await readBody(req);
      const reply = await callOpenAI(messages);
      sendJSON(res, 200, { reply });
    } catch (e) {
      sendJSON(res, 500, { error: e.message || '서버 오류가 발생했습니다.' });
    }
    return;
  }

  // GET / — 정적 파일 서빙
  let filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  마음이 심리상담 챗봇 서버 실행 중!');
  console.log(`  http://localhost:${PORT}`);
  console.log('='.repeat(50));
  if (OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('\n  ⚠ API 키 미설정! 다음 중 하나로 설정하세요:');
    console.log('    1) OPENAI_API_KEY=sk-... node server.js');
    console.log('    2) server.js 파일에서 직접 수정\n');
  }
});
