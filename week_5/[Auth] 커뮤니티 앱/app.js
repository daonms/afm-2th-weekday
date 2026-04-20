(function () {
  "use strict";

  const SITE_NAME = "AI 공장장";

  function escapeHtml(str) {
    if (str == null) return "";
    const d = document.createElement("div");
    d.textContent = String(str);
    return d.innerHTML;
  }

  function formatDt(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  function parseRoute() {
    const raw = (location.hash || "#/").replace(/^#/, "") || "/";
    if (raw === "/" || raw === "")
      return { name: "list", path: "/" };
    if (raw === "/login") return { name: "login", path: "/login" };
    if (raw === "/signup") return { name: "signup", path: "/signup" };
    if (raw === "/write") return { name: "write", path: "/write" };

    let m = raw.match(/^\/post\/([^/]+)$/);
    if (m) return { name: "detail", id: m[1], path: raw };

    m = raw.match(/^\/edit\/([^/]+)$/);
    if (m) return { name: "edit", id: m[1], path: raw };

    return { name: "list", path: "/" };
  }

  function navigate(path) {
    location.hash = path.startsWith("#") ? path.slice(1) : path;
  }

  const $app = () => document.getElementById("app");
  const $navUser = () => document.getElementById("nav-user");
  const $navActions = () => document.getElementById("nav-actions");

  let supabase = null;
  let currentUser = null;
  let authSub = null;

  function getClient() {
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
    if (
      !url ||
      !key ||
      /YOUR_PROJECT|YOUR_SUPABASE|placeholder/i.test(String(url + key))
    ) {
      return null;
    }
    if (!supabase && window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    }
    return supabase;
  }

  function renderNav() {
    const nav = $navActions();
    if (!nav) return;
    const user = currentUser;
    const email = user?.email || "";
    const metaName = user?.user_metadata?.display_name;
    const label = metaName || email.split("@")[0] || "회원";

    if (!getClient()) {
      nav.innerHTML =
        '<span class="user-pill">설정 필요</span>';
      return;
    }

    if (user) {
      nav.innerHTML = [
        '<span class="user-pill" title="' +
          escapeHtml(email) +
          '">' +
          escapeHtml(label) +
          "님</span>",
        '<a href="#/write" class="btn btn--primary">글쓰기</a>',
        '<button type="button" class="btn btn--ghost" id="btn-logout">로그아웃</button>',
      ].join("");
      document.getElementById("btn-logout")?.addEventListener("click", async () => {
        await getClient().auth.signOut();
        navigate("#/");
      });
    } else {
      nav.innerHTML = [
        '<a href="#/login" class="btn btn--ghost">로그인</a>',
        '<a href="#/signup" class="btn btn--primary">회원가입</a>',
      ].join("");
    }
  }

  async function refreshUser() {
    const client = getClient();
    if (!client) {
      currentUser = null;
      return;
    }
    const { data } = await client.auth.getUser();
    currentUser = data?.user ?? null;
  }

  async function loadPosts() {
    const client = getClient();
    if (!client) return { error: "no_client", data: [] };
    const { data, error } = await client
      .from("posts")
      .select(
        `
        id,
        title,
        body,
        created_at,
        updated_at,
        user_id,
        profiles ( display_name )
      `
      )
      .order("created_at", { ascending: false });

    if (error) return { error: error.message, data: [] };
    const rows = (data || []).map((row) => ({
      ...row,
      author_name:
        row.profiles?.display_name ||
        (row.user_id ? String(row.user_id).slice(0, 8) + "…" : "익명"),
    }));
    return { error: null, data: rows };
  }

  async function loadPost(id) {
    const client = getClient();
    if (!client) return { error: "no_client", post: null };
    const { data, error } = await client
      .from("posts")
      .select(
        `
        id,
        title,
        body,
        created_at,
        updated_at,
        user_id,
        profiles ( display_name )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) return { error: error.message, post: null };
    if (!data) return { error: "not_found", post: null };
    const post = {
      ...data,
      author_name:
        data.profiles?.display_name ||
        (data.user_id ? String(data.user_id).slice(0, 8) + "…" : "익명"),
    };
    return { error: null, post };
  }

  function renderConfigMissing() {
    $app().innerHTML = `
      <div class="config-missing">
        <h1 class="page-title">설정이 필요합니다</h1>
        <p class="page-desc">
          <code>supabase-config.example.js</code>를 복사해
          <code>supabase-config.js</code>로 저장한 뒤, Supabase 프로젝트 URL과 Anon Key를 넣어주세요.
        </p>
        <p class="page-desc">로컬에서는 <code>index.html</code>과 같은 폴더에 두고 새로고침하면 됩니다.</p>
      </div>`;
  }

  function renderList() {
    const main = $app();
    main.innerHTML =
      '<p class="loading">불러오는 중…</p>';

    loadPosts().then(({ error, data }) => {
      if (error) {
        main.innerHTML =
          '<div class="alert alert--error">목록을 불러오지 못했습니다: ' +
          escapeHtml(error) +
          "</div>";
        return;
      }

      if (!data.length) {
        main.innerHTML = `
          <h1 class="page-title">게시글</h1>
          <p class="page-desc">아직 글이 없습니다. 로그인 후 첫 글을 남겨보세요.</p>
          <div class="empty-state">첫 게시글을 작성해 보세요.</div>`;
        return;
      }

      const cards = data
        .map(
          (p) => `
        <article class="card card--clickable" data-post-id="${escapeHtml(p.id)}">
          <h2 class="post-list-item__title">${escapeHtml(p.title)}</h2>
          <div class="post-meta">
            <span>${escapeHtml(p.author_name)}</span>
            <span>${escapeHtml(formatDt(p.created_at))}</span>
          </div>
        </article>`
        )
        .join("");

      main.innerHTML = `
        <h1 class="page-title">게시글</h1>
        <p class="page-desc">최신순 · 로그인한 회원만 목록을 볼 수 있습니다.</p>
        ${cards}`;

      main.querySelectorAll("[data-post-id]").forEach((el) => {
        el.addEventListener("click", () => {
          navigate("#/post/" + el.getAttribute("data-post-id"));
        });
      });
    });
  }

  function renderDetail(id) {
    const main = $app();
    main.innerHTML = '<p class="loading">불러오는 중…</p>';

    loadPost(id).then(({ error, post }) => {
      if (error === "not_found" || !post) {
        main.innerHTML =
          '<div class="alert alert--error">게시글을 찾을 수 없습니다.</div>';
        return;
      }
      if (error) {
        main.innerHTML =
          '<div class="alert alert--error">' + escapeHtml(error) + "</div>";
        return;
      }

      const uid = currentUser?.id;
      const isOwner = uid && post.user_id === uid;

      const actions = isOwner
        ? `<div class="btn-row">
            <a href="#/edit/${escapeHtml(post.id)}" class="btn btn--ghost">수정</a>
            <button type="button" class="btn btn--danger" id="btn-delete-post">삭제</button>
          </div>`
        : "";

      main.innerHTML = `
        <article>
          <h1 class="post-detail__title">${escapeHtml(post.title)}</h1>
          <div class="post-meta" style="margin-bottom:1rem;">
            <span>${escapeHtml(post.author_name)}</span>
            <span>${escapeHtml(formatDt(post.created_at))}</span>
          </div>
          <div class="post-detail__body">${escapeHtml(post.body)}</div>
          ${actions}
          <p style="margin-top:1.5rem;"><a href="#/">← 목록으로</a></p>
        </article>`;

      document.getElementById("btn-delete-post")?.addEventListener("click", async () => {
        if (!confirm("이 글을 삭제할까요?")) return;
        const client = getClient();
        const { error: delErr } = await client.from("posts").delete().eq("id", post.id);
        if (delErr) {
          alert("삭제 실패: " + delErr.message);
          return;
        }
        navigate("#/");
      });
    });
  }

  function renderLogin(msg, isError) {
    const alert =
      msg &&
      `<div class="alert ${isError ? "alert--error" : "alert--success"}">${escapeHtml(
        msg
      )}</div>`;
    $app().innerHTML = `
      <h1 class="page-title">로그인</h1>
      ${alert || ""}
      <form class="card" id="form-login">
        <div class="form-group">
          <label for="login-email">이메일</label>
          <input id="login-email" name="email" type="email" required autocomplete="username" />
        </div>
        <div class="form-group">
          <label for="login-password">비밀번호</label>
          <input id="login-password" name="password" type="password" required autocomplete="current-password" />
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn--primary">로그인</button>
          <a href="#/signup" class="btn btn--ghost">회원가입</a>
        </div>
      </form>`;

    document.getElementById("form-login")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const email = String(fd.get("email") || "").trim();
      const password = String(fd.get("password") || "");
      const client = getClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        renderLogin(error.message, true);
        return;
      }
      navigate("#/");
    });
  }

  function renderSignup(msg, isError) {
    const alert =
      msg &&
      `<div class="alert ${isError ? "alert--error" : "alert--success"}">${escapeHtml(
        msg
      )}</div>`;
    $app().innerHTML = `
      <h1 class="page-title">회원가입</h1>
      <p class="page-desc">표시 이름은 게시글 목록에 함께 보입니다.</p>
      ${alert || ""}
      <form class="card" id="form-signup">
        <div class="form-group">
          <label for="su-name">표시 이름</label>
          <input id="su-name" name="display_name" type="text" required maxlength="40" placeholder="예: 김클로" />
        </div>
        <div class="form-group">
          <label for="su-email">이메일</label>
          <input id="su-email" name="email" type="email" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label for="su-password">비밀번호</label>
          <input id="su-password" name="password" type="password" required minlength="6" autocomplete="new-password" />
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn--primary">가입하기</button>
          <a href="#/login" class="btn btn--ghost">로그인</a>
        </div>
      </form>`;

    document.getElementById("form-signup")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const email = String(fd.get("email") || "").trim();
      const password = String(fd.get("password") || "");
      const display_name = String(fd.get("display_name") || "").trim();
      const client = getClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { display_name } },
      });
      if (error) {
        renderSignup(error.message, true);
        return;
      }
      if (data.user && !data.session) {
        renderSignup(
          "확인 메일을 발송했습니다. 이메일 인증 후 로그인해 주세요. (로컬 테스트 시 Supabase에서 이메일 확인을 끌 수 있습니다.)",
          false
        );
        return;
      }
      navigate("#/");
    });
  }

  function renderWrite(msg, isError) {
    if (!currentUser) {
      $app().innerHTML = `
        <div class="alert alert--info">글을 쓰려면 로그인이 필요합니다.</div>
        <p><a href="#/login">로그인</a></p>`;
      return;
    }
    const alert =
      msg &&
      `<div class="alert ${isError ? "alert--error" : "alert--success"}">${escapeHtml(
        msg
      )}</div>`;
    $app().innerHTML = `
      <h1 class="page-title">새 글 작성</h1>
      ${alert || ""}
      <form class="card" id="form-write">
        <div class="form-group">
          <label for="w-title">제목</label>
          <input id="w-title" name="title" type="text" required maxlength="200" />
        </div>
        <div class="form-group">
          <label for="w-body">내용</label>
          <textarea id="w-body" name="body" required></textarea>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn--primary">등록</button>
          <a href="#/" class="btn btn--ghost">취소</a>
        </div>
      </form>`;

    document.getElementById("form-write")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const title = String(fd.get("title") || "").trim();
      const body = String(fd.get("body") || "").trim();
      const client = getClient();
      const { error } = await client.from("posts").insert({
        title,
        body,
        user_id: currentUser.id,
      });
      if (error) {
        renderWrite(error.message, true);
        return;
      }
      navigate("#/");
    });
  }

  function renderEdit(id, msg, isError) {
    if (!currentUser) {
      $app().innerHTML = `<div class="alert alert--info">로그인이 필요합니다.</div>`;
      return;
    }
    const main = $app();
    main.innerHTML = '<p class="loading">불러오는 중…</p>';

    loadPost(id).then(({ error, post }) => {
      if (error === "not_found" || !post) {
        main.innerHTML =
          '<div class="alert alert--error">게시글을 찾을 수 없습니다.</div>';
        return;
      }
      if (error) {
        main.innerHTML =
          '<div class="alert alert--error">' + escapeHtml(error) + "</div>";
        return;
      }
      if (post.user_id !== currentUser.id) {
        main.innerHTML =
          '<div class="alert alert--error">본인이 작성한 글만 수정할 수 있습니다.</div>';
        return;
      }

      const alert =
        msg &&
        `<div class="alert ${isError ? "alert--error" : "alert--success"}">${escapeHtml(
          msg
        )}</div>`;

      main.innerHTML = `
        <h1 class="page-title">글 수정</h1>
        ${alert || ""}
        <form class="card" id="form-edit">
          <div class="form-group">
            <label for="e-title">제목</label>
            <input id="e-title" name="title" type="text" required maxlength="200" value="${escapeHtml(
              post.title
            )}" />
          </div>
          <div class="form-group">
            <label for="e-body">내용</label>
            <textarea id="e-body" name="body" required>${escapeHtml(post.body)}</textarea>
          </div>
          <div class="btn-row">
            <button type="submit" class="btn btn--primary">저장</button>
            <a href="#/post/${escapeHtml(post.id)}" class="btn btn--ghost">취소</a>
          </div>
        </form>`;

      document.getElementById("form-edit")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const title = String(fd.get("title") || "").trim();
        const body = String(fd.get("body") || "").trim();
        const client = getClient();
        const { error: upErr } = await client
          .from("posts")
          .update({ title, body })
          .eq("id", post.id);
        if (upErr) {
          renderEdit(id, upErr.message, true);
          return;
        }
        navigate("#/post/" + post.id);
      });
    });
  }

  async function renderRoute() {
    await refreshUser();
    renderNav();

    if (!getClient()) {
      renderConfigMissing();
      return;
    }

    const route = parseRoute();

    if (!currentUser && ["list", "detail"].indexOf(route.name) === -1) {
      if (route.name === "write" || route.name === "edit") {
        $app().innerHTML = `
          <div class="alert alert--info">이 페이지는 로그인 후 이용할 수 있습니다.</div>
          <p><a href="#/login">로그인</a> · <a href="#/signup">회원가입</a></p>`;
        return;
      }
    }

    if (route.name === "list") {
      if (!currentUser) {
        $app().innerHTML = `
          <div class="alert alert--info">게시글 목록을 보려면 로그인해 주세요.</div>
          <p class="btn-row">
            <a href="#/login" class="btn btn--primary">로그인</a>
            <a href="#/signup" class="btn btn--ghost">회원가입</a>
          </p>`;
        return;
      }
      renderList();
      return;
    }

    if (route.name === "detail") {
      if (!currentUser) {
        $app().innerHTML = `
          <div class="alert alert--info">게시글을 보려면 로그인해 주세요.</div>
          <p><a href="#/login">로그인</a></p>`;
        return;
      }
      renderDetail(route.id);
      return;
    }

    if (route.name === "login") {
      renderLogin();
      return;
    }
    if (route.name === "signup") {
      renderSignup();
      return;
    }
    if (route.name === "write") {
      renderWrite();
      return;
    }
    if (route.name === "edit") {
      renderEdit(route.id);
      return;
    }

    navigate("#/");
  }

  function init() {
    window.addEventListener("hashchange", () => renderRoute());

    const client = getClient();
    if (!client) {
      renderConfigMissing();
      renderNav();
      return;
    }

    authSub = client.auth.onAuthStateChange(() => {
      renderRoute();
    });

    renderRoute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
