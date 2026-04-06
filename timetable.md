# AFM 2기 평일반 — 진행 타임테이블

> 부트캠프 harbor.school AI 부트캠프 2기 평일반  
> 목표: AI 선구자 · 코딩 입문자 → 실전 앱 개발자

---

## Week 1 — AI 기초 + 문서 작성 (03.17 ~ 03.23)

| 날짜 | 활동 | 결과물 |
|------|------|--------|
| 03.17 (월) | 부트캠프 첫 수업, Claude 에이전트 설정 | `week_1/diary/2026.03.17.md` |
| 03.17 (월) | 레시피 작성 실습 (풍당당면 원가 분석 포함) | `poongdang-dangmyeon.md` · `bunsik-tteokbokki.md` |
| 03.23 (일) | K-드라마 / 레시피 요청 실습 스크린샷 | `oyster-sauce-fried-rice.md` |
| 03.23 (일) | 일기 작성 및 회고 | `week_1/diary/2026.03.23.md` |

**Week 1 핵심 학습**: Claude 프롬프트 작성법, Markdown 문서화, AI 에이전트 기본 사용

---

## Week 2 — HTML/CSS/JS 기초 앱 개발 (03.24 ~ 03.30)

| 날짜 | 앱 | 기술 | 폴더 |
|------|-----|------|------|
| 03.24 (월) | 나이 계산기 | HTML · CSS · JS | `나이계산기/` |
| 03.24 (월) | iPhone 스타일 계산기 | HTML · CSS · JS | `Html-css-js/` |
| 03.24 (월) | D-day 카운터 | HTML · CSS · JS | `D-day카운터/` |
| 03.24 (월) | HEX 컬러 생성기 | HTML · CSS · JS | `Hex코드생성기/` |
| 03.26 (수) | 고메정식당 Apple 스타일 웹사이트 | HTML · CSS (Rolex 그린 테마) | `고메정식당/` |
| 03.30 (일) | 더치페이 계산기 | React · Tailwind | `[Caculation] 더치페이 계산기/` |
| 03.30 (일) | 세금 계산기 | React · Tailwind | `[Caculation] 세금 계산기/` |
| 03.30 (일) | 짤 생성기 | React · Canvas API | `[Transform] 짤 생성기/` |
| 03.30 (일) | QR 코드 생성기 | React · QR 라이브러리 | `[Transform] QR 코드 생성기/` |
| 03.30 (일) | PDF 생성기 | React · jsPDF | `[Transform] PDF 생성기/` |

**Week 2 핵심 학습**: React 컴포넌트, Tailwind CSS, CDN 기반 SPA, Canvas API, 외부 라이브러리 활용

---

## Week 3 — Network + AI 서버 앱 개발 (03.31 ~ 04.06)

### Phase 1: 네트워크 기초 앱 (03.31)

| 시간 | 앱 | 기술 | 폴더 |
|------|-----|------|------|
| 03.31 20:59 | 포켓몬 도감 (PokeAPI) | fetch · REST API | `Pokemon-search/` |
| 03.31 20:59 | 날씨 검색 앱 (위치 자동 감지) | OpenWeatherMap API · Geolocation | `weather/` |
| 03.31 22:16 | NASA APOD 우주 사진 뷰어 | NASA Open API | `NASA-APOD/` |
| 03.31 22:16 | Simple Server (비밀 메모) | Node.js http 서버 | `simple-server/` |
| 03.31 22:27 | Simple Server2 (client/server 분리) | Node.js · CORS | `simple-server2/` |

### Phase 2: AI 챗봇 서버 (03.31)

| 시간 | 앱 | 기술 | 폴더 |
|------|-----|------|------|
| 03.31 22:52 | 나만의 ChatGPT (로그인 포함) | Node.js · OpenAI API · SSE 스트리밍 · 세션 인증 | `[Network]MyChatGPT/` |
| 03.31 22:52 | 마음이 AI 심리상담 챗봇 | OpenAI API · 감성 시스템 프롬프트 | `MYChatGPT/` |
| 03.31 22:52 | AI 별명 생성기 | OpenAI API · 서버 사이드 렌더링 | `[Server+AI]AI별명생성기/` |

### Phase 3: 이미지 생성 서비스 — 나만의 Midjourney (04.05 ~ 04.06)

| 순서 | 구현 내용 | 기술 포인트 |
|------|----------|------------|
| ① 기반 구축 | Node.js 서버 + React 프론트 초기 셋업 | 정적 파일 서빙, CORS, .env 로드 |
| ② 텍스트 생성 | DALL-E 3 이미지 생성 + 화풍 10종 | `/api/generate` · 프롬프트 프리셋 결합 |
| ③ 이미지 업로드 | DALL-E 2 변형/편집 기능 추가 | multipart/form-data 수동 구성 |
| ④ 오류 수정 | 정사각형 PNG 자동 변환 | Canvas API로 업로드 전 전처리 |
| ⑤ API 키 설정 | OpenAI 키 .env 적용 | 서버 재시작으로 적용 확인 |
| ⑥ 로고 디자인 | 로고 전용 모드 추가 | 스타일 8종 · 업종 10종 · 컬러 7종 |
| ⑦ PPT 디자인 | PPT 슬라이드 배경 생성 모드 추가 | 슬라이드 타입 6종 · 테마 8종 · 레이아웃 4종 |
| ⑧ 보고서 | 프로젝트 보고서 작성 | `report.md` |

---

## 전체 결과물 요약

| 주차 | 앱 수 | 핵심 기술 |
|------|-------|----------|
| Week 1 | 문서 5건 | Markdown · AI 프롬프트 |
| Week 2 | 앱 9개 | HTML/CSS/JS · React · Tailwind |
| Week 3 | 앱 9개 + 이미지서비스 1개 | Node.js 서버 · REST API · OpenAI · DALL-E |
| **합계** | **앱 19개 + 문서** | — |

---

## 나만의 Midjourney 기능 완성도

```
[✅] 텍스트로 생성     DALL-E 3 · 화풍 10종 · 크기 3종 · 품질 2종
[✅] 이미지 변환       DALL-E 2 · 변형/편집 · 자동 PNG 변환
[✅] 로고 디자인       스타일 8 · 업종 10 · 컬러 7
[✅] PPT 디자인        슬라이드타입 6 · 테마 8 · 레이아웃 4 · 컬러 8
[✅] 갤러리            최근 20장 세션 저장 · 클릭 모달 확대
[✅] 다운로드          생성 이미지 바로 저장
[✅] 보고서            report.md 작성 완료
```

---

## 실행 방법

```bash
node week3/[Network]MyMidjourney/server.js
# → http://localhost:3001
```
