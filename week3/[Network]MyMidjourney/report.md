# 나만의 Midjourney — 프로젝트 보고서

**과목**: Network + AI 융합 실습  
**프로젝트명**: 나만의 Midjourney (이미지 생성 서비스)  
**작성일**: 2026-04-06  
**기술 스택**: Node.js · React · Tailwind CSS · OpenAI API (DALL-E 3 / DALL-E 2)

---

## 1. 프로젝트 개요

OpenAI의 이미지 생성 AI(DALL-E)를 활용하여 **4가지 이미지 생성 모드**를 제공하는 웹 서비스.  
사용자가 스타일·옵션을 선택하고 텍스트를 입력하면, 백엔드 서버가 OpenAI API를 호출해 이미지를 생성하여 화면에 표시한다.

---

## 2. 시스템 구조

```
[브라우저 - React SPA]
        ↓ HTTP 요청 (fetch)
[Node.js 서버 - server.js :3001]
        ↓ HTTPS 요청
[OpenAI API]
  ├── DALL-E 3  →  /v1/images/generations  (텍스트 생성 · 로고 · PPT)
  └── DALL-E 2  →  /v1/images/variations   (이미지 변형)
                   /v1/images/edits         (이미지 편집)
```

### 파일 구조

```
week3/[Network]MyMidjourney/
├── server.js     ← Node.js 백엔드 서버 (307줄)
├── index.html    ← React + Tailwind 프론트엔드 (1,124줄)
├── .env          ← API 키 (git 제외)
└── report.md     ← 이 보고서
```

---

## 3. 핵심 기능

### 3-1. 텍스트로 생성 (DALL-E 3)

| 항목 | 내용 |
|------|------|
| API | `POST /v1/images/generations` (DALL-E 3) |
| 화풍 | 지브리 · 수채화 · 사이버펑크 · 유화 · 픽셀아트 · 애니메이션 · 연필스케치 · 실사 · 판타지 · 미니멀 (10종) |
| 크기 | 1024×1024 · 1792×1024 · 1024×1792 |
| 품질 | Standard / HD |
| 특징 | 선택한 화풍 프리셋을 자동으로 프롬프트 앞에 결합하여 전송 |

**프롬프트 결합 예시**
```
[화풍 프리셋] + [사용자 입력]
"지브리 스튜디오 애니메이션 화풍, 따뜻하고 몽환적인 배경," + "벚꽃 아래 걷는 소녀"
```

---

### 3-2. 이미지 업로드 변환 (DALL-E 2)

| 항목 | 내용 |
|------|------|
| API | `POST /v1/images/variations` / `/v1/images/edits` (DALL-E 2) |
| 변형 (Variation) | 업로드 이미지 → 유사 이미지 자동 생성 |
| 편집 (Edit) | 업로드 이미지 + 프롬프트 → 원하는 방향으로 변경 |
| 크기 | 256×256 · 512×512 · 1024×1024 |

**기술적 해결 포인트**  
DALL-E 2는 **정사각형 PNG(RGBA)** 만 허용한다는 제약이 있어, 프론트엔드에서 Canvas API로 자동 변환하는 전처리 로직을 구현했다.

```javascript
// Canvas로 정사각형 PNG 변환 (핵심 로직)
function toSquarePng(dataUrl, maxSize = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;       // 정사각형
  ctx.clearRect(0, 0, size, size);           // 투명(RGBA) 배경
  ctx.drawImage(img, sx, sy, img.width, img.height); // 중앙 정렬
  return canvas.toDataURL('image/png');
}
```

서버에서는 Node.js 기본 모듈만으로 **multipart/form-data**를 수동 구성하여 OpenAI에 전송한다.

```javascript
// 외부 라이브러리 없이 multipart 수동 빌드
const prefix = Buffer.from(headers, 'utf-8');
const body   = Buffer.concat([prefix, imageBuffer, suffix]);
```

---

### 3-3. 로고 디자인 (DALL-E 3)

| 항목 | 내용 |
|------|------|
| API | `POST /v1/images/generations` (DALL-E 3) |
| 로고 스타일 | 미니멀 · 뱃지 · 워드마크 · 레터마크 · 마스코트 · 추상형 · 빈티지 · 플랫 (8종) |
| 업종 | 테크 · 음식 · 패션 · 헬스 · 금융 · 교육 · 스포츠 · 뷰티 · 여행 · 펫 (10종) |
| 컬러 테마 | 흑백 · 블루 · 그린 · 레드 · 퍼플 · 오렌지 · 그라데이션 (7종) |
| 입력 | 브랜드 이름 (필수) + 슬로건 (선택) |

브랜드 이름·업종·스타일·컬러를 조합하여 로고 특화 프롬프트를 자동 생성한다.

---

### 3-4. PPT 디자인 (DALL-E 3)

| 항목 | 내용 |
|------|------|
| API | `POST /v1/images/generations` (DALL-E 3) |
| 슬라이드 타입 | 표지 · 목차 · 내용 · 섹션 · 데이터 · 마무리 (6종) |
| 디자인 테마 | 미니멀 · 비즈니스 · 크리에이티브 · 다크 · 테크 · 내추럴 · 볼드 · 엘레건트 (8종) |
| 레이아웃 | 중앙형 · 좌측형 · 분할형 · 대각선 (4종) |
| 컬러 팔레트 | 블루 · 그린 · 퍼플 · 레드 · 다크 · 골드 · 틸 · 그라데이션 (8종) |
| 비율 | 16:9 (1792×1024) / 1:1 (1024×1024) |
| 입력 | 발표 주제 (필수) + 부제목/발표자 (선택) |

생성된 이미지를 PowerPoint · Google Slides · Canva의 슬라이드 배경으로 활용할 수 있다.

---

## 4. 서버 API 엔드포인트

| Method | URL | 기능 | 모델 |
|--------|-----|------|------|
| `POST` | `/api/generate` | 텍스트 → 이미지 생성 | DALL-E 3 |
| `POST` | `/api/variation` | 이미지 변형 | DALL-E 2 |
| `POST` | `/api/edit` | 이미지 편집 (프롬프트 기반) | DALL-E 2 |
| `GET`  | `/`            | 프론트엔드 서빙 | — |

---

## 5. 네트워크 학습 포인트

### HTTP 통신 직접 구현
```javascript
// Node.js 내장 https 모듈로 외부 API 직접 호출
const req = https.request({
  hostname: 'api.openai.com',
  path: '/v1/images/generations',
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` }
}, callback);
```

### multipart/form-data 수동 구성
```
--boundary\r\n
Content-Disposition: form-data; name="image"; filename="image.png"\r\n
Content-Type: image/png\r\n\r\n
[Binary Buffer Data]
--boundary--
```

### CORS 처리
```javascript
// OPTIONS preflight 응답 처리
res.writeHead(204, {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
});
```

---

## 6. 트러블슈팅

| 문제 | 원인 | 해결 |
|------|------|------|
| `응답 파싱 실패` 오류 | catch에서 실제 오류 내용을 숨김 | 원본 응답 텍스트를 에러 메시지에 포함 |
| 이미지 업로드 API 오류 | DALL-E 2는 정사각형 PNG만 허용 | Canvas API로 업로드 전 자동 변환 |
| 서버 포트 충돌 | 기존 프로세스가 3001 점유 | `taskkill //PID` 로 프로세스 종료 후 재시작 |

---

## 7. 구현 통계

| 항목 | 수치 |
|------|------|
| 총 코드 | 1,431줄 (server.js 307 + index.html 1,124) |
| 생성 모드 | 4가지 (텍스트 · 이미지변환 · 로고 · PPT) |
| 화풍/스타일 옵션 | 총 50개 이상 |
| 사용 API 모델 | DALL-E 3, DALL-E 2 |
| 갤러리 저장 | 최대 20장 (세션 내 메모리) |
| 서버 의존성 | Node.js 내장 모듈만 사용 (외부 패키지 0개) |

---

## 8. 실행 방법

```bash
# 1. API 키 설정
echo "OPENAI_API_KEY=sk-..." > week3/[Network]MyMidjourney/.env

# 2. 서버 실행
node week3/[Network]MyMidjourney/server.js

# 3. 브라우저 접속
# http://localhost:3001
```
