# AFM 2기 평일반 — Week 5 주간 회고

> 기간: 2026.04.20 (월) ~  
> 주제: 실전 배포 + 통합  
> 작성일: 2026.04.20

---

## 이번 주 한 줄 요약

MCP 자동화 에이전트 + 텔레그램 AI 비서 + 풀스택 가계부 앱까지, 단 하루에 "실제 서비스"를 3개 만들고 배포했다.

---

## 완성 결과물

| 순서 | 결과물 | 기술 스택 | 배포/경로 |
|------|--------|----------|----------|
| 1 | Notion MCP 실습 | Notion MCP API | 수업 실습 |
| 2 | 텔레그램 + Notion AI 비서 | Telegram Bot API · Groq Llama 3.3 · Notion API · node-cron | `week_5/telegram-notion-bot/` |
| 3 | Chrome MCP AI 뉴스 리서치 에이전트 | Chrome MCP · Groq 요약 · Notion 업로드 | `week_5/ai-news-research/2026-04-20.md` |
| 4 | 텔레그램 뉴스 브리핑 기능 (/뉴스 · 스케줄러) | RSS XML 정규식 파싱 · node-cron | `week_5/telegram-notion-bot/server.js` |
| 5 | 가계부 풀스택 앱 (CRUD 전체) | Express · pg Pool · Supabase PostgreSQL · React CDN · Tailwind | `week_5/budget-app/` |
| 6 | 가계부 Vercel 배포 + 수정 기능 | Vercel 서버리스 · PUT API · EditModal | https://budget-app-alpha-one.vercel.app |

---

## 핵심 성장 포인트 3가지

### 1. AI 에이전트와 단순 챗봇의 차이를 몸으로 이해했다

tool_use(function calling) 패턴을 직접 구현하면서 "LLM이 스스로 어떤 도구를 쓸지 결정한다"는 것을 체감했다. 이전까지는 "프롬프트 → 응답" 패턴이 전부였다면, 이번 주에는 "프롬프트 → LLM이 함수 선택 → 서버 실행 → 결과를 LLM에게 다시 전달 → 최종 응답"이라는 에이전트 루프를 직접 코딩했다. 이것이 Week 5 가장 큰 개념 점프였다.

### 2. Supabase를 "anon key 없이" 쓰는 방법을 터득했다

지금까지는 Supabase JS SDK + anon key 방식만 썼다. 이번 가계부 앱에서는 Express 서버에서 `pg Pool`로 `DATABASE_URL`에 직접 연결해 순수 PostgreSQL 쿼리를 날리는 방식을 처음 적용했다. SDK가 추상화해주던 것들 — 테이블 구조, SQL 쿼리 작성, timezone 처리 — 을 직접 다루면서 Supabase가 결국 PostgreSQL임을 실감했다.

### 3. Vercel 서버리스 배포 패턴을 완전히 내 것으로 만들었다

`module.exports = app` + `require.main === module` 조건 분기로 Vercel 서버리스 환경과 로컬 개발 환경을 하나의 파일로 동시에 지원하는 패턴을 완성했다. `vercel.json` 라우팅 설정까지 포함해 "코드 완성 → push → 자동 배포"의 전체 흐름을 반복 훈련했다.

---

## 아쉬운 점 / 개선할 것

- **RSS 파싱을 정규식으로 구현** — 동작은 하지만 XML 구조가 바뀌면 깨진다. 다음번엔 `rss-parser` 라이브러리를 쓰는 게 더 견고하다.
- **DATE timezone 버그를 배포 후에 발견** — 로컬에서 pg를 테스트할 때 timezone 문제를 미리 확인했어야 했다. `to_char()` 패턴을 처음부터 습관화하자.
- **가계부 앱 에러 핸들링 미흡** — API 오류 시 UI에 피드백이 거의 없다. 다음 앱부터는 try/catch + 토스트 메시지를 기본값으로 포함하자.

---

## 이번 주 기술 키워드

`MCP` `tool_use` `function calling` `Telegram Bot API` `Groq API` `Llama 3.3` `node-cron` `RSS 파싱` `Chrome MCP` `Notion API` `pg Pool` `DATABASE_URL` `Express 서버리스` `Vercel` `module.exports` `require.main` `to_char` `React 상태 끌어올리기` `EditModal` `CRUD 풀스택`

---

## 전체 부트캠프 관점에서 본 Week 5

| 주차 | 핵심 전환점 |
|------|------------|
| Week 1 | AI 도구 사용자가 됨 |
| Week 2 | 프론트엔드 직접 만들기 시작 |
| Week 3 | 서버 + AI API 연결 |
| Week 4 | DB 연동 + 인증 |
| **Week 5** | **MCP 자동화 + 풀스택 배포 + AI 에이전트 설계** |

Week 5는 "쓰는 사람"이 아니라 "만드는 사람"의 관점이 완전히 정착된 주였다. 텔레그램 봇이 오전 9시에 알아서 뉴스를 요약해서 보내주고, 가계부 앱이 실제 도메인에서 돌아간다 — 이게 5주 전과의 차이다.

---

## 다음 주 목표
- [ ] 가계부 앱 월별 필터 + 카테고리 차트 강화
- [ ] 텔레그램 봇에 가계부 데이터 조회 연동
- [ ] Vercel Cron으로 스케줄러 서버리스 전환
- [ ] 최종 프로젝트 기획 시작
