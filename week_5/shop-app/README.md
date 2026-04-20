# 다온 베이커리 쇼핑몰 (shop-app)

Express + Supabase(PostgreSQL) + JWT 인증 기반 단일 페이지 쇼핑몰 앱.

## 배포 정보

- **Production URL**: https://shop-app-sage-sigma.vercel.app
- **Platform**: Vercel (daon@daonms.com / daon-9060s-projects)
- **DB**: Supabase (ggvsoogzuvdjoelkwmdh) — 테이블: `shop_users`, `shop_products`, `shop_cart`

## 스택

- Backend: Express 4 · pg(Pooler) · bcryptjs · jsonwebtoken · dotenv · cors
- Frontend: 단일 `index.html` (React CDN 없이 바닐라 JS + Tailwind CDN)
- Runtime: Node.js (@vercel/node)

## 환경변수

`.env.example` 참고. 로컬 실행 시 `.env` 생성.

```
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your-jwt-secret-here
PORT=3001
```

## 로컬 실행

```bash
npm install
npm run dev    # node --watch server.js
# http://localhost:3001
```

## 배포 (Vercel)

```bash
vercel link --project shop-app
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel --prod
```

## API 엔드포인트

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/auth/signup` | 회원가입 | - |
| POST | `/api/auth/login` | 로그인 | - |
| GET | `/api/products` | 상품 목록 (`?category=`) | - |
| GET | `/api/cart` | 장바구니 조회 | JWT |
| POST | `/api/cart` | 장바구니 담기 (중복 시 수량 +1) | JWT |
| PUT | `/api/cart/:id` | 수량 변경 | JWT |
| DELETE | `/api/cart/:id` | 항목 삭제 | JWT |

## 시드 데이터

첫 요청 시 `shop_products` 테이블이 비어 있으면 10개 베이커리 상품을 자동 시드.
