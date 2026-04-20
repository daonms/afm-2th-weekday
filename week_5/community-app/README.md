# AI 공장장 (로그인 · 게시글 CRUD)

Supabase Auth + PostgreSQL RLS로 **로그인한 사용자만 글 작성**, **전체 글은 로그인한 회원만 조회**, **수정·삭제는 본인 글만** 가능한 커뮤니티 앱입니다.

## 준비물

- Supabase 프로젝트 (Auth · Database 활성화)
- Node가 없어도 됩니다 (CDN으로 Supabase JS 로드)

## 1. 데이터베이스 설정

1. Supabase 대시보드 → **SQL Editor** → 새 쿼리
2. [`supabase-setup.sql`](supabase-setup.sql) 전체를 붙여 넣고 **Run**
3. 오류가 나면 메시지를 확인합니다. (이미 트리거가 있으면 `DROP TRIGGER` 후 재실행)

## 2. 클라이언트 설정

1. Supabase → **Project Settings → API**
   - **Project URL** → `SUPABASE_URL`
   - **anon public** 키 → `SUPABASE_ANON_KEY`
2. [`supabase-config.example.js`](supabase-config.example.js)를 복사해 **`supabase-config.js`**로 저장하고 값을 채웁니다.

```text
supabase-config.example.js  →  supabase-config.js (같은 폴더에 두기)
```

`supabase-config.js`는 `.gitignore`에 포함되어 있어 **로컬·Git에는 커밋하지 않습니다**. Vercel 배포 시에는 빌드 스크립트가 **환경 변수**로 같은 파일을 생성합니다.

## 3. 로컬에서 확인

정적 파일이므로 아무 HTTP 서버로 열면 됩니다.

```bash
cd week_5/community-app
npx --yes serve .
```

브라우저에서 `http://localhost:3000` (또는 표시된 포트) → 회원가입 → 로그인 → 글쓰기 → 목록/상세/수정/삭제를 확인합니다.

## 4. Auth URL (배포 시 필수)

Vercel 등 **실제 도메인**으로 올릴 때:

- Supabase → **Authentication → URL Configuration**
  - **Site URL**: `https://배포주소.vercel.app`
  - **Redirect URLs**에 동일 도메인(와일드카드 `https://*.vercel.app`는 정책에 맞게) 추가

이메일 확인을 쓰는 경우, 리다이렉트가 이 URL을 가리켜야 합니다. 로컬만 쓸 때는 **Authentication → Providers → Email**에서 이메일 확인을 끄는 방법도 있습니다(수업용).

## 5. Vercel 배포

프로젝트에 `vercel.json` · `package.json` · `scripts/write-config.js`가 있어, 빌드 시 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 환경 변수로 `supabase-config.js`가 생성됩니다.

### 이미 배포된 프로덕션 주소 (예시)

| | URL |
|---|-----|
| 프로덕션(별칭) | https://community-app-lake.vercel.app |
| 배포 단위 URL | https://community-4u0xntabl-daon-9060s-projects.vercel.app |

**환경 변수를 아직 넣지 않았다면** 사이트는 뜨지만 Supabase 연결이 비어 있으므로, 아래를 한 뒤 **Redeploy** 하세요.

### 설정 절차

1. [Vercel](https://vercel.com) → 해당 프로젝트 → **Settings → Environment Variables**
2. **Production**(및 필요 시 Preview)에 다음 추가:
   - `SUPABASE_URL` — Supabase **Project URL**
   - `SUPABASE_ANON_KEY` — Supabase **anon public** 키
3. **Deployments**에서 최신 배포 **⋯ → Redeploy** (또는 로컬에서 `npx vercel deploy --prod`)

### Git 연동 시

- 저장소 연결 시 **Root Directory**를 `week_5/community-app`으로 지정합니다.
- 위 환경 변수를 동일하게 넣으면 됩니다.

### CLI만 쓸 때

```bash
cd week_5/community-app
npx vercel deploy --prod
```

`vercel env pull`로 로컬 `.env`를 맞춘 뒤 배포할 수도 있습니다(환경 변수 이름 동일).

## 6. 제출 체크리스트 (과제)

| 항목 | 메모 |
|------|------|
| 배포 URL | Vercel 프로덕션 주소 |
| GitHub 저장소 | 이 프로젝트 또는 서브폴더 링크 |
| 스크린샷 | 회원가입 → 로그인 → 글쓰기 → 게시글 목록 |
| (보너스) 타인 인증 | 가족/친구/수강생 1명 이상 가입·글 작성 화면 캡처 |

## 구조

- `index.html` — 셸
- `app.js` — 라우팅(해시), Auth, Supabase CRUD
- `styles.css` — 스타일
- `supabase-setup.sql` — `profiles` · `posts` · RLS · 트리거
- `scripts/write-config.js` — Vercel 빌드 시 `supabase-config.js` 생성
- `vercel.json` — `buildCommand` / `outputDirectory`

## 주제 변경

헤더 문구는 `app.js` 상단 `SITE_NAME`과 `index.html`의 제목·헤더 텍스트를 바꾸면 됩니다.
