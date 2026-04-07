const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const SECRET_FILE = path.join(__dirname, 'secret.txt');

// MIME 타입 매핑
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

function getSecret() {
  try {
    return fs.readFileSync(SECRET_FILE, 'utf-8').trim();
  } catch {
    return '1234';
  }
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ===== API: 비밀번호 확인 =====
  if (url.pathname === '/api/check' && req.method === 'POST') {
    try {
      const { password } = await parseBody(req);
      const secret = getSecret();

      if (!password) {
        sendJSON(res, 400, { success: false, message: '비밀번호를 입력해주세요.' });
        return;
      }

      if (String(password) === secret) {
        sendJSON(res, 200, {
          success: true,
          message: '축하합니다! 비밀 메시지를 발견했습니다. 🎉\n\n이것은 간단한 서버 보안의 원리를 보여주는 예제입니다.\n서버 측에서 비밀번호를 검증하고 있습니다!',
        });
      } else {
        sendJSON(res, 401, { success: false, message: '비밀번호가 틀렸습니다.' });
      }
    } catch {
      sendJSON(res, 400, { success: false, message: '잘못된 요청입니다.' });
    }
    return;
  }

  // ===== API: 비밀번호 변경 =====
  if (url.pathname === '/api/change' && req.method === 'POST') {
    try {
      const { currentPassword, newPassword } = await parseBody(req);
      const secret = getSecret();

      if (String(currentPassword) !== secret) {
        sendJSON(res, 401, { success: false, message: '현재 비밀번호가 틀렸습니다.' });
        return;
      }

      if (!newPassword || String(newPassword).length < 1) {
        sendJSON(res, 400, { success: false, message: '새 비밀번호를 입력해주세요.' });
        return;
      }

      fs.writeFileSync(SECRET_FILE, String(newPassword), 'utf-8');
      sendJSON(res, 200, { success: true, message: '비밀번호가 변경되었습니다.' });
    } catch {
      sendJSON(res, 400, { success: false, message: '잘못된 요청입니다.' });
    }
    return;
  }

  // ===== 정적 파일 서빙 =====
  if (req.method === 'GET') {
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    // secret.txt 직접 접근 차단
    if (filePath.includes('secret.txt') || filePath.includes('server.js')) {
      sendJSON(res, 403, { error: '접근 금지' });
      return;
    }
    serveFile(res, path.join(__dirname, filePath));
    return;
  }

  sendJSON(res, 404, { error: 'Not Found' });
});

server.listen(PORT, () => {
  console.log(`\n🔒 비밀번호 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📁 비밀번호 파일: ${SECRET_FILE}`);
  console.log(`\n  API:`);
  console.log(`  POST /api/check   - 비밀번호 확인`);
  console.log(`  POST /api/change  - 비밀번호 변경\n`);
});