# Codex 1 수정 작업지시서 - 애플스럽게 재디자인

## 역할

너는 구현 담당 `Codex 1`이다. 감독자는 별도로 검토한다.  
현재 명함은 과제 조건은 맞췄지만, 사용자가 **"디자인이 너무 구려. 애플스럽게"**라고 피드백했다.

이번 작업은 내용 구조는 유지하되, 디자인 톤앤매너를 Apple 스타일의 미니멀 프리미엄 명함으로 재디자인하는 것이다.

## 작업 위치

```text
D:\다온\DAON_AI - 문서\afm-2th-weekday\week-7\[Design] 내 명함 만들기\business-card-lee-heeseok
```

## 유지해야 할 과제 기준

- 90 x 54mm 명함
- 앞면 + 뒷면
- 정보 5가지 이내
- 강조 포인트 1개
- QR은 뒷면
- 앞/뒤 PNG 생성
- 90 x 54mm 2페이지 PDF 생성
- 한 줄 컨셉 설명 유지

## 유지할 정보

핵심 정보 5개:

1. 이름: `이희석`
2. 한 줄 정의: `현장을 아는 AI F&B 디렉터`
3. 이메일: `leepro@daonms.com`
4. 전화: `010-2838-0589`
5. 포트폴리오 링크 QR: 현재는 임시 GitHub

강조 포인트 1개:

```text
AI 접목형 F&B 성장 설계
```

## 디자인 목표

Apple스럽게 만든다.

키워드:

- 미니멀
- 넓은 여백
- 절제된 타이포그래피
- 선명한 위계
- 흑백 출력에도 강함
- 프리미엄 테크 감성
- 장식보다 정렬과 여백

피해야 할 것:

- 브론즈 장식 과다
- 빈티지/고깃집 느낌
- 과한 배경 그라데이션
- 장식 원형/패턴 남발
- 너무 많은 문장
- seal/영문 문구 여러 줄 남발
- 명함 안에 모든 걸 설명하려는 구성

## Apple 스타일 구체 지시

### 컬러

2-3색만 사용한다.

```text
Snow White: #F5F5F7
Graphite Black: #1D1D1F
System Blue: #0071E3
```

주의:

- 강조색은 `System Blue` 하나만 사용한다.
- 배경은 거의 흰색 또는 아주 옅은 실버.
- 텍스트는 거의 검정.
- 어두운 버전을 만들지 말고, 흰색 기반 프리미엄 명함으로 간다.

### 폰트

Apple 느낌을 위해 시스템 폰트 우선.

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
```

별도 장식 폰트 사용 금지.  
MaruBuri 제거 권장.

### 앞면 레이아웃

앞면은 아주 단순하게 만든다.

```text
이희석
현장을 아는 AI F&B 디렉터

AI 접목형 F&B 성장 설계

leepro@daonms.com
010-2838-0589
```

위계:

- 이름: 가장 큼
- 한 줄 정의: 이름 아래 작고 선명하게
- 강조 포인트: System Blue 색상 또는 얇은 blue underline/label
- 이메일/전화: 하단 작게

여백:

- 상하좌우 여백을 충분히 둔다.
- 정보 블록은 좌측 정렬 또는 중앙 정렬 중 하나만 선택한다.
- 요소 간 간격은 넉넉하게 한다.

### 뒷면 레이아웃

뒷면은 QR 중심.

```text
Scan for portfolio
[QR]
AI F&B Growth Design
```

QR은 정중앙 또는 오른쪽 중앙.  
QR 주변 여백을 충분히 준다.  
QR을 너무 작게 만들지 않는다.

### 디자인 디테일

사용 가능:

- 아주 얇은 1px 라인
- 작은 blue dot
- 미세한 카드 테두리
- 아주 옅은 실버 배경

금지:

- 복잡한 배경
- 큰 장식 원
- 여러 강조 박스
- 두꺼운 테두리
- 카드 안의 카드

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

반드시 재생성:

```text
front.png
back.png
overview.png
business-card-print-90x54mm.pdf
```

추가 또는 갱신:

```text
WORK_RECORD_APPLE_REVISION.md
```

## 검증

반드시 확인한다.

```text
front.png: 1050 x 630
back.png: 1050 x 630
business-card-print-90x54mm.pdf: 2 pages
PDF page size: 255.12 x 153.07 pt = 90 x 54 mm
```

시각 검토:

- 5초 안에 역할이 보이는가
- 정보가 5개 이내인가
- 강조가 1개인가
- Apple스럽게 넓은 여백과 절제된 톤인가
- 흑백 출력해도 읽히는가
- QR이 충분히 크고 명확한가

## 감독자 검토서 업데이트

`SUPERVISOR_REVIEW.md`의 Decision을 새 결과 기준으로 다시 작성한다.

검토 항목에 반드시 추가:

```text
Apple style check:
- 넓은 여백
- 시스템 폰트 느낌
- 2-3색 제한
- 강조색 1개
- 장식 최소화
- 프리미엄 테크 감성
```

## 완료 보고 형식

```text
완료 파일:

Apple style 수정 요약:

유지한 핵심 정보 5개:

검증 결과:

감독자 검토 결과:

사용자가 직접 해야 할 제출 작업:
```

