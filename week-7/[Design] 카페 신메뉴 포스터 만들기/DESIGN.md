# DESIGN.md - AI Celeb Lemon Tea Poster (Realistic Image Version)

## Design Intent

기존 자몽 콘셉트를 가상의 AI 셀럽 레몬티 콘셉트로 전환했다. 실사 비주얼이 포스터 전체 배경을 채우고, 한국어 카피/가격/기간 정보는 HTML/CSS 텍스트 레이어로 분리해 가독성을 확보한다.

## Fixed Menu Content

- 메뉴 이름: AI 셀럽 레몬티
- 가격: 6,800원
- 한 줄 설명: 가상의 AI 셀럽이 즐기는 청량한 수제 레몬티
- 사야 하는 이유: 7월 한정 신메뉴, 하루 30잔 한정
- 메인 카피: 시원하게, 레몬티.
- 보조 정보: 7.1 - 7.31 · ICE ONLY · 매장 한정 30잔

## Tokens

- `lemon`: `#FFD84D`
- `lemon-deep`: `#F3B81A`
- `cream`: `#FFF9E8`
- `ink`: `#18140F`

폰트는 `Black Han Sans`, `Pretendard` 2개만 사용한다.

## Layout Rules

- Canvas: 1080 x 1350 (4:5)
- 실사 이미지는 배경 전면(포스터 면적 50% 이상) 사용
- 텍스트는 좌측 오버레이 영역에 배치
- 가격 배지는 우하단 원형 배지 유지

## Asset Rule

- 실사 이미지 파일: `assets/ai-celebrity-lemon-tea-realistic.png`
- 이미지 안에 한국어 텍스트/로고/가격을 포함하지 않는다.
- 출처/라이선스는 `SOURCE_NOTES.md`에 기록한다.
