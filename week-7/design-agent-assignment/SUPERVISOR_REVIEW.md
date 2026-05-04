# 감독자 검토서 - Design Agent Assignment

## 감독자 역할

감독자는 Codex 작업자가 만든 결과물을 직접 검토하고, 통과/수정/보류를 판단한다. 감독자는 새 기능을 추가하지 않고 기준에 맞는지 확인한다.

## 검토 대상

```text
student-output/DESIGN.md
student-output/index.html
student-output/ASSET_PROMPTS.md
student-output/WORK_LOG.md
```

## 1. 필수 산출물 확인

| 항목 | 상태 | 메모 |
|---|---|---|
| `DESIGN.md` 존재 | 미검토 |  |
| `index.html` 존재 | 미검토 |  |
| `ASSET_PROMPTS.md` 존재 | 미검토 |  |
| `WORK_LOG.md` 존재 | 미검토 |  |

## 2. DESIGN.md 검토

| 기준 | 통과 조건 | 상태 |
|---|---|---|
| Design intent | 한 문단으로 방향이 명확함 | 미검토 |
| Color tokens | 역할 기반 토큰 이름과 값이 있음 | 미검토 |
| Font rules | 한국어 폰트 우선순위가 있음 | 미검토 |
| Typography | 제목/본문/캡션 기준이 있음 | 미검토 |
| Components | 버튼, 카드, 섹션 등 규칙이 있음 | 미검토 |
| Dark mode | 어두운 배경/텍스트/테두리 기준이 있음 | 미검토 |
| Reuse prompt | 다른 AI에게 줄 프롬프트가 있음 | 미검토 |

## 3. index.html 검토

| 기준 | 통과 조건 | 상태 |
|---|---|---|
| 단일 실행 | 브라우저에서 직접 열림 | 미검토 |
| CSS token | `:root` 또는 동등한 CSS 변수 사용 | 미검토 |
| 한국어 UI | 주요 텍스트가 한국어 HTML 텍스트임 | 미검토 |
| 반응형 | 375px 모바일 폭에서 읽을 수 있음 | 미검토 |
| 컴포넌트 반복 | 버튼/카드/섹션 패턴이 반복됨 | 미검토 |
| 다크모드 | 토글 또는 `prefers-color-scheme` 대응 | 미검토 |
| AI-slop 방지 | 흔한 보라색 gradient/blob 남발 없음 | 미검토 |

## 4. 이미지 프롬프트 검토

| 기준 | 통과 조건 | 상태 |
|---|---|---|
| `gpt-image-2` 명시 | 사용할 이미지 모델이 명확함 | 미검토 |
| 텍스트 제외 | 이미지 안에 한국어 텍스트를 넣지 말라고 지시 | 미검토 |
| 용도 분리 | hero/poster/social 용도가 분리됨 | 미검토 |
| 디자인 토큰 반영 | 색상/무드가 DESIGN.md와 연결됨 | 미검토 |

## 5. 감독자 판정

```text
Decision: approve / revise / blocked

Findings:

Required fixes:

Next step:
```

## 6. 수정 지시 템플릿

```text
Codex, student-output 결과물을 수정해.
감독자 검토 결과:
1. [문제]
2. [문제]
3. [문제]

범위:
- DESIGN.md와 index.html만 수정
- 새 기능 추가 금지
- 기존 디자인 시스템 방향 유지
```

