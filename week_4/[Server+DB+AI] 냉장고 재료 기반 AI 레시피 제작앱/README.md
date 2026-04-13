# [Server+DB+AI] 냉장고 재료 기반 AI 레시피 제작앱

## 기능

- 재료 추가/조회/삭제
- 저장된 재료를 기반으로 AI 레시피 자동 생성
- AI 생성 레시피 DB 저장
- 저장된 레시피 목록 조회

## 환경 변수

`.env.example`를 참고해 아래 값을 설정하세요.

- `DATABASE_URL`: Supabase Postgres 연결 문자열
- `OPENAI_API_KEY`: OpenAI API 키
- `OPENAI_MODEL` (선택): 기본값 `gpt-4.1-mini`
- `PORT` (선택): 기본값 `3010`

## 실행

```bash
npm install
npm start
```

브라우저: `http://localhost:3010`

## SQL 연결 확인

1. `.env.example`를 복사해 `.env` 생성
2. `DATABASE_URL`에 Supabase Postgres 연결 문자열 입력
3. 서버 실행 후 아래 헬스체크 호출:

```bash
curl http://localhost:3010/api/health
```

정상 예시:

```json
{
  "ok": true,
  "db": true,
  "api": true,
  "hasOpenAiKey": true
}
```

## API 연결 확인

```bash
# 재료 목록
curl http://localhost:3010/api/ingredients

# 레시피 목록
curl http://localhost:3010/api/recipes
```

## DB 스키마

- 서버 시작 시 `ingredients`, `recipes` 테이블을 자동 생성합니다.
- 수동 적용이 필요하면 `supabase-schema.sql`을 실행하세요.
