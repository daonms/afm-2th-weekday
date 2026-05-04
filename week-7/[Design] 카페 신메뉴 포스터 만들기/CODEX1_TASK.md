# Codex 1 작업지시서 - [Design] 카페 신메뉴 포스터 만들기

## 역할

너는 구현 담당 `Codex 1`이다. 감독자는 별도로 검토한다.  
이 지시서의 범위 안에서만 작업하고, 완료 후 검토 가능한 산출물을 남긴다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 카페 신메뉴 포스터 만들기
```

## 과제 목표

카페에 신메뉴가 출시되었다고 가정하고, SNS 피드에서 사람들이 손가락을 멈추게 만드는 **신메뉴 포스터 한 장**을 만든다.

최종 결과물은 1080 x 1350 인스타 피드용 포스터 이미지여야 한다.

## 사용할 에이전트

먼저 아래 에이전트와 스킬을 읽고 작업한다.

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\AGENTS.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\01-design-brief\SKILL.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\03-design-system\SKILL.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\06-brand-media\SKILL.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\07-design-review\SKILL.md
```

## 필수 미션

### Part 1 - 신메뉴 정의

다음을 반드시 정리한다.

- 메뉴 이름
- 가격
- 한 줄 설명
- 사야 하는 이유 1가지

사야 하는 이유 예시:

- 시즌 한정
- 신상
- 베스트셀러 예상
- 하루 한정 수량
- 첫 출시 할인

### Part 2 - 후킹 포인트

다음을 반드시 정리한다.

- 5초 안에 시선을 잡을 메인 카피 1줄
- 메인 카피는 3-7단어
- 보조 정보 1줄

좋은 예시:

```text
여름엔, 자몽.
```

피해야 할 예시:

```text
맛있는 신메뉴 출시!
```

### Part 3 - 포스터 디자인

필수 조건:

- 사이즈: 1080 x 1350
- 신메뉴 사진 또는 일러스트가 포스터의 50% 이상 차지
- 빅 타이포그래피 사용
- 강조색 1개로 시선 유도
- 가격/행사기간은 작아도 명확하게 표시
- 모바일 인스타 피드에서 읽히는지 확인

### Part 4 - 게시 준비

실제 게시는 사용자가 한다.  
Codex 1은 게시용 파일과 제출 체크리스트만 준비한다.

## 생성할 파일

아래 파일을 생성하거나 갱신한다.

```text
DESIGN.md
CONCEPT.md
ASSET_PROMPTS.md
index.html
server.mjs
SUPERVISOR_REVIEW.md
WORK_RECORD.md
README.md
exports/new-menu-poster.png
exports/new-menu-poster.pdf
```

## 디자인 제약

- 컬러 팔레트는 3색 이내
- 폰트는 2개 이내
- 메인 비주얼은 포스터의 절반 이상
- 텍스트는 이미지 안에 박지 말고 HTML/CSS 또는 디자인 레이어로 배치
- `gpt-image-2`를 실제 사용할 수 없으면 `ASSET_PROMPTS.md`에 프롬프트만 작성
- 포스터 안의 한국어는 깨지거나 어색하게 줄바꿈되면 안 됨

## 권장 구현 방식

정적 HTML 기반으로 만든다.

```text
index.html
```

권장:

- CSS 변수로 디자인 토큰 정의
- 1080 x 1350 고정 캔버스
- CSS 일러스트 또는 이미지 asset 사용
- Playwright 또는 브라우저 캡처로 PNG/PDF 생성

금지:

- 외부 API 필수 의존
- 서버가 있어야만 포스터가 보이는 구조
- 포스터 이미지 없이 HTML만 제출
- 의미 없는 장식용 배경 남발
- 메인 카피가 작거나 눈에 안 띄는 구성

## 검증

작업 후 아래를 확인한다.

```bash
node server.mjs 4181
```

브라우저에서 확인:

```text
http://127.0.0.1:4181/
```

필수 확인:

- 포스터가 1080 x 1350 비율로 보이는가
- 신메뉴 비주얼이 50% 이상인가
- 메인 카피가 5초 안에 읽히는가
- 가격/기간이 명확한가
- PNG/PDF가 생성되었는가

## 감독자 검토 기준

`SUPERVISOR_REVIEW.md`에는 아래 형식으로 결과를 남긴다.

```text
Decision: approve / revise / blocked

Findings:
- ...

Required fixes:
- ...

Remaining submission items:
- GitHub 저장소 링크
- 포스터 이미지
- 게시 스크린샷
- 에이전트 대화 스크린샷
```

## 완료 보고 형식

작업 완료 후 아래 형식으로 보고한다.

```text
완료 파일:

디자인 요약:

검증 결과:

감독자 검토 필요 항목:

사용자가 직접 해야 할 제출 작업:
```

