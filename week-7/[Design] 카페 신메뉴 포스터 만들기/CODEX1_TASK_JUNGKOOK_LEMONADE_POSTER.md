# Codex 1 작업지시서 - 정국 무드 레몬에이드 포스터

## 역할

너는 구현 담당 `Codex 1`이다.  
상위 감독자는 `assignment-supervisor`이며, 너는 이 지시서의 범위 안에서만 작업한다.

이번 작업은 카페 신메뉴 포스터 과제의 변형안이다.  
주제는 **BTS 정국이 레몬에이드를 마시는 듯한 신메뉴 포스터**지만, 실제 제출/공유 가능성을 고려해 초상권과 상표권을 안전하게 처리한다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 카페 신메뉴 포스터 만들기
```

기존 자몽 포스터와 섞지 않기 위해 새 하위 폴더를 만든다.

```text
jungkook-lemonade-output/
```

## 표준 에이전트 흐름

반드시 아래 흐름을 따른다.

```text
assignment-supervisor
  ↓
design-agent
  ↓
single-react-dev
  ↓
design-agent review
  ↓
assignment-supervisor approve / revise / blocked
```

## 반드시 읽을 에이전트/스킬

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\assignment-supervisor.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\single-react-dev.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\06-brand-media\SKILL.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\07-design-review\SKILL.md
```

## 중요 권리/표현 기준

`BTS`, `정국`, 실제 얼굴/사진/로고/앨범 이미지/공식 굿즈 이미지는 권리 이슈가 있다.

따라서 기본 산출물은 아래처럼 만든다.

- 실제 정국 사진 사용 금지
- BTS 로고/공식 이미지 사용 금지
- 실제 얼굴을 그대로 복제한 생성 이미지 사용 금지
- 기본 표현은 `정국에게서 영감 받은 K-pop 보컬 무드의 남성 모델 실루엣/후면/측면`으로 처리
- 제출 문서에는 `비공식 팬메이드 콘셉트 / 실제 광고 아님`을 명시

예외:

- 사용자가 사용 허가된 정국 이미지 또는 직접 사용할 수 있는 라이선스 이미지를 제공하면 `assets/source/`에 저장하고 `SOURCE_NOTES.md`에 출처/권한을 기록한 뒤 사용 가능

## 과제 목표

SNS 피드에서 멈춰 보이게 하는 카페 신메뉴 포스터를 만든다.

신메뉴:

```text
골든 레몬에이드
```

가격:

```text
6,900원
```

한 줄 설명:

```text
레몬청과 탄산, 꿀 시럽을 더한 청량한 여름 한정 에이드
```

사야 하는 이유:

```text
여름 한정 / 하루 50잔
```

메인 카피:

```text
마시는 순간, 골든.
```

보조 정보:

```text
6.1 - 6.30 · 6,900원 · 하루 50잔
```

## 디자인 방향

키워드:

- K-pop stage light
- golden hour
- fresh lemon
- premium cafe
- clean fan poster
- mobile-first impact

컬러는 3색 이내:

```text
Lemon Gold: #FFD84D
Black: #111111
Cream White: #FFF8E8
```

폰트는 2개 이내:

```text
Display: Black Han Sans 또는 Pretendard ExtraBold
Body: Pretendard
```

## 비주얼 요구사항

- 사이즈: 1080 x 1350
- 레몬에이드 실사 또는 실사풍 이미지가 포스터 50% 이상
- 인물은 실제 정국 복제가 아니라 `K-pop 보컬 무드의 남성 모델` 정도로 표현
- 얼굴이 정면으로 뚜렷하게 보이지 않는 구도 권장
  - 측면
  - 손과 컵 클로즈업
  - 후면 실루엣
  - 무대 조명 속 음료 클로즈업
- 텍스트는 이미지 안에 넣지 말고 HTML/CSS로 배치
- 메인 카피는 5초 안에 읽히게 크게

## 이미지 생성 지침

가능하면 `gpt-image-2`로 실사풍 이미지를 생성한다.  
이미지 안에 한국어 텍스트를 넣지 않는다.

저장 위치:

```text
jungkook-lemonade-output/assets/golden-lemonade-kpop-realistic.png
```

프롬프트:

```text
Photorealistic vertical poster visual for a Korean cafe new menu.
Subject: a stylish young K-pop male vocalist inspired mood, not a real celebrity likeness, drinking a sparkling golden lemonade through a straw.
Composition: close-up side profile or partial face, focus on the lemonade glass, lemon slices, condensation, ice cubes, and stage-like golden light.
Mood: premium, fresh, summer, K-pop stage lighting, golden hour, clean cafe advertising.
Palette: lemon gold #FFD84D, black #111111, cream white #FFF8E8.
The drink and lemon visual should fill more than 60% of the frame.
Do not include readable text, Korean letters, BTS logo, Jungkook name, celebrity face match, watermark, brand marks, or album references.
Aspect ratio: 4:5.
```

대체안:

- 이미지 생성이 불가능하면 CSS/SVG 일러스트 + 실사풍 asset prompt만 작성
- 이 경우 `SUPERVISOR_REVIEW.md` Decision은 `revise` 또는 `blocked`로 두고, 실사 이미지 필요 항목을 남긴다.

## 생성할 파일

```text
jungkook-lemonade-output/DESIGN.md
jungkook-lemonade-output/CONCEPT.md
jungkook-lemonade-output/ASSET_PROMPTS.md
jungkook-lemonade-output/SOURCE_NOTES.md
jungkook-lemonade-output/index.html
jungkook-lemonade-output/server.mjs
jungkook-lemonade-output/README.md
jungkook-lemonade-output/WORK_RECORD.md
jungkook-lemonade-output/SUPERVISOR_REVIEW.md
jungkook-lemonade-output/exports/jungkook-lemonade-poster.png
jungkook-lemonade-output/exports/jungkook-lemonade-poster.pdf
```

## 구현 지침

`single-react-dev.md` 기준으로 단일 `index.html`을 만든다.

- React CDN + Tailwind CDN 사용 가능
- 또는 순수 HTML/CSS 가능
- 고정 캔버스 1080 x 1350
- CSS 변수로 디자인 토큰 정의
- 인물/음료 이미지는 포스터의 메인 비주얼
- 텍스트는 HTML/CSS로 배치
- PNG/PDF export 가능해야 함

## 검증

로컬 실행:

```bash
cd jungkook-lemonade-output
node server.mjs 4183
```

확인 URL:

```text
http://127.0.0.1:4183/
```

필수 확인:

- HTTP 200
- PNG 크기 1080 x 1350
- PDF 생성
- 비주얼이 50% 이상
- 메인 카피가 모바일에서 즉시 읽힘
- BTS/정국 실명 또는 로고가 포스터 이미지 안에 들어가지 않음
- `SOURCE_NOTES.md`에 이미지 생성/출처 기록

## 감독자 검토 기준

`SUPERVISOR_REVIEW.md`에 아래를 기록한다.

```text
Decision: approve / revise / blocked

Requirement Check:
- 신메뉴 이름/가격/설명/사야 하는 이유가 있는가
- 메인 카피 3-7단어인가
- 1080 x 1350인가
- 신메뉴 비주얼이 50% 이상인가
- PNG/PDF가 생성되었는가

Rights/Safety Check:
- 실제 정국 사진/얼굴 복제/로고를 쓰지 않았는가
- 비공식 팬메이드 콘셉트임을 기록했는가
- 이미지 생성 또는 출처를 기록했는가

Required fixes:
- ...
```

## 완료 보고 형식

```text
완료 파일:

디자인 요약:

이미지 생성/확보 방식:

권리/출처 처리:

검증 결과:

감독자 검토 결과:

사용자가 직접 해야 할 제출 작업:
```

