---
name: parallel
description: Claude Code와 Cursor AI를 병렬로 연결하는 오케스트레이터. Claude Code가 Cursor IDE를 직접 제어하며 큰 작업을 담당하고, Cursor 채팅은 세밀한 편집을 담당한다. 트리거: "병렬로 해줘", "Cursor랑 같이 작업", "IDE 연결", "/ide cursor".
version: 2.0.0
author: DAONMS
---

# /parallel — Claude Code ↔ Cursor AI 병렬 작업

## 연결 구조

```
Cursor 채팅창 ──────── 세밀한 편집 (한 파일, 빠른 수정)
Cursor 터미널
  └─ claude 실행
       └─ /ide cursor ── Claude Code가 Cursor를 직접 제어
                         (멀티파일, 리팩터링, 테스트, 구조 설계)
```

---

## Phase 0 — IDE 연결 확인

먼저 `/ide cursor` 연결 여부를 확인하세요.

**연결이 안 된 경우** 사용자에게 안내:

```
Cursor와 연결하려면:

1. Cursor에서 프로젝트 폴더 열기
2. Cursor Command Palette (Ctrl+Shift+P) 열기
   → "Shell Command: Install 'cursor' command in PATH" 실행 (최초 1회)
3. Cursor 내 터미널 열기 (Ctrl+Shift+`)
4. 터미널에서: claude 실행 (이미 실행 중이면 이 세션)
5. /ide cursor 입력 → Cursor 연결 완료

연결 후 Claude Code가 Cursor에 파일을 직접 열고 수정할 수 있습니다.
```

**연결 확인**: `/ide` 명령 목록에 cursor가 보이면 연결됨.

---

## Phase 1 — 작업 분배 설계

사용자 요청을 두 가지 트랙으로 분리:

| 트랙 | 담당 | 작업 유형 |
|------|------|---------|
| **Claude Code** | 터미널 | 멀티파일 수정, 구조 설계, 테스트 작성, API 구현 |
| **Cursor 채팅** | 채팅창 | 단일 파일 편집, 빠른 버그수정, 코드 설명 |

분배 결과를 사용자에게 제시하고 승인받으세요:
```
Claude Code 담당:
  - server.js → API 엔드포인트 3개 구현
  - package.json → 의존성 추가

Cursor 채팅 담당:
  - index.html → UI 컴포넌트 수정 (Ctrl+L로 코드 선택 후 채팅에 전달)

진행할까요?
```

---

## Phase 2 — Claude Code 작업 실행

Claude Code는 자신의 작업을 직접 실행합니다.

**파일 수정 시**: `/ide cursor`로 연결된 경우 변경사항이 Cursor 탭에 diff로 보입니다.

작업 완료 후 MCP 작업 추적기 업데이트 (선택):
```
create_task → start_task → complete_task
(parallel-coordinator MCP 서버가 연결된 경우)
```

---

## Phase 3 — Cursor 채팅 작업 안내

Claude Code 작업이 끝나면 Cursor 채팅용 지시를 제공:

```
Cursor 채팅창에서 다음을 진행하세요:

1. [파일명] 열기
2. 수정할 코드 선택 후 Ctrl+L (채팅에 추가)
3. 다음 지시 입력:

"[구체적인 수정 내용]"

완료 후 Claude Code 터미널로 돌아와서 '통합 확인해줘' 입력
```

---

## Phase 4 — 통합 및 검증

두 작업이 완료되면 통합 확인:

1. **API URL 일치 확인**: 프론트엔드가 백엔드 API 경로를 정확히 참조하는지
2. **타입/인터페이스 일치**: 데이터 구조가 양쪽에서 동일한지
3. **실행 테스트**: 서버 실행 후 실제 동작 확인

---

## 실전 워크플로 예시

### 예시 1: 풀스택 Todo 앱
```
사용자: "Todo 앱 병렬로 만들어줘"

Claude Code (터미널):
  → server.js: Express + JSON 저장 API 구현
  → /ide cursor로 Cursor에 파일 열어서 diff 표시

Cursor 채팅 (동시에):
  → "index.html에 React Todo UI 만들어줘"
  → Ctrl+L로 React 컴포넌트 빠르게 생성

Claude Code:
  → 두 파일 통합 확인
  → API URL(/api/todos) 일치 여부 검증
```

### 예시 2: 코드 리뷰 + 리팩터링
```
Claude Code (터미널):
  → /review로 전체 PR 자동 리뷰
  → Critical 버그 수정

Cursor 채팅 (동시에):
  → 특정 함수 선택 → Ctrl+L
  → "이 함수 성능 최적화해줘"
```

---

## Windows 환경 주의사항

- **Cursor PATH 설정**: Command Palette → "Install 'cursor' command in PATH" 최초 1회 필수
- **WSL 사용 시**: Claude Code와 Cursor 모두 Windows 쪽에 설치 권장 (WSL only면 /ide 연결 불안정)
- **우회 방법**: `/ide`가 안 되면 `claude --ide cursor`로 시작
- **PowerShell vs Git Bash**: Claude Code는 Git Bash(bash)에서 안정적
