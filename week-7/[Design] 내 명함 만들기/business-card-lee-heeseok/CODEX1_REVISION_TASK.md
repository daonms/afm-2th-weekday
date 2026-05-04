# Codex 1 수정 작업지시서 - 내 명함 과제 기준 재정렬

## 역할

너는 구현 담당 `Codex 1`이다. 감독자는 별도로 검토한다.  
현재 명함 산출물은 파일/PDF/QR 생성은 되어 있지만, 과제 핵심 기준과 일부 맞지 않는다. 아래 기준으로 재작업한다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 내 명함 만들기\business-card-lee-heeseok
```

## 현재 문제

현재 명함은 다음 점에서 과제 내용과 맞지 않는다.

1. 처음 만난 사람이 5초 만에 "이 사람 뭐 하는 사람이지?"를 알기 어렵다.
2. `COO`는 직함이지만, 외부인이 바로 이해할 수 있는 역할 설명이 부족하다.
3. 앞면에 정보가 많다.
4. 과제 조건인 **정보 5가지 이내** 기준이 흐려져 있다.
5. 강조가 `이름`, `COO`, 긴 설명, `AI 접목형 F&B 성장 설계`, seal 문구 등 여러 곳으로 분산된다.
6. 한 줄 컨셉 설명이 너무 길다.
7. 뒷면 QR의 목적이 `GitHub 저장소`로 되어 있는데, 명함 수신자에게 보여줄 포트폴리오/소개 링크인지 불명확하다.

## 과제 원문 기준

반드시 아래 기준을 맞춘다.

### Part 1 - 나를 한 단어로 정의

- 직함 또는 태그라인 한 줄
- 내가 가장 보여주고 싶은 포인트 1개

### Part 2 - 핵심 정보 정리

- 이름
- 직함
- 연락처
- 링크 1-2개
- 정보는 **5가지 이내**

### Part 3 - 명함 디자인

- 사이즈: 90 x 54mm
- 앞면 + 뒷면
- 뒷면은 QR / 슬로건 / 포트폴리오 링크 등
- 핵심 포인트 1개에만 강조 스타일

## 재작업 방향

### 한 줄 정의

`COO`보다 바로 이해되는 문장으로 바꾼다.

추천안 중 하나를 선택하라.

1. `AI로 F&B 성장을 설계하는 운영가`
2. `F&B 브랜드 성장 설계자`
3. `현장을 아는 AI F&B 디렉터`

감독자 추천:

```text
현장을 아는 AI F&B 디렉터
```

이 문장을 앞면의 가장 큰 메시지 또는 이름 바로 아래 태그라인으로 사용한다.

### 가장 보여주고 싶은 포인트 1개

강조 포인트는 하나만 남긴다.

```text
AI 접목형 F&B 성장 설계
```

이 문구만 강조색/크기/박스 중 하나로 강조한다.  
다른 요소에는 강조색을 남발하지 않는다.

## 정보 5가지 이내 규칙

앞면과 뒷면을 합쳐 제출자가 보여주는 핵심 정보는 아래 5개로 압축한다.

1. 이름: `이희석`
2. 한 줄 정의: `현장을 아는 AI F&B 디렉터`
3. 이메일: `leepro@daonms.com`
4. 전화: `010-2838-0589`
5. 포트폴리오/깃허브 링크 QR

주의:

- `COO`, `Chief Operating Officer`, `BRAND OPERATION`, `DATA x AI`, 긴 경력 설명은 삭제하거나 뒷면 작은 설명으로만 제한한다.
- 만약 `COO`를 꼭 넣고 싶다면 이름 옆 작은 보조 정보로만 둔다. 핵심 정의는 `AI F&B 디렉터`가 되어야 한다.

## 앞면 수정 기준

앞면 목적:

```text
5초 안에 이 사람은 "AI를 접목해 F&B 브랜드 성장을 설계하는 사람"이라고 이해되어야 한다.
```

앞면 구성:

- 이름 `이희석`
- 한 줄 정의 `현장을 아는 AI F&B 디렉터`
- 강조 포인트 `AI 접목형 F&B 성장 설계`
- 연락처는 이메일/전화만 작게

삭제 또는 축소:

- 긴 summary 문장
- `Chief Operating Officer`
- `BRAND OPERATION / DATA x AI` seal
- GitHub URL을 앞면에 길게 노출하는 것

## 뒷면 수정 기준

뒷면 목적:

```text
QR을 찍으면 이 사람의 작업/포트폴리오로 이동한다.
```

뒷면 구성:

- QR 코드
- 짧은 슬로건 1줄
- QR 목적을 설명하는 짧은 문구

권장 문구:

```text
Scan for portfolio
AI F&B Growth Design
```

QR 링크:

- 현재 GitHub 링크를 유지해도 되지만, README에 `임시 GitHub 링크`라고 명시한다.
- 사용자가 최종 포트폴리오 링크를 주면 교체할 수 있게 `QR_TARGET`을 문서화한다.

## 디자인 수정 기준

- 90 x 54mm 명함 비율 유지
- PNG는 1050 x 630 유지 가능
- PDF는 90 x 54mm 2페이지 유지
- 폰트 2개 이내 유지
- 컬러 2-3색 유지
- 강조색은 핵심 포인트 1개에만 사용
- 흑백 출력에서도 이름/정의/QR이 읽혀야 한다.

## 수정할 파일

반드시 수정:

```text
business-card-front.html
business-card-back.html
business-card-overview.html
README.md
HANDOFF.md
```

반드시 재생성:

```text
front.png
back.png
overview.png
business-card-print-90x54mm.pdf
```

필요 시 수정:

```text
qr-github.png
agent-conversation.png
```

새로 추가:

```text
SUPERVISOR_REVIEW.md
WORK_RECORD_REVISION.md
```

## 감독자 검토 기준

`SUPERVISOR_REVIEW.md`에 아래 기준으로 자체 점검 결과를 남긴다.

```text
Decision: approve / revise / blocked

Requirement check:
- 5초 안에 역할이 보이는가
- 정보가 5가지 이내인가
- 강조 포인트가 1개인가
- 앞면/뒷면이 모두 있는가
- QR이 뒷면에 있는가
- 90 x 54mm PDF가 생성되었는가
- 앞/뒤 PNG가 생성되었는가
- 한 줄 컨셉 설명이 README에 있는가

Required fixes:
- ...
```

## 검증

작업 후 반드시 확인한다.

```text
front.png: 1050 x 630
back.png: 1050 x 630
business-card-print-90x54mm.pdf: 2 pages, each 90 x 54mm
```

가능하면 PDF 페이지 크기도 확인한다.

```text
255.12 x 153.07 pt = 90 x 54 mm
```

## 완료 보고 형식

```text
완료 파일:

수정 요약:

한 줄 컨셉:

핵심 정보 5개:

검증 결과:

감독자 검토 필요 항목:

사용자가 직접 해야 할 제출 작업:
```

