# 나만의 ChatGPT 제작 프로젝트 보고서

**harbor.school AI 부트캠프 2기 평일반 | Network + AI 융합 프로젝트**

| 항목 | 내용 |
|------|------|
| 프로젝트명 | DAON AI — 나만의 ChatGPT |
| 작성자 | 수강생 (DAON) |
| 작성일 | 2026년 4월 5일 |
| 서버 주소 | http://localhost:3000 |

---

## 1. 프로젝트 개요

Node.js 순수 `http` 모듈로 서버를 직접 구축하고, OpenAI GPT API를 연동하여  
**나만의 ChatGPT 웹 서비스**를 제작한 프로젝트입니다.  
프레임워크(Express 등) 없이 Network 계층을 직접 다루는 것이 핵심 학습 목표입니다.

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | Node.js (`http`, `https`, `fs` 모듈) |
| Frontend | React 18 (CDN), Tailwind CSS, Babel Standalone |
| AI | OpenAI GPT API (`gpt-4o-mini` 기본) |
| 실시간 통신 | SSE (Server-Sent Events) 스트리밍 |
| 인증 | 세션 토큰 기반 로그인 (메모리 세션) |
| 데이터 저장 | localStorage (대화 기록), `users.json` (계정 정보) |
| 마크다운 | marked.js + highlight.js (코드 하이라이팅) |

---

## 3. 구현 기능 목록 (총 12가지)

- ✅ **스트리밍 채팅** — SSE 방식 실시간 타이핑 효과
- ✅ **마크다운 렌더링** — 코드 블록 하이라이팅 + 원클릭 복사
- ✅ **다크 / 라이트 모드** — 토글 전환, 설정 localStorage 저장
- ✅ **대화 목록 관리** — 사이드바, 새 대화, 삭제, 자동 제목 생성
- ✅ **GPT 모델 선택기** — 헤더 드롭다운 (모델별 요금 표시)
- ✅ **시스템 프롬프트 커스터마이징** — 설정 모달 + 프리셋 6종
- ✅ **토큰 사용량 보고서** — 실시간 집계, USD·원화(₩) 비용 환산
- ✅ **코드 검수 기능** — 100점 채점, 항목별 피드백, 수정 코드 제안
- ✅ **로그인 / 로그아웃** — 세션 토큰 발급, 서버 측 유효성 검증
- ✅ **사용자 관리** — admin 전용 계정 추가·삭제 (역할: admin/user)
- ✅ **대화 검색** — 사이드바 실시간 키워드 필터링
- ✅ **대화 내보내기** — `.md` 파일 다운로드

---

## 4. Network 학습 포인트

| 개념 | 적용 내용 |
|------|-----------|
| HTTP 서버 직접 구축 | `http.createServer()` — Express 미사용 |
| API 프록시 패턴 | 프론트 → 내 서버 → OpenAI (API 키 보호) |
| SSE 스트리밍 | `Content-Type: text/event-stream` 실시간 응답 |
| CORS 처리 | `Access-Control-Allow-Origin` 헤더 직접 설정 |
| REST API 설계 | `POST /api/login`, `POST /api/chat`, `GET /api/models` 등 |
| 인증 미들웨어 | `Authorization: Bearer {token}` 헤더 검증 |

---

## 5. AI 학습 포인트

- **Chat Completions API** — `messages` 배열로 대화 컨텍스트 유지
- **스트리밍 옵션** — `stream: true`, `stream_options: { include_usage: true }`
- **시스템 프롬프트 엔지니어링** — 완벽주의 보고체 AI, 코드 검수 전문가 등 역할 설계
- **토큰 비용 계산** — `prompt_tokens` / `completion_tokens` 분리 집계

---

## 6. 프로젝트 구조

```
[Network]MyChatGPT/
├── server.js      # Node.js HTTP 서버 (인증 + OpenAI 프록시)
├── index.html     # React 단일 파일 앱 (1,400+ 줄)
├── users.json     # 사용자 계정 데이터 (admin/user 역할)
├── report.md      # 프로젝트 보고서 (현재 파일)
└── .env           # OpenAI API 키 (gitignore 필수)
```

---

## 7. 핵심 요약

> **"Network 없이 AI만 있으면 반쪽짜리다."**  
> 이 프로젝트는 HTTP 서버 구축부터 SSE 스트리밍, 인증 시스템, API 프록시까지  
> 네트워크 전 계층을 직접 구현하며 AI 서비스의 동작 원리를 체득했습니다.

---

*harbor.school AI 부트캠프 2기 평일반 · 2026.04.05*
