import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { signIn } from "../lib/api";
import { useSession } from "../lib/session";
import { PATHS } from "../routes/paths";

export default function LoginPage() {
  const { user, profile, loading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const { error: authError } = await signIn({ email, password });
      if (authError) throw authError;
      navigate(location.state?.from || PATHS.home, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <h2>로그인</h2>
      <p className="small">동네 중고거래 MVP에 들어가려면 먼저 로그인하세요.</p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="submit" disabled={busy}>
            {busy ? "확인 중..." : "로그인"}
          </button>
          <button type="button" className="ghost-btn" onClick={() => navigate(PATHS.signup)}>
            회원가입
          </button>
        </div>
      </form>
    </section>
  );
}
