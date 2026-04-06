# 나만의 Midjourney — 오늘 작업 타임테이블 (상세)

**작업일**: 2026-04-06  
**프로젝트 경로**: `week3/[Network]MyMidjourney/`  
**미션**: Network + AI 조합 → 나만의 이미지 생성 서비스

---

## STEP 1 — 프로젝트 폴더 생성

```bash
mkdir week3/[Network]MyMidjourney
```

- 기존 `[Network]MyChatGPT` 프로젝트 구조를 참고해서 시작
- 동일한 Node.js 기반 서버 패턴 재사용

---

## STEP 2 — Node.js 서버 구축 (`server.js`)

**핵심 역할**: 브라우저와 OpenAI API 사이의 **중간 서버(Proxy)**

```
브라우저 → [server.js :3001] → OpenAI API
```

> 브라우저에서 OpenAI API를 직접 호출하면 API 키가 노출되므로,  
> 반드시 서버를 통해 호출해야 한다.

**구현 내용**

| 항목 | 내용 |
|------|------|
| 포트 | 3001 |
| API 엔드포인트 | `POST /api/generate` |
| 이미지 모델 | DALL-E 3 (`dall-e-3`) |
| 응답 형식 | URL (이미지 링크 반환) |
| 환경변수 | `.env` 파일에서 `OPENAI_API_KEY` 로드 |
| 정적 파일 | `index.html` 서빙 포함 |

```javascript
// 핵심 구조
POST /api/generate
  → OpenAI /v1/images/generations 호출
  → { url: "https://..." } 반환
```

---

## STEP 3 — React 프론트엔드 제작 (`index.html`)

**단일 HTML 파일**에 React + Tailwind CSS를 CDN으로 불러와서 완성형 UI 구현

**구현 내용**

### 화풍 10종 프리셋

| 화풍 | 특징 |
|------|------|
| 지브리 | 따뜻하고 몽환적인 애니메이션 |
| 수채화 | 부드러운 번짐 효과 |
| 사이버펑크 | 네온사인, 미래 도시 |
| 유화 | 고전 회화 붓터치 질감 |
| 픽셀 아트 | 레트로 8비트 게임 |
| 애니메이션 | 선명한 일본 애니 스타일 |
| 연필 스케치 | 흑백 드로잉 |
| 실사 | 8K 초현실적 |
| 판타지 | 마법적 일러스트 |
| 미니멀 | 깔끔한 모던 아트 |

### 선택 항목
- **이미지 크기**: 정사각형(1024×1024) · 가로형(1792×1024) · 세로형(1024×1792)
- **품질**: Standard(빠름) · HD(고품질)
- **갤러리**: 최근 생성 이미지 최대 20장 저장, 클릭 시 모달 확대
- **다운로드**: 생성 이미지 바로 저장

### 프롬프트 자동 결합 방식
```
[화풍 프리셋 텍스트] + [사용자 입력]

예시:
"지브리 스튜디오 애니메이션 화풍, 따뜻하고 몽환적인 배경,"
+ "벚꽃 아래 걷는 소녀"
```

---

## STEP 4 — 서버 실행 확인

```bash
node server.js
→ http://localhost:3001 접속 확인
```

- `.env` 없이 실행 시 `API 키 미설정` 경고 출력
- 서버 정상 시 `200 OK` 응답 확인

---

## STEP 5 — 이미지 업로드 기능 추가

**새로운 기능**: 직접 만든 이미지를 AI로 변환

### 두 가지 모드 추가

| 모드 | 설명 | API |
|------|------|-----|
| **변형 (Variation)** | 업로드한 이미지와 비슷한 새 이미지 생성 | `POST /v1/images/variations` |
| **편집 (Edit)** | 이미지 + 프롬프트로 원하는 방향 변경 | `POST /v1/images/edits` |

### 서버 기술 포인트 — multipart/form-data 수동 구성

OpenAI 이미지 API는 파일을 `multipart/form-data` 형식으로 받는다.  
외부 라이브러리(multer, form-data 등) 없이 **Node.js 내장 모듈만으로** 직접 구성했다.

```javascript
// 바이너리 직접 조립
const boundary = '----FormBoundary' + Date.now();
const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; ...`),
  imageBuffer,   // 실제 이미지 바이너리
  Buffer.from(`\r\n--${boundary}--\r\n`)
]);
```

### 프론트 기술 포인트 — 드래그&드롭 업로드
```javascript
// 드래그해서 놓기
onDrop={e => handleFile(e.dataTransfer.files[0])}

// 클릭해서 파일 선택
onClick={() => inputRef.current?.click()}
```

---

## STEP 6 — 오류 수정 (중요 트러블슈팅)

**문제**: 이미지 업로드 후 `응답 파싱 실패` 오류 발생

**원인 파악**: catch 블록에서 실제 오류 내용을 숨기고 있었음
```javascript
// 수정 전 — 내용을 알 수 없음
catch { reject(new Error('응답 파싱 실패')); }

// 수정 후 — 실제 API 응답 노출
catch { reject(new Error(`OpenAI 응답 오류 (${res.statusCode}): ${data.slice(0, 300)}`)); }
```

**진짜 원인**: DALL-E 2는 **정사각형 PNG(RGBA)** 만 허용

| 조건 | DALL-E 3 | DALL-E 2 |
|------|----------|----------|
| 파일 형식 | 무관 (텍스트 생성) | PNG 필수 |
| 이미지 비율 | — | 정사각형 필수 |
| 알파 채널 | — | RGBA 필수 |

**해결**: 업로드 전 Canvas API로 자동 전처리

```javascript
function toSquarePng(dataUrl) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;  // 정사각형
  ctx.clearRect(0, 0, 1024, 1024);       // 투명(RGBA) 배경
  ctx.drawImage(img, sx, sy);            // 중앙 정렬
  return canvas.toDataURL('image/png');  // PNG 변환
}
```

→ JPEG, WebP, 직사각형 등 어떤 이미지도 자동으로 변환

---

## STEP 7 — API 키 설정

```
OPENAI_API_KEY=sk-proj-...
```

- `.env` 파일 생성 후 서버 재시작
- 서버 콘솔에 `DALL-E 3 이미지 생성 준비 완료!` 출력으로 확인

> ⚠️ `.env` 파일은 절대 git에 커밋하지 않음 (API 키 노출 방지)

---

## STEP 8 — 로고 디자인 모드 추가

**새 탭**: `🏷️ 로고 디자인 (DALL-E 3)`

### 입력 항목
- **브랜드 이름** (필수): 로고를 만들 브랜드명
- **슬로건** (선택): 태그라인 텍스트

### 선택 항목

| 분류 | 옵션 |
|------|------|
| 로고 스타일 | 미니멀 · 뱃지 · 워드마크 · 레터마크 · 마스코트 · 추상형 · 빈티지 · 플랫 (8종) |
| 업종 | 테크 · 음식 · 패션 · 헬스 · 금융 · 교육 · 스포츠 · 뷰티 · 여행 · 펫 (10종) |
| 컬러 테마 | 흑백 · 블루 · 그린 · 레드 · 퍼플 · 오렌지 · 그라데이션 (7종) |

### 프롬프트 자동 생성 예시
```
입력: 브랜드명 "Daon" · 업종 "테크" · 스타일 "미니멀" · 컬러 "블루"

→ 생성 프롬프트:
"Professional logo design for "Daon",
 technology company,
 minimal flat vector logo, clean lines, simple geometric shapes,
 blue and navy color scheme,
 white background, vector style, scalable, high quality"
```

---

## STEP 9 — PPT 디자인 모드 추가

**새 탭**: `📊 PPT 디자인 (DALL-E 3)`

**목적**: 발표 주제를 입력하면 PowerPoint · Canva에 바로 쓸 수 있는 슬라이드 배경 이미지 생성

### 입력 항목
- **발표 주제** (필수): 슬라이드 주제
- **부제목/발표자** (선택)

### 선택 항목

| 분류 | 옵션 |
|------|------|
| 슬라이드 타입 | 표지 · 목차 · 내용 · 섹션 · 데이터 · 마무리 (6종) |
| 디자인 테마 | 미니멀 · 비즈니스 · 크리에이티브 · 다크 · 테크 · 내추럴 · 볼드 · 엘레강트 (8종) |
| 레이아웃 | 중앙형 · 좌측형 · 분할형 · 대각선 (4종) |
| 컬러 팔레트 | 블루 · 그린 · 퍼플 · 레드 · 다크 · 골드 · 틸 · 그라데이션 (8종) |
| 비율 | 16:9 (1792×1024) · 1:1 (1024×1024) |

### 프롬프트 자동 생성 예시
```
입력: "AI 트렌드 2025" · 표지 슬라이드 · 비즈니스 테마 · 분할형 · 블루

→ 생성 프롬프트:
"Professional PowerPoint presentation slide background design,
 title cover slide with large headline area,
 topic: "AI 트렌드 2025",
 professional corporate design, structured layout,
 split layout, left half solid color block,
 deep navy and sky blue color palette,
 no actual text rendered, 16:9 widescreen format"
```

---

## STEP 10 — 보고서 작성 (`report.md`)

프로젝트의 구조, 기능, 기술 포인트, 트러블슈팅을 정리한 문서

---

## STEP 11 — 타임테이블 작성 (`timetable.md`)

이 파일

---

## 최종 완성 현황

| 탭 | 기능 | 사용 모델 | 상태 |
|----|------|----------|------|
| ✏️ 텍스트 생성 | 화풍 10종 · 크기 3종 · 품질 2종 | DALL-E 3 | ✅ 완료 |
| 🖼️ 이미지 변환 | 변형 / 편집 · PNG 자동 변환 | DALL-E 2 | ✅ 완료 |
| 🏷️ 로고 디자인 | 스타일 8 · 업종 10 · 컬러 7 | DALL-E 3 | ✅ 완료 |
| 📊 PPT 디자인 | 타입 6 · 테마 8 · 레이아웃 4 · 컬러 8 | DALL-E 3 | ✅ 완료 |

**총 코드**: 1,431줄 (server.js 307줄 + index.html 1,124줄)  
**외부 패키지**: 0개 (Node.js 내장 모듈만 사용)

---

## 실행 방법

```bash
# 서버 실행
node week3/[Network]MyMidjourney/server.js

# 브라우저 접속
http://localhost:3001
```
