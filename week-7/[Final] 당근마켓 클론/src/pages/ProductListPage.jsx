import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { listProducts } from "../lib/api";
import { useSession } from "../lib/session";
import { PATHS } from "../routes/paths";

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const { profile } = useSession();

  useEffect(() => {
    if (!profile?.neighborhood) return;
    listProducts(profile.neighborhood).then(setProducts).catch((e) => setError(e.message));
  }, [profile?.neighborhood]);

  return (
    <section>
      <div className="row between">
        <div>
          <h2>상품 목록</h2>
          <p className="small">{profile?.neighborhood ? `${profile.neighborhood} 동네 상품` : "동네를 먼저 설정해 주세요."}</p>
        </div>
        <Link to={PATHS.productNew} className="ghost-btn">
          상품 등록
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
