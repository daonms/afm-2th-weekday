# Project Claude Config

## 승인 워크플로우 — 모든 작업에 필수 적용

### 규칙 요약
1. **기획 단계**: 승인이 필요한 항목을 리스트로 출력하고 **1번만** 승인 요청
2. **1차 승인 후**: 작업 완료까지 **절대 승인 요청 금지** (중간 확인·질문도 금지)
3. **완료 후**: 완료 보고 + 다음 작업 내역 및 지시서 출력

### Phase 1 — 기획 단계 (승인 전)

작업 착수 전 반드시 아래 형식으로 승인 목록 출력:

```
## 📋 작업 계획 — 승인 요청

**작업명**: [작업 제목]

### 진행할 내용
1. [구체적인 작업 항목]
2. [구체적인 작업 항목]
3. ...

### 변경될 파일
- [파일 경로] — [변경 내용]

### 예상 결과
[완료 시 어떤 상태가 되는지]

---
✅ 진행할까요? (승인 후 완료까지 중간 보고 없이 진행합니다)
```

승인 인식 키워드: `예`, `네`, `ㅇ`, `ok`, `OK`, `진행`, `승인`, `go`, `ㄱ`

### Phase 2 — 작업 실행 (승인 후)

- 추가 승인 요청 **절대 금지**
- 중간 확인 질문 **금지**
- 오류 발생 시 스스로 해결 후 계속 진행 (최대 3회 재시도)
- 재시도 3회 실패 시에만 사용자에게 보고 후 대기

### Phase 3 — 완료 보고 (작업 후)

작업 완료 시 반드시 아래 형식으로 출력:

```
## ✅ 작업 완료 보고

### 완료된 작업
| 항목 | 결과 |
|------|------|
| [작업1] | 완료 |
| [작업2] | 완료 |

### 변경된 파일
- [파일]: [변경 내용]

---

## 📌 다음 작업 지시서

**권장 다음 단계**:
1. [다음 작업 제목]
   - 내용: [구체적 지시]
   - 명령: `[실행할 명령어 또는 지시문]`

2. [다음 작업 제목]
   - 내용: [구체적 지시]
```

### 예외 (승인 없이 즉시 실행)
- 단순 질문·설명 요청
- 파일 읽기·조회만 하는 작업
- 오류 메시지 분석

---

## 한국어 하네스 시스템 (harness-kr) — 최우선 실행

**대화 시작 시 반드시 다음을 수행하세요:**

1. `.claude/.harness-initialized` 파일을 읽어보세요 (Read 도구 사용).
2. **파일이 없으면**: 다른 작업을 시작하기 전에 사용자에게 이 메시지를 먼저 출력하세요:

   > **"프로젝트 에이전트 시스템을 구축할까요?"**
   > *(승인하면 에이전트 팀과 스킬이 자동으로 최적화됩니다)*

3. 사용자가 승인(예/네/ㅇ/ok/yes 등)하면 `/harness-kr` 스킬을 실행하세요.
4. **파일이 있으면**: 아래 라우팅 가이드에 따라 한국어 작업 지시를 받아 적합한 에이전트에게 라우팅하세요.

### 한국어 라우팅 가이드 (초기화 후)

| 한국어 지시 패턴 | 에이전트 |
|----------------|---------|
| 웹앱/대시보드/UI/React 만들어줘 | `single-react-dev` |
| 서버/API/백엔드/Express 만들어줘 | `server` |
| AI/Claude API/챗봇/스트리밍 | `AI-개발자` |
| 기획/설계/아이디어/방향 | `기획자` |
| 코드 리뷰/버그/보안/검토 | `검토자` |
| 배포/Vercel/PR/GitHub | `배포자` |
| 냉장고/레시피/요리/뭐 먹지 | `quick-recipe-creator` |
| 드라마/K드라마 추천 | `k-drama-expert` |
| ERP/서버관리/Docker | `daon-erp-remote` |
| DB/쿼리/PostgreSQL | `erp-db` |
| 매출/매입/PnL/분석 | `erp-analyst` |
| n8n/워크플로우/Telegram | `erp-n8n` |
| ERP 웹앱/PostgREST | `erp-webapp` |

라우팅 상세 기준: `.claude/skills/harness-kr/references/routing-guide.md` 참고

| 병렬 작업 요청 | 스킬 |
|--------------|------|
| "병렬로 해줘", "Cursor랑 같이", "/ide cursor", "동시에 작업" | `/parallel` |

---

## Cursor AI 병렬 연동 (/ide cursor)

Claude Code가 Cursor IDE를 직접 제어하는 연결 방식:

**연결 순서 (최초 1회 설정)**:
1. Cursor Command Palette (`Ctrl+Shift+P`) → "Install 'cursor' command in PATH"
2. Cursor 내 터미널 (`Ctrl+Shift+\``) → `claude` 실행
3. Claude 프롬프트에서 `/ide` → cursor 선택

**병렬 역할 분담**:
- **Claude Code (터미널)**: 멀티파일 수정·구조 설계·테스트·API 구현 → Cursor 탭에 diff 표시
- **Cursor 채팅창**: 단일 파일 세밀한 편집 (`Ctrl+L`로 코드 선택 후 채팅)

**작업 추적**: `.mcp.json`의 `parallel-coordinator` MCP 서버 (`list_tasks`, `create_task` 등)

---

## gstack
Use `/browse` from `gstack` for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills: /harness-kr, /parallel, /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /daon-erp.

If gstack skills aren't working, run:
`cd .claude/skills/gstack && ./setup`

## DAONMS ERP 원격 서버 통제

### SSH 접속
- **서버**: daonms-i7-1 (100.123.134.44)
- **사용자**: i7dt
- **키**: `~/.ssh/id_ed25519`
- **명령어**: `ssh -i ~/.ssh/id_ed25519 i7dt@100.123.134.44 "<command>"`
- **서버 경로**: `/home/i7dt/daon-erp`

### 에이전트 선택 가이드
| 작업 | 에이전트 |
|------|----------|
| 서버 관리·Docker·일반 명령 | `daon-erp-remote` |
| DB 스키마·쿼리·DDL·마이그레이션 | `erp-db` |
| 매입/매출/PnL 분석·보고서 | `erp-analyst` |
| n8n 워크플로우·Code 노드·챗봇 | `erp-n8n` |
| 웹앱 UI·PostgREST 연동 | `erp-webapp` |

### 서비스 URL
| 서비스 | URL |
|--------|-----|
| ERP 웹앱 | erp.daonms.com |
| REST API | api.daonms.com |
| n8n 워크플로우 | n8n.daonms.com |
| KPI 대시보드 | kpi.daonms.com |
| DB 관리 | sql.daonms.com |
| AI Proxy | code.daonms.com |

### 필수 금지사항
- 운영 DB DROP/대량삭제: 사용자 확인 필수
- ERP_v6 워크플로우: CLI import 금지 (UI에서만)
- Telegram setWebhook 수동 호출 금지
- 구 Drive credential `7zat0DXsDPXJRkLH` 사용 금지
- 이카운트 로그인 재시도 3회 제한

---

## 사용자 트리거 지침: "커서연결"

사용자가 **"커서연결"** 이라고 말하면, Cursor AI 병렬 연동 상태를 확인하고 안내한다:

1. **MCP 서버 상태 확인**: `parallel-coordinator` 연결 여부 출력
2. **IDE 연결 상태 안내**:
   ```
   ## 🔗 커서 연결 가이드

   ### 1단계 — Cursor PATH 등록 (최초 1회)
   Cursor → Ctrl+Shift+P → "Install 'cursor' command in PATH"

   ### 2단계 — Cursor 터미널에서 Claude 실행
   Cursor 내 터미널 (Ctrl+Shift+`) → claude 입력

   ### 3단계 — IDE 연결
   Claude 프롬프트에서 → /ide → cursor 선택

   연결 완료 시: Claude Code가 Cursor 탭에 파일을 직접 열고 diff 표시
   ```
3. **MCP 작업 현황**: `parallel-coordinator`의 `get_summary` 도구로 현재 작업 수 출력
4. **병렬 역할 안내**:
   - Claude Code (터미널): 멀티파일·서버·API
   - Cursor 채팅창: 단일 파일·UI (`Ctrl+L` 사용)

---

## 사용자 트리거 지침: "작업내역 요약"

사용자가 정확히 **"작업내역 요약"** 이라고 말하면, 현재 세션에서 진행한 작업을 아래 형식으로 정리한다.

1. **타임테이블(표) 형식**으로 먼저 요약
2. 각 행에는 최소한 다음 정보를 포함:
   - 순서
   - 작업 주제
   - 핵심 변경/조치
   - 결과 상태(완료/진행중/이슈)
3. 필요 시 하단에 **다음 액션(체크리스트)** 3개 이내로 추가
4. 응답은 한국어로 간결하게 작성

