# DESIGN.md - Grapefruit Sunset Poster (Realistic Image Version)

## Design Intent

기존 CSS 일러스트 중심 구성을 실사 이미지 중심으로 전환했다. 실사 비주얼이 포스터 전체 배경을 채우고, 한국어 카피/가격/기간 정보는 HTML/CSS 텍스트 레이어로 분리해 가독성을 확보한다.

## Fixed Menu Content

- 메뉴 이름: 자몽 선셋 에이드
- 가격: 6,500원
- 한 줄 설명: 생자몽 과즙과 탄산을 섞은 여름 한정 에이드
- 사야 하는 이유: 5월 한정 신메뉴, 하루 30잔 한정
- 메인 카피: 여름엔, 자몽.
- 보조 정보: 5.4 - 5.31 · 하루 30잔 · 매장 한정

## Tokens

- `sunset-coral`: `#FF4F3E`
- `cream`: `#FFF4DF`
- `deep-ink`: `#17130F`

폰트는 `Black Han Sans`, `Pretendard` 2개만 사용한다.

## Layout Rules

- Canvas: 1080 x 1350 (4:5)
- 실사 이미지는 배경 전면(포스터 면적 50% 이상) 사용
- 텍스트는 좌측 오버레이 영역에 배치
- 가격 배지는 우하단 원형 배지 유지

## Asset Rule

- 실사 이미지 파일: `assets/grapefruit-sunset-ade-realistic.png`
- 이미지 안에 한국어 텍스트/로고/가격을 포함하지 않는다.
- 출처/라이선스는 `SOURCE_NOTES.md`에 기록한다.
