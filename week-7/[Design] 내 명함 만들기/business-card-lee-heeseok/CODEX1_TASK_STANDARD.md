# Codex 1 표준 작업지시서 - [Design] 내 명함 만들기

## 역할

너는 구현 담당 `Codex 1`이다.  
상위 감독자는 `assignment-supervisor`이며, 너는 이 지시서의 범위 안에서만 작업한다.

이번 목표는 기존 명함 산출물을 **과제 기준에 맞고 Apple스럽게 보이는 최종 제출물**로 정리하는 것이다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 내 명함 만들기\business-card-lee-heeseok
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

너는 Codex 1 구현 담당이므로, 아래 순서대로 작업한다.

1. `design-agent`로 디자인 브리프와 `DESIGN.md`를 먼저 정리한다.
2. `single-react-dev.md` 기준으로 단일 HTML 구현 원칙을 적용한다.
3. 명함은 앞면/뒷면/overview가 필요하므로 HTML 파일은 기존 구조를 유지하되, 각 파일은 단일 HTML로 완결되게 만든다.
4. `design-agent`의 `07-design-review` 기준으로 자체 검토한다.
5. PNG/PDF export와 제출 문서는 이 작업지시서 기준으로 정리한다.

## 반드시 읽을 에이전트/스킬

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\assignment-supervisor.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\single-react-dev.md
D:\다온\DAON_AI - 문서\afm-2th-weekday\.claude\agents\수업용\design-agent-kit\skills\07-design-review\SKILL.md
```

## 과제 원문 핵심

처음 만난 사람이 5초 만에 **"이 사람 뭐 하는 사람이지?"**를 알 수 있는 **내 명함**을 디자인한다.

필수 조건:

- 직함 또는 태그라인 한 줄
- 가장 보여주고 싶은 포인트 1개
- 이름, 직함, 연락처, 링크 1-2개
- 정보는 5가지 이내
- 사이즈: 90 x 54mm
- 앞면 + 뒷면
- 뒷면은 QR / 슬로건 / 포트폴리오 링크 등
- 핵심 포인트 1개에만 강조 스타일
- PDF 또는 이미지 공유 가능해야 함

## 최종 디자인 방향

사용자 피드백:

```text
디자인이 너무 구려. 애플스럽게.
```

따라서 최종 톤은 Apple 스타일의 미니멀 프리미엄 명함이다.

키워드:

- 미니멀
- 넓은 여백
- 시스템 폰트
- 흰색/실버 기반
- 선명한 위계
- 강조색 1개
- 장식 최소화
- 흑백 출력 가능

## 유지할 핵심 정보 5개

반드시 아래 5개만 핵심 정보로 유지한다.

1. 이름: `이희석`
2. 한 줄 정의: `현장을 아는 AI F&B 디렉터`
3. 이메일: `leepro@daonms.com`
4. 전화: `010-2838-0589`
5. 포트폴리오 링크 QR: 현재는 임시 GitHub

핵심 강조 1개:

```text
AI 접목형 F&B 성장 설계
```

## 디자인 시스템

`DESIGN.md`를 새로 만들거나 갱신한다.

권장 토큰:

```text
Snow White: #F5F5F7
Graphite Black: #1D1D1F
System Blue: #0071E3
```

폰트:

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
```

금지:

- MaruBuri 같은 장식 폰트
- 브론즈 장식
- 어두운 고깃집/빈티지 느낌
- 복잡한 그라데이션
- 큰 장식 원형 패턴
- 여러 강조 박스
- 긴 경력 설명

## 앞면 요구사항

앞면은 5초 역할 인지를 최우선으로 한다.

구성:

```text
이희석
현장을 아는 AI F&B 디렉터

AI 접목형 F&B 성장 설계

leepro@daonms.com
010-2838-0589
```

위계:

- 이름이 가장 크다.
- 한 줄 정의가 바로 보인다.
- 강조는 `AI 접목형 F&B 성장 설계` 하나만 System Blue로 처리한다.
- 이메일/전화는 하단에 작고 명확하게 배치한다.

## 뒷면 요구사항

뒷면은 QR 중심이다.

구성:

```text
Scan for portfolio
[QR]
AI F&B Growth Design
```

요구:

- QR은 충분히 크게
- 주변 여백 넓게
- QR 목적을 README에 명확히 기록
- 현재 링크가 임시 GitHub라면 `QR_TARGET`으로 명시

## 수정/생성할 파일

반드시 수정 또는 생성:

```text
DESIGN.md
business-card-front.html
business-card-back.html
business-card-overview.html
README.md
HANDOFF.md
SUPERVISOR_REVIEW.md
WORK_RECORD_STANDARD.md
```

반드시 재생성:

```text
front.png
back.png
overview.png
business-card-print-90x54mm.pdf
```

유지:

```text
qr-github.png
agent-conversation.png
```

필요하면 QR 링크를 교체하되, 사용자가 최종 포트폴리오 URL을 주지 않았다면 임시 GitHub QR을 유지한다.

## 구현 지침

`single-react-dev.md`의 정신을 따른다.

- 각 HTML은 독립 실행 가능해야 한다.
- CDN 의존은 최소화한다.
- 외부 API 호출 금지
- 디자인 토큰은 CSS 변수로 선언한다.
- PNG/PDF export가 가능한 고정 크기 캔버스를 유지한다.

명함 크기:

- PNG: 1050 x 630
- 실제 인쇄: 90 x 54mm
- PDF: 2 pages, each 90 x 54mm

## 검증

반드시 확인한다.

```text
front.png: 1050 x 630
back.png: 1050 x 630
overview.png: 앞/뒤가 함께 보이는 제출용 미리보기
business-card-print-90x54mm.pdf: 2 pages
PDF page size: 255.12 x 153.07 pt = 90 x 54 mm
```

시각 검토:

- 5초 안에 역할이 보이는가
- 정보가 5가지 이내인가
- 강조가 1개인가
- Apple스럽게 넓은 여백과 절제된 톤인가
- System Blue 외 강조색을 남발하지 않는가
- 흑백 출력해도 읽히는가
- QR이 충분히 크고 명확한가

## 감독자 검토 기준

`SUPERVISOR_REVIEW.md`는 아래 형식으로 업데이트한다.

```text
# Supervisor Review - Business Card Assignment

## Decision
approve / revise / blocked

## Requirement Check
- 5초 안에 역할이 보이는가
- 정보가 5가지 이내인가
- 강조 포인트가 1개인가
- 앞면/뒷면이 모두 있는가
- QR이 뒷면에 있는가
- 90 x 54mm PDF가 생성되었는가
- 앞/뒤 PNG가 생성되었는가
- 한 줄 컨셉 설명이 README에 있는가

## Apple Style Check
- 넓은 여백
- 시스템 폰트 느낌
- 2-3색 제한
- System Blue 강조색 1개
- 장식 최소화
- 프리미엄 테크 감성

## Required Fixes
- ...

## Remaining Submission Items
- GitHub 저장소 링크
- 앞/뒤 명함 이미지
- 한 줄 컨셉 설명
- 에이전트 대화 스크린샷
- 단톡방 공유 캡처
```

## 완료 보고 형식

작업 완료 후 아래 형식으로 보고한다.

```text
완료 파일:

Apple style 수정 요약:

한 줄 컨셉:

유지한 핵심 정보 5개:

검증 결과:

감독자 검토 결과:

사용자가 직접 해야 할 제출 작업:
```

