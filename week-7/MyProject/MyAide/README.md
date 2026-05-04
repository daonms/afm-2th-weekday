# MyAide Agent Studio — AFM Week 7 수업용

`MyAide Agent Studio`는 운영 서비스인 `myaide.daonms.com`과 다른 **수업용 버전**입니다.

이 버전의 목적은 완성된 개인비서 앱을 만드는 것이 아니라, 수업에서 배운 **에이전트와 스킬 라우팅**을 눈으로 이해하는 것입니다.

## 실행 방법

```bash
cd "D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\MyAide"
start index.html
```

브라우저에서 `index.html`을 직접 열면 됩니다. 서버나 API 키가 필요 없습니다.

## 학습 포인트

1. 한국어 작업 지시를 보고 적합한 에이전트를 고르는 방법
2. 에이전트가 어떤 스킬을 사용해야 하는지 연결하는 방법
3. 작업 지시서와 검토 체크리스트를 만드는 방법
4. 성향분석을 `진단`이 아니라 `전략 가설`로 다루는 방법
5. Notion AI 회의 녹음 결과를 다음 회의 전략으로 바꾸는 방법

## 사용한 수업 개념

| 수업 개념 | 앱에서 보이는 위치 |
|---|---|
| `기획자` 에이전트 | 작업 지시를 PRD와 범위로 정리 |
| `single-react-dev` | 단일 `index.html` 앱 구조 |
| `single-server-specialist` | 서버/API가 필요한 요청인지 판단 |
| `AI-개발자` | AI 분석/요약/프롬프트가 필요한 요청 처리 |
| `검토자` | 안전·품질 체크리스트 생성 |
| `harness-kr` | 한국어 요청을 에이전트로 라우팅하는 방식 |

## 추가 실습 모드

- `성향분석`: 선천 성향과 후천 성향을 나누고, 간단 분석/심층 분석/블라인드스팟 패널로 전략 가설을 만든다.
- `Notion 회의`: Notion AI Meeting Notes의 전사/요약/액션아이템을 붙여 넣고, 다음 회의 전략으로 전환한다.
- 수업용 버전은 실제 녹음 파일을 업로드하거나 외부 메시지를 전송하지 않는다.

## 디자인 시스템 실습 자료

수업에서 다룬 `Single HTML Agent -> Vite/React 디자인 시스템 -> Turborepo 재사용` 흐름은 공용 에이전트로 분리했다.

| 파일 | 역할 |
|---|---|
| `.claude/agents/수업용/design-agent.md` | Claude에서 호출하는 수업용 DESIGN agent |
| `.claude/agents/수업용/design-agent-kit/DESIGN.md` | AFM Classroom 디자인 시스템 원본 |
| `.claude/agents/수업용/design-agent-kit/skills/*/SKILL.md` | 단계별 디자인 스킬 |
| `.claude/agents/수업용/design-agent-kit/RECOMMENDED_SKILLS.md` | 프로젝트별 외부 디자인 스킬 추천 3안 |

디자인 작업에서는 `DESIGN.md`를 먼저 읽고, 프로젝트 단계에 맞는 skill을 선택한다. 이미지가 필요한 경우 OpenAI `gpt-image-2`는 배경/무드/포스터 시안에 사용하고, 한국어 텍스트는 HTML/CSS 또는 디자인 도구의 텍스트 레이어로 배치한다.

## 운영 버전과 다른 점

- 운영 버전: 개인·업무·관계 전략 코치 기능 중심
- 수업 버전: 에이전트/스킬 선택 과정 학습 중심
- 운영 버전: `https://myaide.daonms.com`
- 수업 버전: 이 폴더의 `index.html` 또는 `https://myaide.daonms.com/class/`

## 확장 아이디어

- 라우팅 결과를 Markdown 파일로 저장하기
- 실제 `.claude/agents` 폴더를 읽어서 에이전트 목록 자동 생성하기
- `server.js`를 추가해 실습 기록을 JSON 파일로 저장하기
