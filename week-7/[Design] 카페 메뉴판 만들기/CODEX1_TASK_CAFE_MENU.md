# Codex 1 작업지시서 - [Design] 카페 메뉴판 만들기

## 역할

너는 구현 담당 `Codex 1`이다. 감독자는 별도로 검토한다.  
이 지시서의 범위 안에서만 작업하고, 완료 후 검토 가능한 산출물을 남긴다.

중요: 이 과제는 **일반 카페 메뉴판 만들기**다.  
고메정식당 실제 메뉴판 작업과 혼동하지 말 것.

## 작업 위치

기준 폴더:

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 카페 메뉴판 만들기
```

기존 폴더에 다른 작업 파일이 섞여 있으므로, 이번 과제 산출물은 반드시 아래 하위 폴더에 새로 만든다.

```text
cafe-menu-output/
```

최종 구조:

```text
[Design] 카페 메뉴판 만들기/
├── CODEX1_TASK_CAFE_MENU.md
└── cafe-menu-output/
    ├── DESIGN.md
    ├── CONCEPT.md
    ├── ASSET_PROMPTS.md
    ├── index.html
    ├── server.mjs
    ├── README.md
    ├── WORK_RECORD.md
    ├── SUPERVISOR_REVIEW.md
    └── exports/
        ├── cafe-menu-board.png
        └── cafe-menu-board.pdf
```

## 사용할 에이전트/스킬

먼저 아래 파일을 읽고 작업한다.

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\AGENTS.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\01-design-brief\SKILL.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\02-visual-research\SKILL.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\03-design-system\SKILL.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\04-single-html\SKILL.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\07-design-review\SKILL.md
```

## 과제 목표

내가 카페 사장이라고 상상하고, 손님이 처음 봤을 때 **"여기 들어가고 싶다"** 싶은 **카페 메뉴판 한 장**을 디자인한다.

## 필수 미션

### Part 1 - 카페 컨셉 잡기

다음을 `CONCEPT.md`에 정리한다.

- 카페 이름
- 분위기
- 타겟 손님
- 컬러 팔레트 3색 이내
- 폰트 2개 이내

추천 방향 중 하나를 선택해서 진행해도 된다.

| 방향 | 설명 |
|---|---|
| 미니멀 로스터리 | 흰 여백, 검정 타이포, 원두/커피 강조 |
| 빈티지 다방 | 따뜻한 브라운, 레트로 타이포, 손글씨 느낌 |
| 코지 디저트 카페 | 크림/버터톤, 부드러운 카드, 디저트 강조 |

선택한 방향을 바탕으로 직접 카페 이름과 메뉴를 구성한다.

## Part 2 - 메뉴 구성

필수 조건:

- 카테고리 3개 이상
- 메뉴 8개 이상
- 모든 메뉴 가격 포함
- 시그니처 메뉴 1개 선정

권장 카테고리:

- Coffee
- Non-Coffee
- Dessert

가격 정렬은 반드시 오른쪽 정렬한다.

## Part 3 - 메뉴판 디자인

필수 조건:

- 사이즈: A4 세로 또는 1080 x 1350
- 시그니처 메뉴는 사진 또는 일러스트 + 강조색으로 시선 집중
- 카테고리 위계가 한눈에 보여야 함
- 컬러는 3색 이내
- 폰트는 2개 이내
- 모바일/이미지 미리보기에서도 읽혀야 함

권장 구현:

- `index.html` 단일 HTML
- CSS 변수로 디자인 토큰 정의
- 1080 x 1350 고정 캔버스
- CSS 일러스트 또는 이미지 asset 사용
- PNG/PDF export 생성

## Part 4 - 공유 준비

실제 공유는 사용자가 한다.  
Codex 1은 제출 가능한 파일과 체크리스트를 준비한다.

필수로 `README.md`에 아래를 남긴다.

- GitHub 제출용 파일 목록
- 메뉴판 PNG/PDF 위치
- 에이전트 대화 스크린샷 필요 안내
- 단톡방/인스타 공유 스크린샷 필요 안내

## 생성할 파일

반드시 아래 파일을 만든다.

```text
cafe-menu-output/DESIGN.md
cafe-menu-output/CONCEPT.md
cafe-menu-output/ASSET_PROMPTS.md
cafe-menu-output/index.html
cafe-menu-output/server.mjs
cafe-menu-output/README.md
cafe-menu-output/WORK_RECORD.md
cafe-menu-output/SUPERVISOR_REVIEW.md
cafe-menu-output/exports/cafe-menu-board.png
cafe-menu-output/exports/cafe-menu-board.pdf
```

## 이미지/일러스트 지침

- 시그니처 메뉴는 비주얼이 있어야 한다.
- 직접 사진을 쓰지 못하면 CSS/SVG 일러스트로 만든다.
- `gpt-image-2`를 실제 사용할 수 없으면 `ASSET_PROMPTS.md`에 프롬프트만 작성한다.
- 한국어 텍스트는 이미지 안에 넣지 말고 HTML/CSS 텍스트로 배치한다.

## 금지사항

- 고메정식당 실제 메뉴 사용 금지
- 이전 `고메정식당 카페` 작업 재사용 금지
- 커피/논커피/디저트가 아닌 식당 메뉴로 바꾸기 금지
- 메뉴 가격 누락 금지
- 시그니처 메뉴 강조 누락 금지
- 포스터처럼 메뉴가 1개만 있는 구성 금지

## 검증

작업 후 아래를 실행한다.

```bash
cd cafe-menu-output
node server.mjs 4182
```

브라우저 확인:

```text
http://127.0.0.1:4182/
```

필수 확인:

- 메뉴판이 1080 x 1350 또는 A4 세로 비율로 보이는가
- 카테고리 3개 이상인가
- 메뉴 8개 이상인가
- 가격이 모두 오른쪽 정렬인가
- 시그니처 메뉴가 강조되어 있는가
- PNG/PDF가 생성되었는가

## 감독자 검토 기준

`SUPERVISOR_REVIEW.md`에 아래 형식으로 결과를 남긴다.

```text
Decision: approve / revise / blocked

Findings:
- ...

Required fixes:
- ...

Remaining submission items:
- GitHub 저장소 링크
- 메뉴판 이미지
- 카페 컨셉 설명
- 에이전트 대화 스크린샷
- 단톡방/인스타 공유 스크린샷
```

## 완료 보고 형식

작업 완료 후 아래 형식으로 보고한다.

```text
완료 파일:

카페 컨셉 요약:

메뉴 구성 요약:

검증 결과:

감독자 검토 필요 항목:

사용자가 직접 해야 할 제출 작업:
```

