# Codex 1 추가 작업지시서 - 실사 이미지 반영

## 배경

현재 `[Design] 카페 신메뉴 포스터 만들기` 산출물은 CSS 일러스트 기반이다.  
사용자가 **실사 이미지가 필요하다**고 요청했다.

따라서 기존 포스터의 자몽/에이드 CSS 일러스트를 유지하거나 보조로 두되, 최종 포스터에는 **실사 스타일 신메뉴 이미지**가 반드시 포함되어야 한다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 카페 신메뉴 포스터 만들기
```

## 목표

`자몽 선셋 에이드` 실사 이미지를 포스터의 메인 비주얼로 넣는다.

필수 조건:

- 실사 이미지가 포스터 면적의 50% 이상을 차지해야 한다.
- 한국어 텍스트는 이미지 안에 넣지 않는다.
- 텍스트는 기존처럼 HTML/CSS로 배치한다.
- 포스터 최종 PNG/PDF를 다시 생성한다.

## 권장 방식

### 1안 - gpt-image-2로 실사 이미지 생성

가능하면 OpenAI `gpt-image-2`를 사용해 아래 이미지를 생성한다.

저장 위치:

```text
assets/grapefruit-sunset-ade-realistic.png
```

프롬프트:

```text
Photorealistic product photo for a Korean cafe new menu poster.
Subject: sparkling grapefruit ade in a tall clear glass, fresh grapefruit slices, ice cubes, visible carbonation bubbles, condensation on the glass, and a coral sunset-colored drink gradient.
Composition: vertical 4:5, product centered-right, drink and grapefruit should fill more than 60% of the frame.
Lighting: bright natural cafe window light, crisp highlights, appetizing, premium but fresh.
Background: warm cream paper backdrop with subtle shadows, clean negative space for Korean text overlay.
Palette: vivid grapefruit coral, warm cream, deep espresso-black accents.
Do not include any readable text, Korean letters, logo, price, menu name, watermark, hands, people, or brand marks.
```

### 2안 - 웹 실사 이미지 참고

gpt-image-2 사용이 불가능하면, 무료 사용 가능 이미지 또는 직접 확보 가능한 레퍼런스를 사용한다.

조건:

- 저작권/출처를 `SOURCE_NOTES.md`에 기록
- 최종 포스터에 사용한 파일은 `assets/`에 저장
- 출처 불명 이미지는 제출용 최종 이미지에 쓰지 말 것

## 수정할 파일

반드시 수정:

```text
index.html
DESIGN.md
ASSET_PROMPTS.md
WORK_RECORD.md
SUPERVISOR_REVIEW.md
README.md
```

필요 시 추가:

```text
SOURCE_NOTES.md
assets/grapefruit-sunset-ade-realistic.png
```

반드시 재생성:

```text
exports/new-menu-poster.png
exports/new-menu-poster.pdf
```

## index.html 수정 기준

- 기존 CSS 일러스트가 메인 비주얼이면 실사 이미지로 교체한다.
- 실사 이미지는 `<img>` 태그 또는 CSS `background-image`로 사용한다.
- 이미지에는 `alt="자몽 선셋 에이드 실사 이미지"`를 넣는다.
- 이미지가 로드되지 않을 때도 텍스트 정보는 읽혀야 한다.
- 텍스트와 이미지가 겹쳐서 읽기 어려우면 반투명 오버레이 또는 영역 분리를 적용한다.

## 디자인 기준

- 메인 카피 `여름엔, 자몽.`은 유지한다.
- 메뉴명 `자몽 선셋 에이드`와 가격 `6,500원`은 유지한다.
- 보조 정보 `5.4 - 5.31 · 하루 30잔 · 매장 한정`은 유지한다.
- 컬러 팔레트 3색 이내 원칙은 유지한다.
- 폰트 2개 이내 원칙은 유지한다.

## 감독자 검토 기준

`SUPERVISOR_REVIEW.md`에서 아래 항목을 반드시 점검한다.

```text
Decision: approve / revise / blocked

Realistic image check:
- 실사 이미지가 포함되었는가
- 실사 이미지가 포스터 50% 이상을 차지하는가
- 이미지 안에 한국어 텍스트/로고/가격이 없는가
- 이미지 출처 또는 생성 방식이 기록되었는가

Required fixes:
- ...
```

## 검증

로컬 서버:

```bash
node server.mjs 4181
```

확인 URL:

```text
http://127.0.0.1:4181/
```

필수 확인:

- HTTP 200
- 실사 이미지 파일 200
- PNG 크기 1080 x 1350
- PDF 생성됨
- 모바일 미리보기에서 메인 카피와 가격이 읽힘

## 완료 보고 형식

```text
완료 파일:

실사 이미지 생성/확보 방식:

이미지 출처 또는 생성 프롬프트:

검증 결과:

감독자 검토 필요 항목:
```

