# 메모 앱 (Express + PostgreSQL)

Express + Supabase PostgreSQL 기반 메모 CRUD 앱. Vercel 서버리스 배포 구성.

- **배포 URL**: https://memo-app-afm.vercel.app
- **프로젝트**: `daon-9060s-projects/memo-app-afm`
- **DB 테이블**: `memo_app_v2_memos` (Supabase)

---

## 구성

| 파일 | 역할 |
|------|------|
| `server.js` | Express 서버 · REST API 4종 · 정적 서빙 · 서버리스 export |
| `index.html` | React 18 CDN + Tailwind 프론트엔드 |
| `vercel.json` | 서버리스 라우팅 (모든 요청 → `server.js`) |
| `package.json` | dependencies: express, cors, pg |
| `.env.example` | 환경변수 템플릿 |
| `.env.local` | 로컬 개발용 환경변수 (git 제외) |

---

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/memos` | 전체 메모 목록 (최근 수정순) |
| POST | `/api/memos` | 메모 생성 `{title, content}` |
| PUT | `/api/memos/:id` | 메모 수정 |
| DELETE | `/api/memos/:id` | 메모 삭제 |

---

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 파일 준비
cp .env.example .env.local
# .env.local 편집해 실제 DATABASE_URL 입력

# 3. 서버 실행
npm start
# → http://localhost:3000
```

---

## Vercel 배포

### 최초 배포

```bash
# 1. 프로젝트 링크
vercel link --yes --project memo-app-afm

# 2. 환경변수 등록 (production)
printf 'postgresql://...' | vercel env add DATABASE_URL production

# 3. 프로덕션 배포
vercel deploy --prod --yes
```

### 재배포

```bash
vercel deploy --prod --yes
```

---

## 핵심 설계 포인트

1. **듀얼 모드 서버** — `require.main === module` 가드로 로컬(`app.listen`)과 서버리스(`module.exports = app`) 동시 지원.
2. **Lazy DB 초기화** — `dbInitialized` 플래그 + `/api` 미들웨어에서 첫 요청 시 `CREATE TABLE IF NOT EXISTS` 수행 (cold start 대응).
3. **상대경로 API** — 프론트의 `API_BASE_URL = '/api'` 로컬·배포 양쪽에서 같은 오리진 API 자동 사용.
4. **Supabase Pooler(6543 포트) + SSL** — 서버리스 환경 연결 재사용 최적화, `rejectUnauthorized: false`.
5. **테이블명 분리** — 공유 Supabase DB의 스키마 충돌 방지를 위해 이 앱 전용 `memo_app_v2_memos` 사용.
