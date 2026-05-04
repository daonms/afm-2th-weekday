# Codex 1 수정 작업지시서 - 기존 DAON 명함 레퍼런스 반영

## 역할

너는 구현 담당 `Codex 1`이다. 감독자는 별도로 검토한다.  
사용자가 기존 명함 이미지를 제공했다. 이번 작업은 기존 명함의 브랜드 톤을 살리면서, 수업 과제 기준에 맞게 앞/뒤 명함을 다시 정리하는 것이다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 내 명함 만들기\business-card-lee-heeseok
```

## 기준 레퍼런스

사용자가 제공한 기존 명함 이미지의 특징:

### 앞면 느낌

- 짙은 블랙/네이비 계열 배경
- 중앙에 붓글씨 슬로건:

```text
경영에 멋을 담다.
```

- 오른쪽에 빨간 `DAON` 낙관/스탬프
- 장식은 거의 없고 여백이 큼
- 고급스럽고 한국적인 컨설팅/브랜드 느낌

### 뒷면 느낌

- 흰 배경
- 왼쪽에 큰 `DAON` 로고
- 아래에 `MANAGEMENT SOLUTION`
- 오른쪽에 이름:

```text
이희석 Lee Hee Seok
```

- 연락처:

```text
M 010. 2838. 0589
F 02. 6442. 1952
E leepro@daonms.com
```

- 얇은 사각 테두리
- 전체적으로 여백이 넓고 정돈되어 있음

## 핵심 판단

이전 `Apple style` 지시는 완전한 Apple식 백색 미니멀을 목표로 했지만, 사용자가 제공한 기존 명함은 이미 강한 브랜드 정체성을 갖고 있다.

따라서 최종 방향은:

```text
DAON 기존 명함의 고급 여백과 흑백 구조를 살리되,
수업 과제 기준인 5초 역할 인지, 정보 5가지 이내, 강조 1개, QR 뒷면을 반영한다.
```

Apple스럽게 하라는 피드백은 `장식 과다 제거`, `여백`, `정렬`, `절제`로 해석한다.  
DAON 브랜드를 버리고 완전 다른 Apple 카드로 만들지 않는다.

## 유지할 과제 기준

- 90 x 54mm
- 앞면 + 뒷면
- 정보 5가지 이내
- 5초 안에 뭐 하는 사람인지 보여야 함
- 강조 포인트는 1개만
- 뒷면에 QR 또는 포트폴리오 링크
- 앞/뒤 PNG와 2페이지 PDF 생성

## 유지할 핵심 정보 5개

1. 이름: `이희석 / Lee Hee Seok`
2. 한 줄 정의: `현장을 아는 AI F&B 디렉터`
3. 전화: `010. 2838. 0589`
4. 이메일: `leepro@daonms.com`
5. 포트폴리오 QR: 현재는 임시 GitHub

주의:

- 팩스 번호 `02. 6442. 1952`는 과제 기준상 정보 5개 제한을 넘기므로 삭제한다.
- `COO`, `Chief Operating Officer`는 꼭 필요하면 아주 작게 보조 정보로만 쓰거나 삭제한다.
- GitHub URL을 텍스트로 길게 노출하지 말고 QR로 연결한다.

## 강조 포인트 1개

아래 문구 하나만 강조한다.

```text
AI 접목형 F&B 성장 설계
```

강조 방식:

- 빨간 DAON 낙관 색 또는 아주 절제된 포인트 컬러
- 강조는 한 곳에만 적용
- 이름, 로고, 슬로건, 연락처 모두 동시에 강조하지 말 것

## 디자인 방향

기존 명함을 기반으로 다음처럼 재구성한다.

### 앞면

기존 앞면의 어두운 배경과 붓글씨 슬로건을 살린다.

권장 구성:

```text
[중앙] 경영에 멋을 담다.
[작게] 현장을 아는 AI F&B 디렉터
[작은 포인트] DAON 빨간 낙관
```

또는:

```text
경영에 멋을 담다.
AI 접목형 F&B 성장 설계
```

주의:

- 앞면에 연락처를 넣지 않는다.
- 앞면은 브랜드/철학/역할 인지에 집중한다.
- 붓글씨는 이미지 asset이 있으면 사용하고, 없으면 비슷한 한글 캘리그래피 느낌의 텍스트로 대체한다.
- 실제 기존 명함 이미지를 asset으로 쓸 수 있으면 `assets/reference/existing-card.png`에 저장하고 `SOURCE_NOTES.md`에 기록한다.

### 뒷면

기존 뒷면의 흰 배경과 큰 DAON 로고 구조를 살린다.

권장 구성:

```text
[왼쪽] DAON
        MANAGEMENT SOLUTION

[오른쪽] 이희석 Lee Hee Seok
        현장을 아는 AI F&B 디렉터
        M 010. 2838. 0589
        E leepro@daonms.com
        [QR]
```

QR은 오른쪽 하단 또는 중앙 하단에 배치한다.  
QR 목적은 `Portfolio / Work`로 명확히 적는다.

## 컬러

기존 명함 기준:

```text
DAON Black: #061418 또는 #071519
Paper White: #FFFFFF
DAON Red: #E30613
Ink Black: #111111
```

3색 이내 원칙을 지키려면:

- Black
- White
- DAON Red

만 사용한다.

## 폰트

- DAON 로고는 가능하면 기존 이미지/텍스트 스타일을 유지
- 본문은 시스템 산세리프 또는 Pretendard
- 붓글씨 슬로건은 기존 이미지 asset이 있으면 이미지 사용, 없으면 텍스트 대체
- 폰트는 2개 이내

## 수정할 파일

반드시 수정:

```text
business-card-front.html
business-card-back.html
business-card-overview.html
README.md
HANDOFF.md
SUPERVISOR_REVIEW.md
```

반드시 생성 또는 갱신:

```text
DESIGN.md
SOURCE_NOTES.md
WORK_RECORD_EXISTING_CARD_REFERENCE.md
```

반드시 재생성:

```text
front.png
back.png
overview.png
business-card-print-90x54mm.pdf
```

유지 또는 필요 시 교체:

```text
qr-github.png
agent-conversation.png
```

## 검증

반드시 확인한다.

```text
front.png: 1050 x 630
back.png: 1050 x 630
overview.png: 앞/뒤 확인 가능
business-card-print-90x54mm.pdf: 2 pages
PDF page size: 255.12 x 153.07 pt = 90 x 54 mm
```

시각 검토:

- 기존 DAON 명함 느낌이 살아 있는가
- 5초 안에 `AI F&B 디렉터` 역할이 보이는가
- 정보가 5개 이내인가
- 강조가 1개인가
- QR이 뒷면에 명확히 있는가
- 흑백 출력해도 읽히는가
- 너무 과하게 Apple스럽게 바뀌어 DAON 정체성이 사라지지 않았는가

## 감독자 검토 기준

`SUPERVISOR_REVIEW.md`에 아래 항목을 추가한다.

```text
Existing DAON reference check:
- 어두운 앞면 + 흰 뒷면 구조를 반영했는가
- 붓글씨 슬로건 또는 그 정신을 살렸는가
- DAON 로고/낙관 느낌을 살렸는가
- 정보 5개 이내로 압축했는가
- 과제 기준과 기존 브랜드가 충돌하지 않는가
```

## 완료 보고 형식

```text
완료 파일:

기존 명함 반영 요약:

유지한 핵심 정보 5개:

삭제한 정보:

검증 결과:

감독자 검토 결과:

사용자가 직접 해야 할 제출 작업:
```

