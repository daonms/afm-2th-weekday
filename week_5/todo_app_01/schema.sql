-- ============================================================
-- W5_todo_app_01 스키마 (로그인 + 사용자별 필터 버전)
-- 프로젝트: week_5/todo_app_01
-- DB: Supabase PostgreSQL (aws-1-us-east-1)
-- ============================================================

SET client_encoding = 'UTF8';

-- ── 1. 유저 테이블 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS W5_todo_app_01_users (
  id         SERIAL       PRIMARY KEY,
  username   VARCHAR(50)  UNIQUE NOT NULL,          -- 로그인 아이디
  password   TEXT         NOT NULL,                 -- bcrypt 해시
  role       VARCHAR(10)  NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 2. Todo 테이블 (user_id 추가) ─────────────────────────────
CREATE TABLE IF NOT EXISTS W5_todo_app_01 (
  id         SERIAL       PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES W5_todo_app_01_users(id) ON DELETE CASCADE,
  title      TEXT         NOT NULL,
  done       BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 인덱스 ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_todo_created  ON W5_todo_app_01 (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todo_user_id  ON W5_todo_app_01 (user_id);

-- ============================================================
-- 컬럼 설명
-- ============================================================
-- W5_todo_app_01_users
--   id       : 자동 증가 PK
--   username : 로그인 아이디 (중복 불가)
--   password : bcryptjs로 해시된 비밀번호 (원문 저장 안 함)
--   role     : 'admin'=전체조회, 'user'=본인만 조회
--
-- W5_todo_app_01
--   user_id  : 작성자 FK (유저 삭제 시 할 일도 함께 삭제)

-- ============================================================
-- 데모 데이터
-- 비밀번호 원문: 1234  →  bcrypt 해시값 사용
-- ============================================================

-- 유저 데모 (비밀번호 모두 1234)
INSERT INTO W5_todo_app_01_users (username, password, role) VALUES
  ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
  ('daon',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user'),
  ('alice', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user'),
  ('bob',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user')
ON CONFLICT (username) DO NOTHING;

-- Todo 데모 데이터
INSERT INTO W5_todo_app_01 (user_id, title, done)
SELECT u.id, v.title, v.done
FROM W5_todo_app_01_users u
JOIN (VALUES
  ('daon',  '부트캠프 과제 제출하기',  false),
  ('daon',  'React 복습하기',          true),
  ('daon',  'Supabase 문서 읽기',      false),
  ('alice', '포트폴리오 사이트 만들기', false),
  ('alice', 'GitHub 정리하기',         true),
  ('bob',   'Node.js 강의 듣기',       false),
  ('bob',   'Express 예제 따라하기',   false),
  ('bob',   'SQL 기초 공부',           true)
) AS v(uname, title, done) ON u.username = v.uname
ON CONFLICT DO NOTHING;

-- ============================================================
-- 초기화 (전체 리셋 시)
-- ============================================================
-- TRUNCATE TABLE W5_todo_app_01, W5_todo_app_01_users RESTART IDENTITY CASCADE;
-- DROP TABLE IF EXISTS W5_todo_app_01, W5_todo_app_01_users CASCADE;
