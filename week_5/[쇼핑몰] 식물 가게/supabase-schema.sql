-- ============================================================
-- 식물 가게 쇼핑몰 — Supabase 스키마
-- 기존 프로젝트(ggvsoogzuvdjoelkwmdh)에 테이블 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- products 테이블 (공개 조회 가능)
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL,
  image_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- RLS 활성화: products는 누구나 읽기 가능
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 기존 정책 있으면 삭제 후 재생성
DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (true);

-- cart 테이블 (로그인 사용자 전용)
CREATE TABLE IF NOT EXISTS cart (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- RLS 활성화: cart는 본인 데이터만 접근
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_own_data" ON cart;
CREATE POLICY "cart_own_data" ON cart
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 샘플 상품 데이터 (식물 10종)
-- 이미 데이터가 있으면 중복 방지를 위해 먼저 삭제 후 실행
-- ============================================================
DELETE FROM products WHERE name IN (
  '몬스테라 델리시오사', '피쿠스 알리', '산세비에리아', '포토스 황금',
  '스파티필룸', '알로에 베라', '에케베리아 모음', '고무나무 버건디',
  '틸란드시아 이오난사', '파키라'
);

INSERT INTO products (name, price, image_url, description) VALUES
  ('몬스테라 델리시오사', 35000, 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400', '크고 독특한 잎이 매력적인 열대 식물. 관리 쉬움.'),
  ('피쿠스 알리', 28000, 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=400', '좁고 긴 잎이 우아한 고무나무 계열. 공기 정화 효과.'),
  ('산세비에리아', 18000, 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400', '공기 정화 1위 식물. 건조에 강해 초보자에게 완벽.'),
  ('포토스 황금', 12000, 'https://images.unsplash.com/photo-1620127682229-33388276e540?w=400', '노란 무늬가 예쁜 덩굴 식물. 어두운 곳에서도 잘 자람.'),
  ('스파티필룸', 22000, 'https://images.unsplash.com/photo-1593482892290-f54927ae2b7f?w=400', '흰 꽃이 피는 공기정화 식물. 음지에서도 잘 자람.'),
  ('알로에 베라', 15000, 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400', '화상·상처에 효과적인 다육식물. 햇빛 좋아함.'),
  ('에케베리아 모음', 8000, 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400', '귀여운 장미 모양 다육식물. 선물용으로 인기 만점.'),
  ('고무나무 버건디', 45000, 'https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?w=400', '짙은 붉은빛 잎이 인테리어 포인트. 대형 화분.'),
  ('틸란드시아 이오난사', 6000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', '흙 없이 키우는 공기식물. 책상 위 소품으로 딱.'),
  ('파키라', 32000, 'https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?w=400', '행운의 나무로 불리는 인기 관엽식물. 편의점에서도 팔릴 만큼 강함.');
