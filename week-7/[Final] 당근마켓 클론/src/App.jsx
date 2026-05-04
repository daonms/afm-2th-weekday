import { Link, Navigate, Outlet, Route, Routes } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import RequireAuth from "./components/RequireAuth";
import { useSession } from "./lib/session";
import { PATHS } from "./routes/paths";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NeighborhoodPage from "./pages/NeighborhoodPage";
import ProductListPage from "./pages/ProductListPage";
import ProductFormPage from "./pages/ProductFormPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ChatListPage from "./pages/ChatListPage";
import ChatRoomPage from "./pages/ChatRoomPage";
import MyPage from "./pages/MyPage";

function Shell() {
  const { user, profile, signOut } = useSession();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to={PATHS.home} className="brand">
          당근마켓 클론
        </Link>
        <div className="topbar-right">
          {user && <span className="user-chip">{profile?.nickname || user.email}</span>}
          {user && (
            <button className="ghost-btn" type="button" onClick={signOut}>
              로그아웃
            </button>
          )}
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path={PATHS.login} element={<LoginPage />} />
      <Route path={PATHS.signup} element={<SignupPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<Shell />}>
          <Route path={PATHS.neighborhood} element={<NeighborhoodPage />} />
          <Route path={PATHS.home} element={<ProductListPage />} />
          <Route path={PATHS.productNew} element={<ProductFormPage mode="create" />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/products/:id/edit" element={<ProductFormPage mode="edit" />} />
          <Route path={PATHS.chats} element={<ChatListPage />} />
          <Route path="/chats/:roomId" element={<ChatRoomPage />} />
          <Route path={PATHS.me} element={<MyPage />} />
          <Route path="*" element={<Navigate to={PATHS.home} replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={PATHS.home} replace />} />
    </Routes>
  );
}
