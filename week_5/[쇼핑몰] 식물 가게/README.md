# 초록 식물 가게 — 쇼핑몰 앱

AFM 2기 평일반 Week 5 실습 프로젝트.
React + Supabase로 만든 식물 쇼핑몰 미니앱입니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 상품 목록 | 비로그인도 조회 가능, 반응형 그리드 |
| 로그인/회원가입 | Supabase Auth (이메일+비밀번호) |
| 장바구니 담기 | 로그인 필수, 중복 시 수량 +1 |
| 수량 변경 | +/- 버튼, 1 미만 시 삭제 확인 |
| 장바구니 삭제 | 개별 상품 제거 |
| 실시간 뱃지 | 네비바 장바구니 아이콘에 수량 표시 |

---

## 실행 방법 (로컬)

1. `index.html` 파일을 브라우저에서 직접 열기
2. 또는 간단한 서버 실행:

```bash
# Python 있는 경우 (가장 간단)
python -m http.server 5500

# Node.js 있는 경우
npx serve .
```

→ 브라우저에서 `http://localhost:5500` 접속

---

## Supabase 설정 방법

### 1단계 — SQL 실행

Supabase 대시보드 → SQL Editor → `supabase-schema.sql` 내용을 붙여넣고 실행

- `products` 테이블 생성 + 식물 10종 샘플 데이터 추가
- `cart` 테이블 생성
- RLS 정책 설정 (products 공개 읽기 / cart 본인 데이터만)

### 2단계 — API 키 확인

Supabase 대시보드 → Project Settings → API 탭에서:
- **Project URL** 복사
- **anon public** 키 복사

### 3단계 — index.html 수정

`index.html` 상단 스크립트 블록에서 두 줄 교체:

```javascript
// 현재 (교체 필요)
const SUPABASE_URL = 'https://ggvsoogzuvdjoelkwmdh.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// 교체 후 (본인 값으로)
const SUPABASE_URL = 'https://본인프로젝트ID.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJI...'; // anon public 키
```

---

## Vercel 배포 방법

### 배포된 URL

- **프로덕션**: https://plant-shop-afm.vercel.app
- 계정: `daon@daonms.com` (daon-9060)
- 프로젝트명: `plant-shop-afm`

### 방법 1 — 드래그 앤 드롭 (가장 쉬움)

1. [vercel.com](https://vercel.com) 로그인
2. 대시보드에서 "Add New → Project"
3. 이 폴더를 드래그해서 업로드
4. 배포 완료!

### 방법 2 — GitHub 연동

```bash
# 이 폴더를 GitHub 레포지토리로 push
git init
git add .
git commit -m "식물 가게 쇼핑몰 앱"
git remote add origin https://github.com/본인ID/plant-shop.git
git push -u origin main
```

→ Vercel에서 해당 레포지토리 선택 → 자동 배포

> 주의: `SUPABASE_ANON_KEY`는 공개 키(anon)라 GitHub에 올려도 됩니다.
> `.env` 파일이 없는 단일 HTML 구조이므로 별도 환경변수 설정 불필요.

---

## 학습 포인트

1. **Supabase Auth** — 이메일/비밀번호 회원가입·로그인, `onAuthStateChange`로 상태 구독
2. **RLS (Row Level Security)** — 테이블마다 접근 규칙을 DB 레벨에서 설정 (products 공개, cart 본인만)
3. **장바구니 패턴** — 중복 확인 후 INSERT/UPDATE 분기, `maybeSingle()`로 null 안전 처리

---

## 확장 아이디어

- 상품 검색/필터 기능 (이름 검색, 가격 범위 필터)
- 주문 테이블 추가 + 주문 내역 페이지
- Supabase Storage로 관리자가 상품 이미지 직접 업로드

---

## 파일 구조

```
[쇼핑몰] 식물 가게/
├── index.html          # 메인 앱 (React + Tailwind + Supabase CDN)
├── supabase-schema.sql # DB 테이블 생성 + 샘플 데이터
├── .env.example        # 환경변수 예시 (참고용)
└── README.md           # 이 파일
```
