const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// ========================================
// 1. PokeAPI 캐시 (서버 메모리에 저장)
// ========================================
const apiCache = new Map();

function fetchFromPokeAPI(apiPath) {
  return new Promise((resolve, reject) => {
    const cacheKey = apiPath;
    if (apiCache.has(cacheKey)) {
      return resolve(apiCache.get(cacheKey));
    }

    const apiUrl = `https://pokeapi.co/api/v2${apiPath}`;
    https.get(apiUrl, (response) => {
      if (response.statusCode === 404) {
        return reject(new Error('Not Found'));
      }
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          apiCache.set(cacheKey, parsed);
          resolve(parsed);
        } catch (e) {
          reject(new Error('JSON parse error'));
        }
      });
    }).on('error', reject);
  });
}

// ========================================
// 2. 포켓몬 데이터 가공
// ========================================
const TYPE_NAME_KO = {
  normal: '노말', fire: '불꽃', water: '물', electric: '전기',
  grass: '풀', ice: '얼음', fighting: '격투', poison: '독',
  ground: '땅', flying: '비행', psychic: '에스퍼', bug: '벌레',
  rock: '바위', ghost: '고스트', dragon: '드래곤', dark: '악',
  steel: '강철', fairy: '페어리',
};

async function getPokemonData(query) {
  // 기본 포켓몬 정보
  const data = await fetchFromPokeAPI(`/pokemon/${query}`);

  // 종족 정보 (한글 이름 + 설명)
  const speciesPath = `/pokemon-species/${data.id}`;
  const speciesData = await fetchFromPokeAPI(speciesPath);

  const nameKo = speciesData.names.find(n => n.language.name === 'ko')?.name || data.name;
  const nameEn = speciesData.names.find(n => n.language.name === 'en')?.name || data.name;
  const description = speciesData.flavor_text_entries
    .find(f => f.language.name === 'ko')?.flavor_text?.replace(/\n|\f/g, ' ')
    || speciesData.flavor_text_entries
    .find(f => f.language.name === 'en')?.flavor_text?.replace(/\n|\f/g, ' ')
    || '';

  const types = data.types.map(t => TYPE_NAME_KO[t.type.name] || t.type.name);

  const stats = {};
  data.stats.forEach(s => {
    const name = s.stat.name;
    if (name === 'hp') stats.hp = s.base_stat;
    else if (name === 'attack') stats.attack = s.base_stat;
    else if (name === 'defense') stats.defense = s.base_stat;
    else if (name === 'special-attack') stats.spAttack = s.base_stat;
    else if (name === 'special-defense') stats.spDefense = s.base_stat;
    else if (name === 'speed') stats.speed = s.base_stat;
  });

  return {
    id: data.id,
    nameKo,
    nameEn,
    types,
    stats,
    height: (data.height / 10).toFixed(1),
    weight: (data.weight / 10).toFixed(1),
    description,
    sprite: data.sprites.other['official-artwork'].front_default
      || data.sprites.front_default,
  };
}

// ========================================
// 3. 이름 인덱스 (한글/영문 검색용)
// ========================================
let nameIndex = [];
let indexLoaded = false;

async function loadNameIndex() {
  if (indexLoaded) return nameIndex;
  console.log('포켓몬 이름 인덱스 로딩 시작...');

  try {
    const list = await fetchFromPokeAPI('/pokemon-species?limit=1025');
    const batchSize = 50;

    for (let i = 0; i < list.results.length; i += batchSize) {
      const batch = list.results.slice(i, i + batchSize);
      const details = await Promise.all(
        batch.map(async (s) => {
          try {
            const idMatch = s.url.match(/\/(\d+)\/$/);
            const id = idMatch ? parseInt(idMatch[1]) : null;
            if (!id) return null;

            const d = await fetchFromPokeAPI(`/pokemon-species/${id}`);
            const ko = d.names.find(n => n.language.name === 'ko')?.name || '';
            const en = d.names.find(n => n.language.name === 'en')?.name || s.name;
            return { id, nameEn: en.toLowerCase(), nameKo: ko, nameEnDisplay: en };
          } catch { return null; }
        })
      );
      nameIndex.push(...details.filter(Boolean));
      const progress = Math.min(Math.round(((i + batchSize) / list.results.length) * 100), 100);
      process.stdout.write(`\r  인덱스 로딩: ${progress}%`);
    }
    console.log('\n  인덱스 로딩 완료! (총 ' + nameIndex.length + '마리)');
    indexLoaded = true;
  } catch (e) {
    console.error('인덱스 로드 실패:', e.message);
  }
  return nameIndex;
}

function resolveQuery(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  if (/^\d+$/.test(q)) return q;

  if (indexLoaded) {
    const enMatch = nameIndex.find(p => p.nameEn === q);
    if (enMatch) return String(enMatch.id);

    const koExact = nameIndex.find(p => p.nameKo === q);
    if (koExact) return String(koExact.id);

    const koPartial = nameIndex.find(p => p.nameKo && p.nameKo.includes(q));
    if (koPartial) return String(koPartial.id);

    const enPartial = nameIndex.find(p => p.nameEn.includes(q));
    if (enPartial) return String(enPartial.id);
  }

  return q;
}

// ========================================
// 4. HTTP 서버
// ========================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // ---- API 라우트 ----

  // GET /api/pokemon/:query - 포켓몬 검색
  if (pathname.startsWith('/api/pokemon/')) {
    const query = decodeURIComponent(pathname.replace('/api/pokemon/', ''));
    const resolved = resolveQuery(query);
    if (!resolved) {
      return sendJSON(res, 400, { error: '검색어를 입력해주세요.' });
    }
    try {
      const pokemon = await getPokemonData(resolved);
      sendJSON(res, 200, pokemon);
    } catch (e) {
      sendJSON(res, 404, { error: `"${query}" - 포켓몬을 찾을 수 없습니다.` });
    }
    return;
  }

  // GET /api/search?q=검색어 - 자동완성 검색
  if (pathname === '/api/search') {
    const q = (parsedUrl.query.q || '').trim().toLowerCase();
    if (q.length < 1 || !indexLoaded) {
      return sendJSON(res, 200, []);
    }
    const matches = nameIndex.filter(p =>
      p.nameKo.includes(q) || p.nameEn.includes(q) || String(p.id) === q
    ).slice(0, 8);
    return sendJSON(res, 200, matches);
  }

  // GET /api/index-status - 인덱스 로딩 상태
  if (pathname === '/api/index-status') {
    return sendJSON(res, 200, {
      loaded: indexLoaded,
      count: nameIndex.length,
      total: 1025,
    });
  }

  // GET /api/suggestions - 추천 포켓몬 목록
  if (pathname === '/api/suggestions') {
    const suggestions = [
      { label: '피카츄', query: 'pikachu' },
      { label: '리자몽', query: 'charizard' },
      { label: '뮤츠', query: 'mewtwo' },
      { label: '이상해꽃', query: 'venusaur' },
      { label: '거북왕', query: 'blastoise' },
      { label: '잠만보', query: 'snorlax' },
      { label: '루카리오', query: 'lucario' },
      { label: '가브리아스', query: 'garchomp' },
    ];
    return sendJSON(res, 200, suggestions);
  }

  // ---- 정적 파일 서빙 ----
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 - 페이지를 찾을 수 없습니다</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// ========================================
// 5. 서버 시작
// ========================================
server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  포켓몬 도감 서버 실행 중!');
  console.log(`  http://localhost:${PORT}`);
  console.log('='.repeat(50));

  // 백그라운드에서 이름 인덱스 로딩 시작
  loadNameIndex();
});
