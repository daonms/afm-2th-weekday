import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createProduct, getProductById, updateProduct, uploadProductImages } from "../lib/api";

export default function ProductFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    getProductById(id)
      .then((product) => {
        setTitle(product.title || "");
        setDescription(product.description || "");
        setPrice(product.price ?? "");
        const urls = Array.isArray(product.image_urls)
          ? product.image_urls
          : product.image_url
            ? [product.image_url]
            : [];
        setExistingImages(urls.slice(0, 3));
      })
      .catch((e) => setError(e.message));
  }, [id, isEdit]);

  const totalCount = useMemo(() => existingImages.length + newFiles.length, [existingImages, newFiles]);

  function onFileChange(event) {
    const files = Array.from(event.target.files || []);
    if (existingImages.length + files.length > 3) {
      setError("이미지는 최대 3장까지 등록할 수 있습니다.");
      return;
    }
    setError("");
    setNewFiles(files);
  }

  function removeExisting(index) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const uploaded = await uploadProductImages(newFiles);
      const imageUrls = [...existingImages, ...uploaded].slice(0, 3);

      if (isEdit) {
        await updateProduct(id, { title, description, price, imageUrls });
        navigate(`/products/${id}`);
      } else {
        const created = await createProduct({ title, description, price, imageUrls });
        navigate(`/products/${created.id}`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>{isEdit ? "상품 수정" : "상품 등록"}</h2>
      <form className="form" onSubmit={onSubmit}>
        <label>
          제목
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          설명
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
        </label>
        <label>
          가격
          <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </label>
        <label>
          이미지 (최대 3장)
          <input type="file" accept="image/*" multiple onChange={onFileChange} />
        </label>

        <div className="small">현재 이미지 수: {totalCount} / 3</div>

        {existingImages.length > 0 && (
          <div className="image-row">
            {existingImages.map((url, idx) => (
              <div key={url} className="image-wrap">
                <img src={url} alt={`existing-${idx}`} className="inline-image" />
                <button type="button" onClick={() => removeExisting(idx)}>제거</button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "저장 중..." : "저장"}</button>
      </form>
    </section>
  );
}
