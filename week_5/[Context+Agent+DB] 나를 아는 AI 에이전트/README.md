# 나를 아는 AI 에이전트

Context(개인 프로필) + DB(실제 거래 데이터)를 결합한 맞춤형 AI 멘토.

- **프로덕션 URL**: https://ai-agent-inky-two.vercel.app
- **모델**: Groq `llama-3.3-70b-versatile`
- **DB**: Supabase PostgreSQL (`transactions` 테이블)

## 기술 스택

- Express 4 + OpenAI SDK (Groq 호환 엔드포인트)
- `pg` (PostgreSQL 드라이버)
- Vercel Serverless (`@vercel/node`)

## 로컬 실행

```bash
npm install
cp .env.example .env
# .env 에 DATABASE_URL, GROK_API_KEY 채우기
npm run dev
# → http://localhost:3002
```

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 단일 HTML UI |
| GET | `/api/context` | `user-context.md` 내용 반환 |
| GET | `/api/db-summary` | 최근 30일 수입·지출·카테고리 집계 |
| POST | `/api/chat` | AI 채팅 (`withContext: true`면 Context+DB 주입) |

## Vercel 환경변수

| 키 | 값 예시 |
|----|--------|
| `DATABASE_URL` | Supabase pooler 연결 문자열 (포트 6543) |
| `GROK_API_KEY` | Groq API 키 (`gsk_...`) |

## Before/After 데모 포인트

- `withContext: false` → 일반 AI 답변
- `withContext: true` → 이희석 님 프로필 + 실제 재정 데이터 기반 개인화 답변
