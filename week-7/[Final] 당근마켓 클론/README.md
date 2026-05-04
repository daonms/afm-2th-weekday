# Carrot Clone Final

Week 7 제출용 동네 중고거래 MVP입니다.

## 포함 기능
- Supabase Auth 회원가입/로그인
- 동네 입력/수정
- 위치 권한 허용 시 동네 자동 채움 후 직접 수정
- 내 동네 상품 목록
- 상품 등록/수정/삭제
- 이미지 최대 3장 업로드
- 상품 상세, 관심 추가/취소
- 상품 상세 내부 문의 채팅 패널
- 채팅 polling 재조회
- 마이페이지

## 제외 범위
- 지속 GPS, 결제, 추천, 알림, 고급 실시간, 과한 디자인
- 지도, 신고/차단, 관리자, 판매자 평점

## 실행 방법
```bash
npm install
```

`.env` 파일에 아래 값을 넣습니다.

```bash
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SUPABASE_STORAGE_BUCKET=product-images
```

```bash
npm run dev
```

## Supabase 준비
1. `supabase/schema.sql` 실행
2. Storage 버킷 `product-images` 생성
3. 버킷은 public 권장
4. Auth 이메일/비밀번호 로그인 활성화
5. Vercel 배포 시 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_STORAGE_BUCKET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_URL` 설정

## 제출 체크리스트
- [ ] 회원가입/로그인 가능
- [ ] 동네 입력 또는 위치 자동 채움 후 목록 진입 가능
- [ ] 이미지 1~3장 업로드 가능
- [ ] 상품 등록/수정/삭제 가능
- [ ] 상품 상세에서 관심 토글 가능
- [ ] 상품 상세 내부 채팅 패널이 동작함
- [ ] 채팅이 polling으로 갱신됨
- [ ] 마이페이지에서 내 상품/관심 상품 확인 가능

## 파일 위치
- `src/lib/supabase.js` - Supabase 클라이언트
- `src/lib/api.js` - Auth / Profile / Products / Likes / Chats
- `src/lib/session.jsx` - 세션 상태
- `api/` - Vercel serverless API routes
- `src/pages/*` - 화면별 페이지
- `supabase/schema.sql` - 테이블 / RLS / 트리거

## 화면 흐름
`/login -> /signup -> /neighborhood -> / -> /products/new -> /products/:id -> /chats -> /me`
