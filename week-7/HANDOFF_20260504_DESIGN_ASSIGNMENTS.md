# Handoff - Week 7 Design Assignments

- date: `2026-05-04`
- branch: `main`
- coordinator: `Codex`
- scope: 수업용 디자인 과제 감독/지시서/일부 산출물 정리

## Agent Setup

Added classroom design workflow agents:

- `.claude/agents/수업용/assignment-supervisor.md`
- `.claude/agents/수업용/design-agent.md`
- `.claude/agents/수업용/design-agent-kit/`

Standard flow:

```text
assignment-supervisor
  -> design-agent
  -> single-react-dev
  -> design-agent review
  -> assignment-supervisor approve / revise / blocked
```

## Assignment Folders

### `[Design] 내 명함 만들기`

Path:

```text
week-7/[Design] 내 명함 만들기/business-card-lee-heeseok
```

Current state:

- Front side is preserved from the latest `경영에 멋을 담다.` version.
- Back side was rebuilt from the original DAON reference style.
- `business-card-print-90x54mm.pdf` regenerated as 2 pages, each 90 x 54mm.
- `front.png` was not modified during the final back-only pass.

Key files:

- `business-card-front.html`
- `business-card-back.html`
- `front.png`
- `back.png`
- `overview.png`
- `business-card-print-90x54mm.pdf`
- `SUPERVISOR_REVIEW.md`
- `WORK_RECORD_BACK_ONLY_FINAL.md`

Next:

- If final portfolio URL is provided, replace the temporary GitHub QR.
- If the exact original calligraphy image is provided as a file, replace the current front asset with that exact image.

### `[Design] 카페 신메뉴 포스터 만들기`

Path:

```text
week-7/[Design] 카페 신메뉴 포스터 만들기
```

Current state:

- Poster output exists for `자몽 선셋 에이드`.
- Additional task instruction exists for realistic product-image pass.
- Additional task instruction exists for a safe K-pop/Jungkook-inspired lemonade poster.

Key files:

- `CODEX1_TASK.md`
- `CODEX1_ADD_REALISTIC_IMAGE_TASK.md`
- `CODEX1_TASK_JUNGKOOK_LEMONADE_POSTER.md`
- `exports/new-menu-poster.png`
- `exports/new-menu-poster.pdf`

Next:

- For realistic image version, run `CODEX1_ADD_REALISTIC_IMAGE_TASK.md`.
- For Jungkook-themed version, avoid actual BTS/Jungkook likeness unless licensed source image is provided.

### `[Design] 카페 메뉴판 만들기`

Path:

```text
week-7/[Design] 카페 메뉴판 만들기
```

Current state:

- Existing folder includes earlier 고메정식당-related work.
- A separate general cafe menu task instruction was added to avoid mixing contexts.

Key files:

- `CODEX1_TASK_CAFE_MENU.md`
- `CODEX1_TASK_REAL_GOME_MENU.md`

Next:

- For the general cafe menu assignment, use `CODEX1_TASK_CAFE_MENU.md` and output under `cafe-menu-output/`.
- For real 고메정식당 menu version, use `CODEX1_TASK_REAL_GOME_MENU.md`.

### `design-agent-assignment`

Path:

```text
week-7/design-agent-assignment
```

Current state:

- Supervisor lesson plan and Codex task package created.
- This folder is for teaching the design-agent workflow itself.

## Guardrails

- Do not mix unrelated assignment outputs in the same folder. Use subfolders when needed.
- `single-react-dev.md` owns only `index.html`; README, work records, PNG/PDF export, and review docs are managed by the supervisor task.
- For real people/brands such as BTS/Jungkook, do not use unlicensed likeness, logo, official photos, or brand marks in final submit-ready images.

