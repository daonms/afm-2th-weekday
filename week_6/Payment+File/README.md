# 유료 콘텐츠 쇼핑몰

상품 상세 화면 안에서 이미지 갤러리와 문의 채팅을 함께 보여주는 실습용 앱입니다.

## 최소 사용법

1. 관리자 계정으로 로그인합니다.
2. `관리` 탭에서 상품을 등록합니다.
3. 이미지 파일을 최대 3장까지 선택해서 `선택 이미지 업로드`를 누릅니다.
4. 상품 제목, 가격, 설명, 본문을 입력한 뒤 `콘텐츠 등록`을 누릅니다.
5. 목록에서 상품을 열면 상세 화면 안에 문의 채팅 패널이 보입니다.
6. 채팅은 소켓이 아니라 4초 간격 polling으로 갱신됩니다.

## 환경 변수

- `DATABASE_URL`
- `JWT_SECRET`
- `TOSS_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` 기본값: `shop-images`
- `ADMIN_EMAILS`
- `PORT`

## 실행

```bash
npm install
npm start
```

로컬 접속:

```bash
http://localhost:3001
```

## 배포

- Vercel에서는 `server.js`를 Node 함수로 배포합니다.
- 배포 전 Supabase Storage 버킷이 있어야 하고, 서비스 롤 키가 설정돼 있어야 합니다.
- 상품 이미지는 Supabase Storage 공개 URL로 저장됩니다.

