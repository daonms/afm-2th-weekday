import { NavLink } from "react-router-dom";
import { PATHS } from "../routes/paths";

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="하단 탐색">
      <NavLink to={PATHS.home} end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
        홈
      </NavLink>
      <NavLink to={PATHS.chats} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
        채팅
      </NavLink>
      <NavLink to={PATHS.me} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
        마이
      </NavLink>
    </nav>
  );
}
