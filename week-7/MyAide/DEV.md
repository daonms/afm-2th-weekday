# DEV.md — MyAide Agent Studio

## 구조

```text
MyAide/
├── index.html   # React CDN + Tailwind CDN 단일 앱
├── tests/       # 수업 기능 존재 확인 테스트
├── README.md    # 실행 방법과 학습 포인트
├── MISSION.md   # 수업용 목표
├── DEV.md       # 개발 메모
└── WORK_RECORD.md # 작업 기록
```

## 기술 스택

- React 18 CDN
- Tailwind CSS CDN
- Babel Standalone
- Lucide Icons CDN
- localStorage

## 주요 컴포넌트

| 컴포넌트 | 역할 |
|---|---|
| `App` | 전체 상태 관리 |
| `Panel` | 반복되는 카드 레이아웃 |
| `chooseRoute` | 작업 지시를 에이전트 순서로 변환 |
| `buildWorkOrder` | 실행 지시서 생성 |
| `buildChecklist` | 검토자 체크리스트 생성 |
| `buildPersonalityReport` | 선천/후천 성향을 전략 가설로 정리 |
| `buildNotionMeetingReport` | Notion 전사/요약을 다음 회의 전략으로 전환 |

## 테스트

```bash
node tests/class-feature.test.mjs
```

## 수업용 체크리스트

- [ ] 개인/업무/관계 프리셋이 전환된다.
- [ ] 성향분석 프리셋에서 간단 분석/심층 분석이 표시된다.
- [ ] Notion 회의 프리셋에서 전사 붙여넣기/다음 회의 전략이 표시된다.
- [ ] 작업 지시를 바꾸면 에이전트 라우팅이 바뀐다.
- [ ] 작업 지시서가 자동 생성된다.
- [ ] 검토 체크리스트가 생성된다.
- [ ] 저장 버튼을 누르면 최근 실습 기록에 남는다.
- [ ] 새로고침 후 기록이 유지된다.

## 다음 확장

1. `server.js` 추가 후 실습 기록 JSON 저장
2. 실제 `.claude/agents` 파일을 읽어 에이전트 목록 자동화
3. 작업 지시서를 Markdown 파일로 다운로드

## 디자인 Agent 구조

```text
.claude/agents/수업용/
├── design-agent.md
└── design-agent-kit/
    ├── AGENTS.md
    ├── DESIGN.md
    ├── RECOMMENDED_SKILLS.md
    └── skills/
        ├── 01-design-brief/
        ├── 02-visual-research/
        ├── 03-design-system/
        ├── 04-single-html/
        ├── 05-react-vite/
        ├── 06-brand-media/
        └── 07-design-review/
```

### 사용 순서

1. `.claude/agents/수업용/design-agent.md`를 에이전트로 호출한다.
2. `design-agent-kit/AGENTS.md`로 DESIGN agent 역할을 확인한다.
3. `design-agent-kit/DESIGN.md`를 디자인 시스템 원본으로 삼는다.
4. 프로젝트 단계에 맞는 `skills/*/SKILL.md`를 선택한다.
5. 외부 참고는 `RECOMMENDED_SKILLS.md`의 3안 중에서 고른다.
6. 결과물이 생기면 `07-design-review`로 다음 단계 이동 여부를 판단한다.
