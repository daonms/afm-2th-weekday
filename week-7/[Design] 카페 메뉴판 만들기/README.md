# [Design] 카페 메뉴판 만들기

과제 폴더명은 그대로 유지하지만, 최종 산출물은 `고메정식당 교대본점`의 네이버 지도 메뉴 화면을 참고해 만든 웹앱형 메뉴판이다.

## 제출물 체크

| 제출물 | 파일 |
|---|---|
| 웹앱 메뉴판 | `index.html` |
| 디자인 설명 | `DESIGN.md` |
| 컨셉 설명 | `CONCEPT.md` |
| 출처/가격 차이 기록 | `SOURCE_NOTES.md` |
| 참고 이미지 보관 | `assets/reference/` |
| 메뉴판 PNG | `exports/menu-board.png` |
| 메뉴판 PDF | `exports/menu-board.pdf` |
| 웹앱 PNG | `exports/menu-webapp.png` |
| 웹앱 PDF | `exports/menu-webapp.pdf` |
| 자체 점검 | `SUPERVISOR_REVIEW.md` |

## 실행 방법

```bash
node server.mjs 4177
```

접속 URL:

```text
http://127.0.0.1:4177/
```

## 반영 내용

- 고메정식당 교대본점 네이버 지도 place/1593583520 기준으로 복구
- 메뉴 검색, 카테고리 탭, 메뉴 담기, 주문 요약 기능 유지
- 카테고리: 전체, 한우, 돼지고기, 대표
- 네이버 교대본점 화면 기준 대표 메뉴/가격/이미지 반영
