import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { signUp } from "../lib/api";
import { useSession } from "../lib/session";
import { PATHS } from "../routes/paths";

export default function SignupPage() {
  const { user, profile, loading } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to={profile?.neighborhood ? PATHS.home : PATHS.neighborhood} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data, error: authError } = await signUp({ email, password, nickname });
      if (authError) throw authError;
      if (data?.session) {
        navigate(PATHS.neighborhood, { replace: true });
      } else {
        setError("확인 메일을 보냈습니다. 이메일 인증 후 다시 로그인해 주세요.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <h2>회원가입</h2>
      <p className="small">이메일, 비밀번호, 닉네임만 있으면 시작할 수 있어요.</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          닉네임
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="예: 이희석" />
        </label>
        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy ? "가입 중..." : "가입하기"}
          </button>
          <button type="button" className="ghost-btn" onClick={() => navigate(PATHS.login)}>
            로그인
          </button>
        </div>
      </form>
    </section>
  );
}
