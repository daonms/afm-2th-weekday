# Codex 1 수정 작업지시서 - 앞면 유지, 뒷면만 변경

## 역할

너는 구현 담당 `Codex 1`이다. 감독자는 별도로 검토한다.

사용자 최신 지시:

```text
경영에 멋을 담다 캘리그라피 그대로 사용,
뒤면만 변경
```

따라서 이번 작업은 **앞면을 절대 다시 디자인하지 않고**, 뒷면만 과제 기준과 기존 DAON 명함 레퍼런스에 맞게 수정하는 것이다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 내 명함 만들기\business-card-lee-heeseok
```

## 절대 금지

아래 파일/요소는 변경하지 않는다.

```text
business-card-front.html
front.png
```

앞면의 핵심 요소는 그대로 유지한다.

```text
경영에 멋을 담다.
```

주의:

- 앞면 캘리그라피를 텍스트로 새로 만들거나 스타일을 바꾸지 않는다.
- 앞면 배경, 낙관, 여백, 슬로건 위치를 바꾸지 않는다.
- 앞면 이미지를 재생성하지 않는다.

## 수정 대상

뒷면만 수정한다.

반드시 수정:

```text
business-card-back.html
business-card-overview.html
README.md
HANDOFF.md
SUPERVISOR_REVIEW.md
```

반드시 재생성:

```text
back.png
overview.png
business-card-print-90x54mm.pdf
```

필요 시 유지/사용:

```text
front.png
qr-github.png
agent-conversation.png
```

새로 기록:

```text
WORK_RECORD_BACK_ONLY_REVISION.md
```

## 뒷면 디자인 목표

기존 DAON 명함 뒷면 레퍼런스를 살린다.

기준:

- 흰 배경
- 얇은 사각 테두리
- 왼쪽 큰 `DAON`
- `MANAGEMENT SOLUTION`
- 오른쪽 인적 정보
- QR은 뒷면에만 배치
- 전체적으로 넓은 여백과 정렬감

## 유지할 핵심 정보 5개

뒷면에는 아래 정보만 명확히 남긴다.

1. 이름: `이희석 / Lee Hee Seok`
2. 한 줄 정의: `현장을 아는 AI F&B 디렉터`
3. 전화: `010. 2838. 0589`
4. 이메일: `leepro@daonms.com`
5. 포트폴리오 QR: 현재는 임시 GitHub

삭제 또는 금지:

- 팩스 번호 `02. 6442. 1952`
- 긴 GitHub URL 텍스트
- COO / Chief Operating Officer
- 긴 경력 설명
- 여러 개의 강조 문구

## 뒷면 권장 레이아웃

```text
┌────────────────────────────────────┐
│                                    │
│   DAON                             │
│   MANAGEMENT SOLUTION              │
│                                    │
│                    이희석 Lee Hee Seok
│                    현장을 아는 AI F&B 디렉터
│                                    │
│                    M 010. 2838. 0589
│                    E leepro@daonms.com
│                    [QR] Portfolio  │
│                                    │
└────────────────────────────────────┘
```

대안:

- QR이 너무 작으면 오른쪽 하단 독립 영역으로 크게 둔다.
- QR은 최소 110px 이상 또는 인쇄 시 스캔 가능한 크기로 둔다.

## 강조 규칙

이번 뒷면은 과제 기준상 강조를 과하게 넣지 않는다.

- 강조 포인트는 `현장을 아는 AI F&B 디렉터` 또는 QR 안내 중 하나만 선택한다.
- 색상은 기존 DAON 레퍼런스에 맞춰 Black / White / DAON Red 안에서만 사용한다.
- 빨간색은 낙관/작은 포인트 수준으로만 사용한다.

## PDF 재생성 주의

PDF는 앞면과 뒷면 2페이지여야 한다.

- 1페이지: 기존 `front.png` 또는 기존 앞면 HTML 그대로 사용
- 2페이지: 새로 수정한 `back.png`

앞면은 기존 이미지 그대로 넣어야 한다.  
PDF 생성을 위해 앞면을 다시 렌더링해야 한다면, 스타일이 바뀌지 않았는지 반드시 확인한다.

## 검증

반드시 확인한다.

```text
front.png: 기존 유지, 1050 x 630
back.png: 새 뒷면, 1050 x 630
overview.png: 기존 앞면 + 새 뒷면 확인 가능
business-card-print-90x54mm.pdf: 2 pages
PDF page size: 255.12 x 153.07 pt = 90 x 54 mm
```

내용 검증:

- 앞면 `경영에 멋을 담다.` 캘리그라피가 그대로 유지되었는가
- 뒷면에 팩스 번호가 삭제되었는가
- 뒷면 정보가 5가지 이내인가
- QR이 뒷면에 명확히 있는가
- 기존 DAON 명함 느낌이 살아 있는가

## 감독자 검토서 업데이트

`SUPERVISOR_REVIEW.md`에 아래 항목을 추가 또는 갱신한다.

```text
Back-only revision check:
- 앞면 캘리그라피를 그대로 유지했는가
- 뒷면만 변경했는가
- 뒷면 정보가 5개 이내인가
- QR이 스캔 가능한 크기인가
- PDF 2페이지가 앞면 기존본 + 뒷면 수정본인가
```

## 완료 보고 형식

```text
완료 파일:

수정 범위:
- 앞면: 변경 없음
- 뒷면: [수정 요약]

유지한 앞면 요소:

뒷면 핵심 정보 5개:

삭제한 정보:

검증 결과:

감독자 검토 결과:

사용자가 직접 해야 할 제출 작업:
```

