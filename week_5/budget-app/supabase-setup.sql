-- 가계부 앱 Supabase 테이블 생성 SQL
-- Supabase 대시보드 → SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC(12, 0) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  memo        TEXT DEFAULT '',
  date        DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- anon 사용자 전체 허용 (학습용)
CREATE POLICY "anon_all" ON transactions
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 인덱스 (날짜 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
