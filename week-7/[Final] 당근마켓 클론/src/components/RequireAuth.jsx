import { Navigate, Outlet, useLocation } from "react-router-dom";
import { PATHS } from "../routes/paths";
import { useSession } from "../lib/session";

export default function RequireAuth() {
  const { user, profile, loading } = useSession();
  const location = useLocation();

  if (loading) return <p className="state">불러오는 중...</p>;
  if (!user) return <Navigate to={PATHS.login} replace state={{ from: location.pathname }} />;
  if (!profile?.neighborhood && location.pathname !== PATHS.neighborhood) {
    return <Navigate to={PATHS.neighborhood} replace />;
  }

  return <Outlet />;
}
