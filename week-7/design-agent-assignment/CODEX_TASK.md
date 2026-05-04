# Codex 작업지시서 - Design Agent Assignment

## 역할

당신은 구현 담당 Codex입니다. 감독자는 별도로 검토한다. 이 지시서의 범위 안에서만 작업한다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\design-agent-assignment
```

결과물은 반드시 아래 폴더에 만든다.

```text
student-output/
```

## 사용할 에이전트/스킬

먼저 다음 파일을 읽는다.

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\AGENTS.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\DESIGN.md
```

그 다음 작업 단계에 맞춰 아래 스킬을 적용한다.

```text
01-design-brief
03-design-system
04-single-html
07-design-review
```

## 과제 주제

기본 주제는 다음으로 한다.

```text
AI 독서모임 모집 페이지
```

디자인 방향:

- 한국어 UI
- 조용하지만 세련된 수업용 페이지
- 단일 HTML
- 디자인 시스템이 눈에 보여야 함
- 이미지가 필요하면 생성하지 말고 `gpt-image-2` 프롬프트만 작성

## 생성할 파일

```text
student-output/
├── DESIGN.md
├── index.html
├── ASSET_PROMPTS.md
└── WORK_LOG.md
```

## 세부 요구사항

### DESIGN.md

반드시 포함한다.

- Design intent
- Color tokens
- Font rules
- Typography scale
- Spacing/radius/shadow rules
- Components
- Image generation rules
- Dark mode rules
- Agent reuse prompt

### index.html

반드시 포함한다.

- CSS 변수로 디자인 토큰 정의
- Hero 영역
- 모집 정보 영역
- 프로그램/혜택 카드
- 신청 CTA 영역
- 모바일 반응형
- 다크모드 미디어쿼리 또는 토글 중 하나

허용:

- 순수 HTML/CSS/JS
- CDN 아이콘 또는 system font

금지:

- 빌드 도구 필요
- 외부 API 호출
- 한국어 텍스트를 이미지에 삽입
- 의미 없는 장식용 gradient blob

### ASSET_PROMPTS.md

OpenAI `gpt-image-2`용 프롬프트 3개를 작성한다.

- hero background
- poster visual
- social thumbnail

프롬프트는 한국어 텍스트를 이미지에 넣지 않도록 명시한다.

### WORK_LOG.md

작업 순서, 선택한 디자인 결정, 검토 결과를 간단히 기록한다.

## 검증 명령

작업 후 아래를 수행한다.

```bash
dir student-output
```

가능하면 브라우저에서 `student-output/index.html`을 열어 확인한다.

## 완료 보고 형식

```text
완료 파일:
검증:
디자인 시스템 요약:
감독자 검토 필요 항목:
```

