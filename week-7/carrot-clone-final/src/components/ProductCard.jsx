import { Link } from "react-router-dom";

function getThumb(product) {
  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) return product.image_urls[0];
  return product.image_url || "";
}

export default function ProductCard({ product }) {
  const thumb = getThumb(product);

  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`}>
        {thumb ? <img src={thumb} alt={product.title} className="thumb" /> : <div className="thumb empty">No Image</div>}
        <h3>{product.title}</h3>
      </Link>
      <p>{Number(product.price).toLocaleString()}원</p>
      <p className="small">{product.neighborhood}</p>
    </article>
  );
}
