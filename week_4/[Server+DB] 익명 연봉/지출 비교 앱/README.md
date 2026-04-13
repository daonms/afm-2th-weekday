# [Server+DB] 익명 연봉/지출 비교 앱

Supabase(PostgreSQL) + Express 서버 기반 익명 통계 비교 앱입니다.

## 기능

- 익명으로 `월급`, `월 지출`, `직군`, `연차`, `카테고리별 지출` 제출
- 전체 평균(월급/지출), 분포(Q1/중앙값/Q3), 내 위치(월급 상위 %, 지출 백분위) 표시
- 카테고리별 평균 지출(식비/주거/교통/구독료/기타) 비교
- 직군/연차 필터(`job_group`, `min_years`, `max_years`) 기반 통계 조회
- 모든 데이터는 DB에 익명 저장

## 실행

```bash
npm install
cp .env.example .env
# .env에 DATABASE_URL 입력
npm start
```

브라우저: `http://localhost:3011`

## API

- `POST /api/submissions` 익명 데이터 저장 + 내 위치 포함 통계 반환
- `GET /api/stats` 전체 통계 조회 (선택 쿼리: `job_group`, `min_years`, `max_years`, `entry_id`)
- `GET /api/health` DB 연결 확인
- `DELETE /api/submissions` 샘플 데이터 초기화 (`x-reset-key` 헤더 필요)

### job_group 코드

- `dev`(개발), `design`(디자인), `pm`(기획), `marketing`(마케팅), `sales`(영업), `ops`(운영), `other`(기타)

## Supabase SQL 수동 생성

`supabase-schema.sql` 실행
