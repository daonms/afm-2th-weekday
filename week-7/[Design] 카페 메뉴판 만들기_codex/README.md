# [Design] 카페 메뉴판 만들기 - LiLo Coffee Roasters 한국어 메뉴판

사용자가 제공한 `coffee.liloinveve.com` 사이트를 참고해 만든 한국어 카페 메뉴판입니다.

## 제출물

| 항목 | 파일 |
|---|---|
| 최종 메뉴판 HTML | `index.html` |
| 카페 컨셉 | `CONCEPT.md` |
| 디자인 설명 | `DESIGN.md` |
| 레퍼런스 기록 | `SOURCE_NOTES.md` |
| 이미지 생성 프롬프트 | `ASSET_PROMPTS.md` |
| 자체 점검 | `SUPERVISOR_REVIEW.md` |
| 작업 기록 | `WORK_RECORD.md` |
| 생성 이미지 | `assets/generated/lilo-specialty-coffee-hero.png` |
| PNG 출력 | `exports/menu-board.png` |
| PDF 출력 | `exports/menu-board.pdf` |

## 실행 방법

```bash
node server.mjs 4177
```

접속 URL:

```text
http://127.0.0.1:4177/
```

## 반영 내용

- 참고 카페: `LiLo Coffee Roasters`
- 언어: 한국어
- 메뉴 방향: 원두 향미, 계절 블렌드, 추출 방식, 드립백 선물
- 주요 키워드: V60, ORIGAMI, Siphon, Cold Brew, Monthly Beans
- 이미지는 GPT 이미지 생성으로 제작 후 프로젝트 폴더에 저장
- 가격은 수업 제출용 원화 가상 가격으로 구성
- Playwright로 PNG/PDF 출력 갱신
