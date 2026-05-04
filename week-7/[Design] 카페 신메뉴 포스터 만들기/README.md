# [Design] 카페 신메뉴 포스터 만들기

`AI 셀럽 레몬티` 인스타 피드용 포스터(1080x1350) 산출물.

## 이번 수정 핵심

- 가상의 AI 셀럽이 레몬티를 마시는 실사 이미지 중심 포스터로 변경
- 메인 비주얼: `assets/ai-celebrity-lemon-tea-realistic.png`
- 한국어 텍스트는 모두 HTML/CSS 레이어로 유지

## 주요 파일

- `index.html`
- `DESIGN.md`
- `CONCEPT.md`
- `ASSET_PROMPTS.md`
- `SOURCE_NOTES.md`
- `SUPERVISOR_REVIEW.md`
- `exports/new-menu-poster.png`
- `exports/new-menu-poster.pdf`

## 실행

```bash
node server.mjs 4181
```

접속: `http://127.0.0.1:4181/`
