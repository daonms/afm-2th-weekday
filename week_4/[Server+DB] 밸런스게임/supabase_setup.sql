-- =============================================
-- 밸런스 게임 앱 — Supabase 테이블 설정
-- Supabase → SQL Editor에서 실행하세요
-- =============================================

-- 질문 테이블
CREATE TABLE IF NOT EXISTS questions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      TEXT NOT NULL,
  option_a   TEXT NOT NULL,
  option_b   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 투표 테이블
CREATE TABLE IF NOT EXISTS votes (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  choice      TEXT NOT NULL CHECK (choice IN ('A', 'B')),
  voter_ip    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, voter_ip)  -- IP당 1회 투표
);

-- 인덱스 (집계 속도 향상)
CREATE INDEX IF NOT EXISTS idx_votes_question_id ON votes(question_id);
CREATE INDEX IF NOT EXISTS idx_votes_question_choice ON votes(question_id, choice);

-- RLS 비활성화 (서버에서 anon key로 접근하므로)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- anon 역할에 모든 권한 부여
CREATE POLICY "allow_all_questions" ON questions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_votes" ON votes FOR ALL TO anon USING (true) WITH CHECK (true);

-- 샘플 데이터 (선택사항)
INSERT INTO questions (title, option_a, option_b) VALUES
  ('당신의 선택은?', '월급 500만원 + 주7일 출근', '월급 300만원 + 주4일 출근'),
  ('최악의 상황 고르기', '평생 여름만 있는 세상', '평생 겨울만 있는 세상'),
  ('둘 중 하나만 할 수 있다면?', '평생 같은 음식만 먹기', '평생 같은 옷만 입기');
