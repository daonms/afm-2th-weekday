create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null,
  neighborhood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
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

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, buyer_id),
  check (buyer_id <> seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists products_neighborhood_created_at_idx
  on public.products (neighborhood, created_at desc);

create index if not exists products_seller_id_idx
  on public.products (seller_id);

create index if not exists likes_user_id_idx
  on public.likes (user_id);

create index if not exists likes_product_id_idx
  on public.likes (product_id);

create index if not exists chat_rooms_product_buyer_idx
  on public.chat_rooms (product_id, buyer_id);

create index if not exists chat_rooms_buyer_id_idx
  on public.chat_rooms (buyer_id);

create index if not exists chat_rooms_seller_id_idx
  on public.chat_rooms (seller_id);

create index if not exists messages_room_id_created_at_idx
  on public.messages (room_id, created_at asc);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.likes enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "products_select_authenticated" on public.products;
create policy "products_select_authenticated"
on public.products for select
to authenticated
using (true);

drop policy if exists "products_insert_own_neighborhood" on public.products;
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

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
on public.products for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
on public.products for delete
to authenticated
using (auth.uid() = seller_id);

drop policy if exists "likes_select_own" on public.likes;
create policy "likes_select_own"
on public.likes for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own"
on public.likes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own"
on public.likes for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "chat_rooms_select_participant" on public.chat_rooms;
create policy "chat_rooms_select_participant"
on public.chat_rooms for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "chat_rooms_insert_buyer" on public.chat_rooms;
create policy "chat_rooms_insert_buyer"
on public.chat_rooms for insert
to authenticated
with check (
  auth.uid() = buyer_id
  and buyer_id <> seller_id
);

drop policy if exists "messages_select_room_participant" on public.messages;
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

drop policy if exists "messages_insert_room_participant" on public.messages;
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
