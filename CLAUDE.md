# AFM 2기 평일반 — AI 학습 전용 Claude 설정

> **부트캠프**: harbor.school AI 부트캠프 2기 평일반
> **목표**: AI 선구자 · 코딩 입문자 → 실전 앱 개발자
> **폴더**: 학습 전용 (DAONAI ERP와 분리)

---

## 언어 원칙

- 모든 답변은 **한국어** (코드/명령어/고유명사만 원문 유지)
- 수강생 눈높이 — 전문용어는 반드시 풀어서 설명
- 영어 용어 남발 금지

---

## 커리큘럼 (5주)

| 주차 | 주제 | 핵심 기술 | 폴더 |
|------|------|----------|------|
| Week 1 | AI 기초 + 문서 작성 | Markdown · Claude 프롬프트 | `week_1/` |
| Week 2 | HTML/CSS/JS 기초 앱 | React CDN · Tailwind · Canvas | `week_2/` |
| Week 3 | 네트워크 + AI 서버 앱 | Node.js · OpenAI API · SSE | `week_3/` |
| Week 4 | 서버 + DB | Supabase · Auth · 관계형 DB | `week_4/` |
| Week 5 | 실전 배포 + 통합 | Vercel · 도메인 · 모니터링 | `week_5/` |

상세 진행 내역: `timetable.md`

---

## 한국어 → 에이전트 라우팅

| 지시 패턴 | 에이전트 | 용도 |
|----------|---------|------|
| "설명해줘" · "이해가 안 돼" · "~가 뭐야?" · "코드 해설" | `learn.afm-tutor` | 개념·코드 설명 |
| "일기 써줘" · "회고" · "오늘 정리" · "뭐 배웠지" | `learn.afm-diary` | 학습 일기 작성 |
| "프로젝트 만들어줘" · "앱 스캐폴딩" · "실습 준비" | `learn.afm-project` | 주차별 미니앱 생성 |
| "리뷰해줘" · "내 코드 봐줘" · "과제 검사" · "피드백" | `learn.afm-reviewer` | 코드 리뷰 |
| "웹앱 만들어줘" · "React 앱" · "단일 HTML" · "프론트엔드" | `single-react-dev` | React SPA 제작 (강사 제공) |
| "서버 만들어줘" · "server.js" · "Express" · "API 엔드포인트" · "Node.js 서버" | `single-server-specialist` | Node.js 백엔드 제작 (강사 제공) |
| "배포해줘" · "Vercel" · "vercel.json" · "환경변수 설정" · "배포 오류" | `vercel-deploy-optimizer` | Vercel 배포 전문 (강사 제공) |
| "AI 기능" · "챗봇" · "OpenAI" · "스트리밍" | `AI-개발자` | AI API 통합 |
| "기획해줘" · "설계 · 아이디어 검토" | `기획자` | 기획·PRD |
| "검토해줘" · "버그" · "보안 체크" | `검토자` | 코드 리뷰 (실무급) |
| "PR" · "GitHub" · "머지" | `배포자` | PR·GitHub 작업 |
| "레시피" · "요리" · "냉장고" | `quick-recipe-creator` | 레시피 실습 |
| "K드라마" · "드라마 추천" | `k-drama-expert` | 드라마 분석 실습 |

상세 라우팅 기준: `.claude/skills/harness-kr/references/routing-guide.md`

---

## 슬래시 스킬 (학습 전용)

| 명령 | 용도 |
|------|------|
| `/week-start N` | 새 주차 시작 — 폴더·일기·회고 템플릿 생성 |
| `/week-retro N` | 주차 마감 회고 — 일기 집계·성장 포인트 추출 |
| `/harness-kr` | 에이전트 시스템 재구성 |
| `/parallel` | Cursor와 병렬 작업 |

gstack 스킬 (범용): `/browse`, `/qa`, `/ship`, `/review`, `/design-review`, `/investigate` 등
전체 목록: `.claude/skills/` 참조

---

## 승인 워크플로우 (필수)

### Phase 1 — 기획 (착수 전)
```
## 📋 작업 계획 — 승인 요청

작업명: [제목]

진행할 내용:
1. ...
2. ...

변경될 파일:
- [경로] — [내용]

예상 결과: [완료 시 상태]

✅ 진행할까요?
```

승인 키워드: `예` `네` `ㅇ` `ok` `OK` `진행` `승인` `go` `ㄱ`

### Phase 2 — 실행 (승인 후)
- 추가 승인 요청 **절대 금지**
- 중간 확인 질문 **금지**
- 오류 발생 시 스스로 해결 (최대 3회 재시도)
- 3회 실패 시에만 사용자에게 보고 후 대기

### Phase 3 — 완료 보고
```
## ✅ 작업 완료 보고

| 항목 | 결과 |
|------|------|
| [작업1] | 완료 |

변경된 파일:
- [파일]: [내용]

## 📌 다음 작업 지시서
1. [다음 작업] — [명령]
```

### 예외 (승인 없이 즉시 실행)
- 단순 질문·설명 요청
- 파일 읽기·조회만 하는 작업
- 개념 해설 요청

---

## 수강생 배려 원칙

1. **칭찬 먼저** — 잘한 점 3개 찾은 뒤 개선점 제시
2. **"왜"를 설명** — "이렇게 해" ❌ → "~한 이유로" ⭕
3. **비유 사용** — "함수는 자판기, 인수는 동전, 반환값은 음료"
4. **작게 나누기** — 한 번에 1~3줄씩 해설
5. **실수 환영** — 오류 메시지도 함께 해석

---

## 학습 결과물 관리

### 폴더 구조
```
afm-2th-weekday/
├── week_1/
│   ├── diary/YYYY.MM.DD.md        # 일기
│   ├── projects/                  # 프로젝트
│   ├── notes/                     # 수업 노트
│   ├── README.md                  # 주차 개요
│   └── weekly-retro.md            # 주간 회고
├── week_2/ ... week_5/
├── timetable.md                   # 전체 진행표 (자동 갱신)
└── CLAUDE.md
```

### 자동 갱신 규칙
- 일기 작성 시 → `timetable.md`의 해당 주차 결과물 컬럼 자동 갱신
- 회고 작성 시 → 주차별 학습 키워드 업데이트
- 프로젝트 스캐폴딩 시 → README에 학습 포인트 3개 자동 기록

---

## Cursor AI 병렬 연동

**트리거**: "커서연결" 발화 시 아래 안내 출력

```
## 🔗 커서 연결 가이드

### 1단계 — Cursor PATH 등록 (최초 1회)
Cursor → Ctrl+Shift+P → "Install 'cursor' command in PATH"

### 2단계 — Cursor 터미널에서 Claude 실행
Cursor 내 터미널 (Ctrl+Shift+`) → claude 입력

### 3단계 — IDE 연결
Claude 프롬프트에서 → /ide → cursor 선택
```

**역할 분담**:
- Claude Code (터미널): 멀티파일·서버·API·스캐폴딩
- Cursor 채팅창: 단일 파일 UI·스타일 (`Ctrl+L`)

MCP 작업 현황: `.mcp.json`의 `parallel-coordinator`의 `get_summary` 도구

---

## 에이전트 네이밍 규칙 (학습 폴더)

형식: `learn.afm-{role}` 또는 범용 `{project}.{role}`

| 접두사 | 용도 |
|--------|------|
| `learn.afm-*` | AFM 학습 전용 (tutor, diary, project, reviewer) |
| `single-*` | 단일 파일 기반 앱 제작 |
| (없음) | 범용 (`AI-개발자`, `기획자`, `검토자`, `배포자`) |

- 에이전트 파일: `.claude/agents/{name}.md`
- ERP 관련 에이전트 **절대 추가 금지** (DAONAI 폴더 전용)

---

## 금지사항

1. **ERP 에이전트 호출 금지** — 이 폴더는 학습 전용
2. **DAONAI 경로 참조 금지** — `G:\내 드라이브\DAONAI\` 건드리지 말 것
3. **과도한 최적화 강요 금지** — 수강생 레벨 존중
4. **빌드 도구 초기 세팅 금지** — Week 2~3은 CDN으로
5. **TypeScript 강요 금지** — 학습 입문 단계

---

## 트리거: "작업내역 요약"

사용자가 **"작업내역 요약"** 발화 시:
1. 타임테이블(표) 형식 요약
2. 각 행: 순서·작업 주제·핵심 변경·결과 상태
3. 하단에 다음 액션 3개 이내
4. 한국어 간결하게

---

## 트리거: "일기", "회고", "정리"

- 단어 감지 시 `learn.afm-diary` 에이전트 자동 호출
- 현재 주차 확인 → `week_N/diary/YYYY.MM.DD.md` 생성·업데이트

---

## gstack

`/browse` 사용. `mcp__claude-in-chrome__*` 도구 금지.

gstack 스킬 동작 안 할 시: `cd .claude/skills/gstack && ./setup`

---

## 주의

- 이 폴더는 **학습·실습 전용**입니다
- 실제 운영 시스템(DAONMS ERP)과 분리 유지
- 결과물은 Git으로 버전 관리 (`.gitignore`에 `.env`·`node_modules` 포함)
