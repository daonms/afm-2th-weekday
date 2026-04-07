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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE';

// ========================================
// 인증 설정 (users.json 파일 기반)
// ========================================
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
  catch { return { [process.env.ADMIN_ID || 'daon']: { pw: process.env.ADMIN_PW || '1234', role: 'admin' } }; }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 최초 실행 시 users.json 생성
if (!fs.existsSync(USERS_FILE)) saveUsers(loadUsers());

// 세션 토큰 저장소 (메모리)
const sessions = new Map(); // token → { id, role, loginAt }

function genToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getToken(req) {
  return req.headers['authorization']?.replace('Bearer ', '');
}

function isAuth(req) {
  const token = getToken(req);
  return token && sessions.has(token);
}

// ========================================
// OpenAI API 스트리밍 호출
// ========================================
function streamOpenAI(messages, model, systemPrompt, res) {
  const body = JSON.stringify({
    model: model || 'gpt-4o-mini',
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
    stream_options: { include_usage: true },
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    // 에러 응답이면 바로 처리
    if (apiRes.statusCode !== 200) {
      let data = '';
      apiRes.on('data', (c) => { data += c; });
      apiRes.on('end', () => {
        try {
          const err = JSON.parse(data);
          res.write(`data: ${JSON.stringify({ error: err.error?.message || '알 수 없는 오류' })}\n\n`);
        } catch {
          res.write(`data: ${JSON.stringify({ error: `HTTP ${apiRes.statusCode}` })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      });
      return;
    }

    // SSE 스트리밍 전달
    let buffer = '';
    apiRes.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 마지막 불완전 라인은 버퍼에 보관

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        }
        try {
          const json = JSON.parse(payload);
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
          // usage 데이터 (스트림 마지막 청크에 포함)
          if (json.usage) {
            res.write(`data: ${JSON.stringify({ usage: json.usage, model: json.model })}\n\n`);
          }
        } catch {}
      }
    });

    apiRes.on('end', () => {
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });
  });

  apiReq.on('error', (e) => {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  apiReq.write(body);
  apiReq.end();
}

// ========================================
// 비스트리밍 호출 (모델 목록 등)
// ========================================
function callOpenAI(endpoint, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: endpoint,
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('API 응답 파싱 실패')); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ========================================
// HTTP 서버
// ========================================
function sendJSON(res, code, data) {
  res.writeHead(code, {
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
    req.on('data', (c) => { body += c; });
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

  // POST /api/login
  if (req.method === 'POST' && req.url === '/api/login') {
    try {
      const { id, pw } = await readBody(req);
      const users = loadUsers();
      if (users[id] && users[id].pw === pw) {
        const token = genToken();
        sessions.set(token, { id, role: users[id].role || 'user', loginAt: new Date().toISOString() });
        return sendJSON(res, 200, { ok: true, token, id, role: users[id].role || 'user' });
      }
      return sendJSON(res, 401, { ok: false, error: '아이디 또는 비밀번호가 틀렸습니다.' });
    } catch {
      return sendJSON(res, 400, { ok: false, error: '잘못된 요청입니다.' });
    }
  }

  // POST /api/register (admin만 가능)
  if (req.method === 'POST' && req.url === '/api/register') {
    if (!isAuth(req)) return sendJSON(res, 401, { ok: false, error: '로그인이 필요합니다.' });
    const sess = sessions.get(getToken(req));
    if (sess?.role !== 'admin') return sendJSON(res, 403, { ok: false, error: '관리자만 계정을 추가할 수 있습니다.' });
    try {
      const { id, pw, role } = await readBody(req);
      if (!id || !pw) return sendJSON(res, 400, { ok: false, error: '아이디와 비밀번호를 입력해주세요.' });
      const users = loadUsers();
      if (users[id]) return sendJSON(res, 409, { ok: false, error: '이미 존재하는 아이디입니다.' });
      users[id] = { pw, role: role || 'user' };
      saveUsers(users);
      return sendJSON(res, 200, { ok: true });
    } catch {
      return sendJSON(res, 400, { ok: false, error: '잘못된 요청입니다.' });
    }
  }

  // DELETE /api/users/:id (admin만 가능)
  if (req.method === 'DELETE' && req.url.startsWith('/api/users/')) {
    if (!isAuth(req)) return sendJSON(res, 401, { ok: false, error: '로그인이 필요합니다.' });
    const sess = sessions.get(getToken(req));
    if (sess?.role !== 'admin') return sendJSON(res, 403, { ok: false, error: '관리자만 삭제할 수 있습니다.' });
    const targetId = decodeURIComponent(req.url.replace('/api/users/', ''));
    if (targetId === 'daon') return sendJSON(res, 400, { ok: false, error: '기본 관리자는 삭제할 수 없습니다.' });
    const users = loadUsers();
    delete users[targetId];
    saveUsers(users);
    return sendJSON(res, 200, { ok: true });
  }

  // GET /api/users (admin만 가능)
  if (req.method === 'GET' && req.url === '/api/users') {
    if (!isAuth(req)) return sendJSON(res, 401, { ok: false, error: '로그인이 필요합니다.' });
    const sess = sessions.get(getToken(req));
    if (sess?.role !== 'admin') return sendJSON(res, 403, { ok: false, error: '관리자만 조회할 수 있습니다.' });
    const users = loadUsers();
    return sendJSON(res, 200, { ok: true, users: Object.entries(users).map(([id, v]) => ({ id, role: v.role })) });
  }

  // POST /api/logout
  if (req.method === 'POST' && req.url === '/api/logout') {
    const token = getToken(req);
    if (token) sessions.delete(token);
    return sendJSON(res, 200, { ok: true });
  }

  // GET /api/me — 토큰 검증
  if (req.method === 'GET' && req.url === '/api/me') {
    const token = getToken(req);
    if (token && sessions.has(token)) {
      return sendJSON(res, 200, { ok: true, ...sessions.get(token) });
    }
    return sendJSON(res, 401, { ok: false });
  }

  // POST /api/chat — 스트리밍 채팅
  if (req.method === 'POST' && req.url === '/api/chat') {
    // 인증 확인
    if (!isAuth(req)) {
      return sendJSON(res, 401, { error: '로그인이 필요합니다.' });
    }
    if (OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
      return sendJSON(res, 500, { error: 'API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 입력해주세요.' });
    }

    try {
      const { messages, model, systemPrompt } = await readBody(req);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      streamOpenAI(messages, model, systemPrompt, res);
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // GET /api/models — 사용 가능한 모델 목록
  if (req.method === 'GET' && req.url === '/api/models') {
    if (!isAuth(req)) return sendJSON(res, 401, { error: '로그인이 필요합니다.' });
    if (OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
      return sendJSON(res, 200, { models: ['gpt-4o-mini'] });
    }
    try {
      const data = await callOpenAI('/v1/models');
      const chatModels = (data.data || [])
        .filter(m => m.id.includes('gpt'))
        .map(m => m.id)
        .sort();
      sendJSON(res, 200, { models: chatModels.length ? chatModels : ['gpt-4o-mini'] });
    } catch {
      sendJSON(res, 200, { models: ['gpt-4o-mini'] });
    }
    return;
  }

  // 정적 파일 서빙
  let filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  나만의 ChatGPT 서버 실행 중!');
  console.log(`  http://localhost:${PORT}`);
  console.log('='.repeat(50));
  if (OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('\n  [!] API 키 미설정! .env 파일에 키를 입력하세요:');
    console.log('      OPENAI_API_KEY=sk-...\n');
  }
});
