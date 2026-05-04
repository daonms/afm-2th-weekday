# DESIGN.md - Premium Grapefruit Ade Poster

Design intent:
- gpt-image-2.0로 생성한 실사형 자몽에이드 컷을 중심으로 한 프리미엄 카페 신메뉴 포스터.
- 텍스트는 HTML/CSS 레이어로 분리하고, 메인 이미지는 제품 사진처럼 크게 배치한다.

System decisions:
- Palette: `#FFB36B` / `#F26C4F` / `#FFF8EF`
- Fonts: `Black Han Sans` + `Pretendard`
- Canvas: 1080 x 1350
- Main visual: 실사형 자몽에이드 이미지가 포스터 50% 이상
- Text layer: 모든 텍스트는 HTML/CSS 레이어 배치

Build target:
- single HTML poster app (`index.html`)

Review checklist:
- 메인 카피 5초 가독성
- 가격/기간 정보 명확성
- 외부 로고/실명/얼굴 복제 금지
