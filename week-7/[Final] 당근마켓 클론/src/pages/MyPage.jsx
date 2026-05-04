import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyLikedProducts, getMyProducts, updateMyNeighborhood } from "../lib/api";
import { setSavedNeighborhood } from "../lib/neighborhoodStorage";
import { useSession } from "../lib/session";
import { PATHS } from "../routes/paths";

export default function MyPage() {
  const { user, profile, refreshProfile, signOut } = useSession();
  const [myProducts, setMyProducts] = useState([]);
  const [likes, setLikes] = useState([]);
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setNeighborhood(profile?.neighborhood || "");
  }, [profile?.neighborhood]);

  useEffect(() => {
    getMyProducts().then(setMyProducts).catch((e) => setError(e.message));
    getMyLikedProducts().then(setLikes).catch((e) => setError(e.message));
  }, []);

  async function saveNeighborhood() {
    try {
      await updateMyNeighborhood(neighborhood);
      setSavedNeighborhood(neighborhood);
      await refreshProfile();
    } catch (err) {
      setSavedNeighborhood(neighborhood);
      await refreshProfile().catch(() => {});
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>마이페이지</h2>
      {error && <p className="error">{error}</p>}
      <div className="stack">
        <div className="panel">
          <p className="small">이메일</p>
          <strong>{user?.email}</strong>
          <p className="small">닉네임</p>
          <strong>{profile?.nickname || "-"}</strong>
          <p className="small">동네</p>
          <div className="row">
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="동네 입력" />
            <button type="button" onClick={saveNeighborhood}>
              저장
            </button>
          </div>
          <div className="row">
            <Link to={PATHS.neighborhood} className="ghost-btn">
              동네 수정
            </Link>
            <button type="button" className="ghost-btn" onClick={signOut}>
              로그아웃
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>내가 올린 상품</h3>
          <div className="stack">
            {myProducts.map((product) => (
              <Link key={product.id} to={PATHS.productDetail(product.id)} className="room-card">
                <strong>{product.title}</strong>
                <span className="small">{Number(product.price).toLocaleString()}원 · {product.neighborhood}</span>
              </Link>
            ))}
            {myProducts.length === 0 && <p className="small">등록한 상품이 없습니다.</p>}
          </div>
        </div>

        <div className="panel">
          <h3>관심 상품</h3>
          <div className="stack">
            {likes.map((product) => (
              <Link key={product.id} to={PATHS.productDetail(product.id)} className="room-card">
                <strong>{product.title}</strong>
                <span className="small">{Number(product.price).toLocaleString()}원</span>
              </Link>
            ))}
            {likes.length === 0 && <p className="small">관심 상품이 없습니다.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
