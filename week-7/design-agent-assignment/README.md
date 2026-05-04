# Week 7 Assignment - Design Agent Workflow

이 과제는 수업용 `design-agent`를 사용해 하나의 아이디어를 디자인 시스템으로 만들고, 단일 HTML 결과물까지 진행하는 실습이다.

## 목표

- 자연어 요청을 디자인 브리프로 바꾼다.
- `DESIGN.md`를 디자인 시스템의 정본으로 만든다.
- 디자인 시스템을 기준으로 단일 HTML 페이지를 만든다.
- 작업 결과를 감독자가 검토할 수 있게 기록한다.

## 사용 에이전트

```text
.claude/agents/수업용/design-agent.md
```

## 과제 산출물

| 파일 | 역할 |
|---|---|
| `LESSON_PLAN.md` | 수업계획서 |
| `CODEX_TASK.md` | Codex 작업지시서 |
| `SUPERVISOR_REVIEW.md` | 감독자 검토 기준 |
| `WORK_RECORD.md` | 진행 기록 |
| `student-output/` | Codex가 만들 최종 실습 산출물 폴더 |

## 진행 순서

1. 강사/감독자가 `LESSON_PLAN.md`로 수업 흐름을 설명한다.
2. Codex 작업자는 `CODEX_TASK.md`만 보고 작업한다.
3. 산출물은 `student-output/`에 만든다.
4. 감독자는 `SUPERVISOR_REVIEW.md` 기준으로 검토한다.

