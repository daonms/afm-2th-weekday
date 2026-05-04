# Codex 1 추가 작업지시서 - 실사 이미지 반영

## 배경

현재 `[Design] 카페 신메뉴 포스터 만들기` 산출물은 실사 이미지 중심이다.  
이번 요청에서는 **가상의 AI 셀럽이 시원하게 레몬티를 마시는 분위기**로 포스터를 다시 맞춘다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 카페 신메뉴 포스터 만들기
```

## 목표

`AI 셀럽 레몬티` 실사 이미지를 포스터의 메인 비주얼로 넣는다.

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
assets/ai-celebrity-lemon-tea-realistic.png
```

프롬프트:

```text
Photorealistic cafe poster hero image for a Korean new menu campaign.
Subject: a fictional adult Korean AI celebrity model gently sipping an iced lemon tea, with visible lemon slices, condensation, sparkling ice, and a refreshing summer mood.
Composition: vertical 4:5, model on the right side, generous negative space on the left for poster typography, premium editorial advertising framing.
Lighting: bright natural cafe window light, soft highlights, clean skin texture, crisp drink detail, luxurious but fresh.
Background: warm cream and pale lemon backdrop with subtle shadows, elegant and uncluttered.
Palette: vivid lemon yellow, warm cream, deep ink accents, a touch of mint.
Do not include any readable text, Korean letters, logos, price, menu name, watermark, or brand marks.
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

- 메인 카피 `시원하게, 레몬티.`를 사용한다.
- 메뉴명 `AI 셀럽 레몬티`와 가격 `6,800원`을 사용한다.
- 보조 정보 `7.1 - 7.31 · ICE ONLY · 매장 한정 30잔`을 사용한다.
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
