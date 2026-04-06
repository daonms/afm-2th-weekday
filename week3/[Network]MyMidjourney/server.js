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

const PORT = 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ========================================
// Imagen 3 이미지 생성
// ========================================
function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 },
    });

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          const b64 = json.predictions[0].bytesBase64Encoded;
          resolve('data:image/png;base64,' + b64);
        } catch (e) {
          reject(new Error('파싱 실패: ' + data.slice(0, 200)));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('응답 시간 초과')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ========================================
// Gemini 비전으로 이미지 설명 생성
// ========================================
function describeImage(base64, mimeType) {
  return new Promise((resolve, reject) => {
    const clean = base64.replace(/^data:image\/\w+;base64,/, '');
    const body = JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: mimeType || 'image/png', data: clean } },
          { text: 'Describe this image in detail as an image generation prompt in English. Be specific about style, colors, composition, and subjects.' },
        ],
      }],
    });

    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 20000,
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          resolve(json.candidates[0].content.parts[0].text.trim());
        } catch (e) {
          reject(new Error('이미지 분석 실패'));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('응답 시간 초과')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ========================================
// 유틸
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
    const chunks = [];
    req.on('data', c => { chunks.push(c); });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const stylePrompts = {
  ghibli:         '지브리 스튜디오 애니메이션 화풍, 따뜻하고 몽환적인 배경, 손으로 그린 듯한 섬세한 표현,',
  watercolor:     '수채화 화풍, 투명하고 부드러운 색감, 번짐 효과, 예술적인 스케치,',
  cyberpunk:      '사이버펑크 스타일, 네온사인, 어두운 미래 도시, 홀로그램 빛, 디지털 아트,',
  oilpaint:       '유화 회화 스타일, 붓터치가 살아있는 질감, 고전 미술관 느낌, 렘브란트 조명,',
  pixel:          '픽셀 아트 스타일, 레트로 8비트 게임 느낌, 선명한 도트 픽셀,',
  anime:          '일본 애니메이션 스타일, 선명한 윤곽선, 큰 눈, 생생한 색감, 고품질 애니메이션,',
  sketch:         '연필 스케치 화풍, 흑백, 손으로 그린 선 표현, 예술적 드로잉,',
  photorealistic: '사진처럼 현실적인 화풍, 8K 초고화질, 자연스러운 빛과 그림자,',
  fantasy:        '판타지 일러스트 화풍, 마법적인 분위기, 화려한 색채, 서사시적 스케일,',
  minimal:        '미니멀리즘 디자인 스타일, 깔끔한 선, 여백의 미, 모던 아트,',
};

// ========================================
// HTTP 서버
// ========================================
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // POST /api/generate — 이미지 생성
  if (req.method === 'POST' && req.url === '/api/generate') {
    if (!GEMINI_API_KEY) return sendJSON(res, 500, { error: '.env에 GEMINI_API_KEY를 입력해주세요.' });
    try {
      const { prompt, style } = await readBody(req);
      if (!prompt) return sendJSON(res, 400, { error: '프롬프트를 입력해주세요.' });

      const stylePrefix = stylePrompts[style] || '';
      const fullPrompt = stylePrefix ? `${stylePrefix} ${prompt}` : prompt;

      console.log(`[생성 요청] 스타일: ${style || 'none'} | 프롬프트: ${prompt}`);
      const dataUrl = await generateImage(fullPrompt);
      sendJSON(res, 200, { ok: true, url: dataUrl, revised_prompt: fullPrompt });
    } catch (e) {
      console.error('[오류]', e.message);
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // POST /api/variation — 이미지 변형 (Gemini 비전 → Imagen)
  if (req.method === 'POST' && req.url === '/api/variation') {
    if (!GEMINI_API_KEY) return sendJSON(res, 500, { error: '.env에 GEMINI_API_KEY를 입력해주세요.' });
    try {
      const { image } = await readBody(req);
      if (!image) return sendJSON(res, 400, { error: '이미지를 업로드해주세요.' });

      console.log('[변형 요청] 이미지 분석 중...');
      const description = await describeImage(image);
      const variationPrompt = `A creative variation of: ${description}`;

      console.log('[변형 요청] 이미지 생성 중...');
      const dataUrl = await generateImage(variationPrompt);
      sendJSON(res, 200, { ok: true, url: dataUrl });
    } catch (e) {
      console.error('[오류]', e.message);
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // POST /api/edit — 이미지 편집 (Gemini 비전 → Imagen)
  if (req.method === 'POST' && req.url === '/api/edit') {
    if (!GEMINI_API_KEY) return sendJSON(res, 500, { error: '.env에 GEMINI_API_KEY를 입력해주세요.' });
    try {
      const { image, prompt, style } = await readBody(req);
      if (!image)  return sendJSON(res, 400, { error: '이미지를 업로드해주세요.' });
      if (!prompt) return sendJSON(res, 400, { error: '프롬프트를 입력해주세요.' });

      console.log('[편집 요청] 이미지 분석 중...');
      const description = await describeImage(image);
      const stylePrefix = stylePrompts[style] || '';
      const editPrompt = stylePrefix
        ? `${stylePrefix} ${description}, but ${prompt}`
        : `${description}, but ${prompt}`;

      console.log('[편집 요청] 이미지 생성 중...');
      const dataUrl = await generateImage(editPrompt);
      sendJSON(res, 200, { ok: true, url: dataUrl });
    } catch (e) {
      console.error('[오류]', e.message);
      sendJSON(res, 500, { error: e.message });
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
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
  };

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1>404 Not Found</h1>');
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  나만의 Midjourney 서버 실행 중!');
  console.log(`  http://localhost:${PORT}`);
  console.log('='.repeat(50));
  if (!GEMINI_API_KEY) {
    console.log('\n  [!] API 키 미설정! .env 파일에 GEMINI_API_KEY를 입력하세요.\n');
  } else {
    console.log('\n  Imagen 3 이미지 생성 준비 완료!\n');
  }
});
