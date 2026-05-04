# 당근마켓 클론 Final Mission - 범위 고정본

## 0. 범위 잠금 선언

이 문서는 당근마켓 클론 Final 프로젝트의 최종 기준이다.

구현자는 이 문서에 있는 기능만 만든다. 구현 중 새로운 아이디어가 떠올라도 Final 범위에는 넣지 않는다. 추가 기능은 별도 메모로만 남기고, 현재 구현에서는 제외한다.

목표는 "작고 완성되는 동네 중고거래 앱"이다. 실제 당근마켓 전체 기능을 복제하지 않는다.
동네는 기본적으로 텍스트 직접 입력으로 저장하고, 사용자가 동의하면 현재 위치를 한 번 읽어서 입력칸을 자동 채움할 수 있다.

## 1. 최종 목표

Supabase Auth와 DB를 기반으로 아래 흐름이 동작하는 웹앱을 만든다.

```text
회원가입/로그인
-> 동네 입력
-> 내 동네 상품 보기
-> 상품 등록/상세 보기
-> 관심 상품 저장
-> 판매자와 채팅
-> 마이페이지 확인
```

완성 기준은 디자인 완성도가 아니라 기능 연결이다. 이 문서만 보고 바로 구현을 시작할 수 있어야 한다.

## 2. 반드시 포함할 기능

아래 기능은 모두 구현한다.

| 기능 | 최종 기준 |
|---|---|
| 회원가입/로그인 | Supabase Auth 이메일/비밀번호 방식 |
| 동네 입력 | 사용자가 텍스트로 직접 입력, 위치 동의 시 자동 채움 후 직접 수정 가능 |
| 상품 | 목록, 등록, 수정, 삭제, 상세 보기 |
| 이미지 | 상품당 최대 3장 업로드 |
| 관심 | 상품 상세에서 관심 추가/취소, 마이페이지에서 확인 |
| 채팅 | 상품 기준 채팅방 생성, 메시지 작성/조회, 채팅 목록 |
| 마이페이지 | 내 정보, 내 동네, 내 상품, 관심 상품, 로그아웃 |

## 3. 반드시 제외할 기능

아래 기능은 구현하지 않는다.

| 제외 기능 | 처리 기준 |
|---|---|
| 지속 GPS | 백그라운드 위치 추적, 지도, 위치 공유 금지 |
| 결제 | 구매/결제/정산 기능 없음 |
| 추천 | 추천 알고리즘, 인기순 개인화 없음 |
| 알림 | 푸시, 이메일, 뱃지 알림 없음 |
| 고급 실시간 | Supabase Realtime 구독 없음. 메시지 전송 후 다시 조회만 사용 |
| 과한 디자인 | 복잡한 애니메이션, 디자인 시스템, 고급 UI 컴포넌트 없음 |

추가 제외: 지도, 신고/차단, 관리자, 판매자 평점, 검색 고도화, 카테고리 고도화.

## 4. 기술 기준

- 프론트엔드: React + Vite
- 백엔드: Vercel Serverless API routes를 쓰는 얇은 라우팅 계층
- DB/Auth/Storage: Supabase
- 스타일: 기본 CSS
- 화면 기준: 모바일 폭 중심, 최대 너비 480px
- 배포: Vercel production

## 5. 추천 폴더 구조

아래 구조로 구현한다.

```text
carrot-clone-final/
├── README.md
├── MISSION.md
├── WORK_RECORD.md
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── api/
│   ├── _shared.js
│   ├── ping.js
│   ├── profile/
│   │   ├── me.js
│   │   └── [id].js
│   ├── products/
│   │   ├── index.js
│   │   └── [id].js
│   ├── likes/
│   │   ├── [productId].js
│   │   ├── [productId]/
│   │   │   └── toggle.js
│   │   └── me/
│   │       └── products.js
│   └── chats/
│       └── rooms/
│           ├── index.js
│           ├── [roomId].js
│           └── [roomId]/
│               └── messages.js
├── supabase/
│   ├── schema.sql
│   └── seed.sql
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── lib/
    │   ├── supabase.js
    │   ├── api.js
    │   ├── session.jsx
    │   └── neighborhoodStorage.js
    ├── routes/
    │   └── paths.js
    ├── pages/
    │   ├── LoginPage.jsx
    │   ├── SignupPage.jsx
    │   ├── NeighborhoodPage.jsx
    │   ├── ProductListPage.jsx
    │   ├── ProductDetailPage.jsx
    │   ├── ProductFormPage.jsx
    │   ├── ChatListPage.jsx
    │   ├── ChatRoomPage.jsx
    │   └── MyPage.jsx
    ├── components/
    │   ├── BottomNav.jsx
    │   ├── ProductCard.jsx
    │   └── RequireAuth.jsx
    └── styles.css
```

## 6. 라우트 고정

화면 주소는 아래처럼 고정한다.

| URL | 화면 | 로그인 필요 | 설명 |
|---|---|---|---|
| `/login` | LoginPage | 아니오 | 로그인 |
| `/signup` | SignupPage | 아니오 | 회원가입 |
| `/neighborhood` | NeighborhoodPage | 예 | 동네 입력/수정, 위치 허용 시 자동 채움 |
| `/` | ProductListPage | 예 | 내 동네 상품 목록 |
| `/products/new` | ProductFormPage | 예 | 상품 등록 |
| `/products/:id` | ProductDetailPage | 예 | 상품 상세 |
| `/products/:id/edit` | ProductFormPage | 예 | 상품 수정 |
| `/chats` | ChatListPage | 예 | 내 채팅방 목록 |
| `/chats/:roomId` | ChatRoomPage | 예 | 채팅방 |
| `/me` | MyPage | 예 | 마이페이지 |

라우팅 규칙:

- 로그인하지 않은 사용자가 보호 화면에 접근하면 `/login`으로 이동한다.
- 로그인했지만 `profiles.neighborhood`가 비어 있으면 `/neighborhood`로 이동한다.
- 동네가 있는 사용자가 `/login`, `/signup`에 접근하면 `/`로 이동한다.

## 7. 화면 흐름

### 7.1 첫 진입

```text
앱 접속
-> Supabase Auth 세션 확인
-> 세션 없음: /login
-> 세션 있음: profiles 조회 또는 생성
-> neighborhood 없음: /neighborhood
-> neighborhood 있음: /
```

### 7.2 회원가입

입력:

- email
- password
- nickname 선택

처리:

```text
supabase.auth.signUp(email, password)
-> auth user id 확보
-> profiles insert
   id = auth user id
   email = auth user email
   nickname = 입력값 또는 email 앞부분
   neighborhood = null
-> /neighborhood 이동
```

실패 처리:

- 이미 가입된 이메일이면 오류 메시지를 보여준다.
- 비밀번호가 너무 짧으면 오류 메시지를 보여준다.

### 7.3 로그인

입력:

- email
- password

처리:

```text
supabase.auth.signInWithPassword(email, password)
-> profiles 조회 또는 생성
-> neighborhood 없으면 /neighborhood
-> 있으면 /
```

### 7.4 동네 입력

입력:

- neighborhood 텍스트

처리:

```text
profiles 업데이트
-> neighborhood = 입력한 동네
-> updated_at = now()
-> / 이동
```

규칙:

- 위치 권한 허용 시 현재 좌표를 한 번 읽어서 동네 칸을 자동 채울 수 있다.
- 자동 채움 이후에는 사용자가 텍스트로 직접 수정할 수 있다.
- 예시 placeholder: "예: 역삼동, 성수동, 잠실동"
- 빈 값 저장 금지

### 7.5 상품 목록

조회:

```text
현재 사용자 profile 조회
-> products where neighborhood = profile.neighborhood
-> created_at desc 정렬
```

표시:

- 상품 이미지 또는 기본 박스
- 제목
- 가격
- 동네
- 상태

버튼:

- 상품 등록: `/products/new`
- 상품 카드 클릭: `/products/:id`

### 7.6 상품 등록/수정

입력:

- title 필수
- price 필수, 0 이상 숫자
- description 필수
- 이미지 최대 3장

처리:

```text
선택한 이미지를 Storage에 업로드
-> image_urls 배열 생성
-> image_url = 첫 이미지 또는 null
-> products insert 또는 update
```

저장:

```text
products insert
seller_id = auth.uid()
title = 입력값
price = 입력값
description = 입력값
image_url = 첫 이미지 또는 null
image_urls = 최대 3장 배열
neighborhood = 현재 profile.neighborhood
status = 'selling'
```

저장 후:

- 성공: 방금 만든 상품 상세 `/products/:id`로 이동
- 실패: 화면에 오류 표시

### 7.7 상품 상세

조회:

```text
products by id
seller profile
현재 사용자의 likes 여부
```

표시:

- 제목
- 가격
- 설명
- 이미지
- 판매자 닉네임 또는 이메일
- 동네
- 판매 상태

버튼 규칙:

- 내 상품이면 `채팅하기` 버튼 숨김
- 내 상품이 아니면 `채팅하기` 버튼 표시
- 관심 버튼은 내 상품에서도 숨겨도 된다

관심 처리:

```text
이미 likes row 있음 -> delete
없음 -> insert user_id = auth.uid(), product_id = 현재 상품 id
```

채팅 처리:

```text
기존 chat_rooms 조회 where product_id = 현재 상품 id and buyer_id = auth.uid()
-> 있으면 /chats/:roomId 이동
-> 없으면 chat_rooms insert
   product_id = 현재 상품 id
   buyer_id = auth.uid()
   seller_id = products.seller_id
-> /chats/:roomId 이동
```

### 7.8 채팅 목록

조회:

```text
chat_rooms
where buyer_id = auth.uid() or seller_id = auth.uid()
order by created_at desc
products join
상대방 profile join은 선택
```

표시:

- 상품 제목
- 상대방 표시명
- 생성일
- 클릭 시 `/chats/:roomId`

### 7.9 채팅방

조회:

```text
chat_rooms by roomId
-> 현재 사용자가 buyer 또는 seller인지 확인
-> messages where room_id = roomId order by created_at asc
```

입력:

- content 필수

저장:

```text
messages insert
room_id = 현재 room id
sender_id = auth.uid()
content = 입력값
```

전송 후:

- 입력창 비우기
- messages 다시 조회

메시지 갱신은 polling으로만 처리한다.

### 7.10 마이페이지

조회:

```text
profiles where id = auth.uid()
products where seller_id = auth.uid() order by created_at desc
likes where user_id = auth.uid() with products
```

표시:

- 이메일
- 닉네임
- 동네
- 동네 직접 수정 입력
- 동네 수정 버튼: `/neighborhood`
- 내가 올린 상품 목록
- 관심 상품 목록
- 로그아웃 버튼

로그아웃:

```text
supabase.auth.signOut()
-> /login 이동
```

## 8. Supabase 테이블 초안

`supabase/schema.sql`에 넣을 기준 SQL이다.

```sql
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null,
  neighborhood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text not null check (char_length(description) between 1 and 2000),
  price integer not null check (price >= 0),
  image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  neighborhood text not null check (char_length(neighborhood) between 1 and 40),
  status text not null default 'selling' check (status in ('selling', 'reserved', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, buyer_id),
  check (buyer_id <> seller_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index products_neighborhood_created_at_idx
  on public.products (neighborhood, created_at desc);

create index products_seller_id_idx
  on public.products (seller_id);

create index likes_user_id_idx
  on public.likes (user_id);

create index likes_product_id_idx
  on public.likes (product_id);

create index chat_rooms_product_buyer_idx
  on public.chat_rooms (product_id, buyer_id);

create index chat_rooms_buyer_id_idx
  on public.chat_rooms (buyer_id);

create index chat_rooms_seller_id_idx
  on public.chat_rooms (seller_id);

create index messages_room_id_created_at_idx
  on public.messages (room_id, created_at asc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname, neighborhood)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''), split_part(coalesce(new.email, 'user'), '@', 1)),
    null
  )
  on conflict (id) do update
    set email = excluded.email,
        nickname = excluded.nickname,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
```

## 9. Supabase RLS 초안

`supabase/schema.sql` 또는 별도 `supabase/rls.sql`에 넣을 기준 SQL이다.

```sql
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.likes enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;

create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "products_select_authenticated"
on public.products for select
to authenticated
using (true);

create policy "products_insert_own_neighborhood"
on public.products for insert
to authenticated
with check (
  auth.uid() = seller_id
  and neighborhood = (
    select profiles.neighborhood
    from public.profiles
    where profiles.id = auth.uid()
  )
);

create policy "products_update_own"
on public.products for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create policy "products_delete_own"
on public.products for delete
to authenticated
using (auth.uid() = seller_id);

create policy "likes_select_own"
on public.likes for select
to authenticated
using (auth.uid() = user_id);

create policy "likes_insert_own"
on public.likes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "likes_delete_own"
on public.likes for delete
to authenticated
using (auth.uid() = user_id);

create policy "chat_rooms_select_participant"
on public.chat_rooms for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "chat_rooms_insert_buyer"
on public.chat_rooms for insert
to authenticated
with check (
  auth.uid() = buyer_id
  and buyer_id <> seller_id
);

create policy "messages_select_room_participant"
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.chat_rooms
    where chat_rooms.id = messages.room_id
      and (chat_rooms.buyer_id = auth.uid() or chat_rooms.seller_id = auth.uid())
  )
);

create policy "messages_insert_room_participant"
on public.messages for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.chat_rooms
    where chat_rooms.id = messages.room_id
      and (chat_rooms.buyer_id = auth.uid() or chat_rooms.seller_id = auth.uid())
  )
);
```

## 10. 프론트엔드 데이터 함수 기준

구현자는 아래 함수 단위로 만들면 된다.

```text
Auth
- signUp(email, password, nickname)
- signIn(email, password)
- signOut()
- getCurrentUser()

Profile
- getMyProfile()
- createMyProfileIfMissing(user)
- updateMyNeighborhood(neighborhood)

Products
- getNeighborhoodProducts(neighborhood)
- getProduct(productId)
- createProduct({ title, price, description, imageUrls })
- updateProduct(productId, payload)
- uploadProductImages(files)
- getMyProducts()

Likes
- getMyLike(productId)
- toggleLike(productId)
- getMyLikedProducts()

Chats
- getOrCreateRoom(productId)
- getMyChatRooms()
- getRoom(roomId)
- getMessages(roomId)
- sendMessage(roomId, content)
```

현재 구현은 Supabase REST를 브라우저에서 직접 호출하지 않고, `/api` 서버리스 라우트를 통해 DB를 읽고 쓴다. Auth 세션과 Storage 업로드는 그대로 Supabase를 쓴다.

## 11. 구현 순서

### 1단계: 프로젝트 구조

- Vite React 프로젝트 확인
- Supabase 패키지 확인
- `.env.example` 확인
- `src/lib/supabase.js` 확인
- `vercel.json` 확인

완료 기준:

- 브라우저에서 앱이 열린다.
- Supabase URL/key가 환경변수로 연결된다.
- Vercel 직접 진입 경로가 SPA로 열린다.

### 2단계: DB 세팅

- Supabase SQL Editor에서 테이블 SQL 실행
- RLS SQL 실행
- Auth 이메일/비밀번호 로그인 활성화 확인

완료 기준:

- `profiles`, `products`, `likes`, `chat_rooms`, `messages` 테이블이 있다.
- 모든 테이블 RLS가 켜져 있다.

### 3단계: 인증 구현

- 회원가입
- 로그인
- 로그아웃
- `RequireAuth`
- profile 자동 생성

완료 기준:

- 새 계정 생성 후 `profiles` row가 생긴다.
- 로그인/로그아웃이 된다.

### 4단계: 동네 입력 구현

- `/neighborhood` 화면 작성
- 동네 저장
- 위치 동의 시 자동 채움
- 동네 없으면 다른 화면 접근 제한

완료 기준:

- 동네 저장 후 상품 목록으로 이동한다.

### 5단계: 상품 구현

- 상품 목록
- 상품 등록
- 상품 수정/삭제
- 상품 상세
- 내 동네 필터
- 이미지 1~3장 업로드

완료 기준:

- 상품 등록 후 내 동네 목록에 표시된다.
- 다른 동네 상품은 목록에 표시하지 않는다.

### 6단계: 관심 구현

- 상품 상세 관심 추가/취소
- 마이페이지 관심 상품 목록

완료 기준:

- 같은 상품에 관심이 중복 저장되지 않는다.
- 관심 취소가 된다.

### 7단계: 채팅 구현

- 상품 상세에서 채팅방 생성 또는 기존 방 이동
- 채팅 목록
- 채팅방 메시지 조회
- 메시지 보내기
- 전송 후 다시 조회
- polling 재조회

완료 기준:

- 구매자와 판매자만 채팅방과 메시지를 볼 수 있다.
- Realtime 없이도 메시지 전송 후 목록이 갱신된다.

### 8단계: 마이페이지 구현

- 내 정보 표시
- 내 동네 표시/수정 이동
- 내가 올린 상품
- 관심 상품
- 로그아웃

완료 기준:

- 마이페이지에서 프로젝트 핵심 데이터가 확인된다.

### 9단계: 최종 검수

아래 항목을 직접 확인한다.

- 회원가입 가능
- 로그인 가능
- 동네 입력 가능
- 위치 허용 시 동네 자동 채움 가능
- 동네 없으면 상품 화면 진입 불가
- 상품 등록 가능
- 이미지 1~3장 업로드 가능
- 같은 동네 상품만 목록에 표시
- 상품 상세 확인 가능
- 관심 추가/취소 가능
- 마이페이지에서 관심 상품 확인 가능
- 본인 상품에는 채팅하기가 숨겨지거나 막힘
- 다른 사람 상품에는 채팅 가능
- 메시지 전송 가능
- 채팅 참여자가 아닌 사용자는 채팅방 접근 불가
- 로그아웃 가능
- 지속 GPS 없음
- 결제 없음
- 추천 없음
- 알림 없음
- 고급 실시간 없음
- 과한 디자인 없음

## 12. 최소 UI 기준

디자인은 아래 기준 이상으로 확장하지 않는다.

- 전체 화면 최대 너비 480px
- 흰 배경 또는 연한 회색 배경
- 포인트 색상은 당근색 계열 1개만 사용
- 상품은 카드 형태로 표시
- 하단 탭은 `홈`, `채팅`, `마이` 3개만 사용
- 애니메이션 없음
- 복잡한 아이콘 세트 없음

## 13. 구현자에게 넘길 최종 한 줄

이 프로젝트는 Supabase Auth 기반으로 로그인한 사용자가 직접 입력한 동네 안에서 상품을 등록하고, 최대 3장 이미지를 올리고, 관심을 누르고, 상품별 채팅을 할 수 있는 학습용 중고거래 MVP다. 위치 권한은 동네 자동 채움 보조 용도로만 사용하고, 지속 GPS / 결제 / 추천 / 알림 / 고급 실시간 / 과한 디자인은 절대 넣지 않는다.
