import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteProduct, fetchMessages, getCurrentUserId, getMyLike, getOrCreateRoom, getProfileById, getProductById, sendMessage, toggleLike } from "../lib/api";
import { PATHS } from "../routes/paths";

const POLL_MS = 4000;

function getImages(product) {
  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) return product.image_urls;
  if (product.image_url) return [product.image_url];
  return [];
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    getCurrentUserId().then(setUserId).catch(() => setUserId(""));
  }, []);

  useEffect(() => {
    getProductById(id)
      .then((item) => {
        setProduct(item);
        return getProfileById(item.seller_id);
      })
      .then((profile) => setSeller(profile))
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    getMyLike(product.id)
      .then((row) => setLiked(Boolean(row)))
      .catch(() => setLiked(false));
  }, [product]);

  async function reloadMessages(targetRoomId) {
    const list = await fetchMessages(targetRoomId);
    setMessages(list);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startInquiry() {
    if (!product) return;
    setError("");
    try {
      const createdRoomId = await getOrCreateRoom(product);
      setRoomId(createdRoomId);
      await reloadMessages(createdRoomId);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        reloadMessages(createdRoomId).catch(() => {});
      }, POLL_MS);
    } catch (e) {
      setError(e.message);
    }
  }

  async function onSend(event) {
    event.preventDefault();
    if (!roomId || !draft.trim()) return;

    try {
      await sendMessage(roomId, draft.trim());
      setDraft("");
      await reloadMessages(roomId);
    } catch (e) {
      setError(e.message);
    }
  }

  async function onToggleLike() {
    if (!product) return;
    try {
      const next = await toggleLike(product.id);
      setLiked(next);
    } catch (e) {
      setError(e.message);
    }
  }

  async function onDelete() {
    if (!window.confirm("이 상품을 삭제할까요?")) return;
    try {
      await deleteProduct(product.id);
      navigate(PATHS.home, { replace: true });
    } catch (e) {
      setError(e.message);
    }
  }

  const images = useMemo(() => (product ? getImages(product) : []), [product]);
  const isOwner = product && userId === product.seller_id;

  if (!product) return <p>로딩 중...</p>;

  return (
    <section className="stack">
      <div className="panel">
        <div className="row between">
          <div>
            <h2>{product.title}</h2>
            <p className="price">{Number(product.price).toLocaleString()}원</p>
          </div>
          <div className="row">
            {!isOwner && (
              <button type="button" className={liked ? "like-btn active" : "like-btn"} onClick={onToggleLike}>
                관심
              </button>
            )}
            {isOwner && (
              <>
                <Link to={PATHS.productEdit(product.id)} className="ghost-btn">
                  수정
                </Link>
                <button type="button" className="ghost-btn" onClick={onDelete}>
                  삭제
                </button>
              </>
            )}
          </div>
        </div>

        <p className="small">
          판매자: {seller?.nickname || seller?.email || product.seller_id} · {product.neighborhood}
        </p>
        <p>{product.description}</p>

        {images.length > 0 && (
          <div className="image-row">
            {images.map((url) => (
              <img key={url} src={url} alt={product.title} className="detail-image" />
            ))}
          </div>
        )}
      </div>

      {!isOwner && (
        <aside className="chat-panel">
          <div className="row between">
            <h3>문의 채팅</h3>
            {!roomId && (
              <button type="button" onClick={startInquiry}>
                문의 시작
              </button>
            )}
          </div>

          {roomId ? (
            <>
              <div className="messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={msg.sender_id === userId ? "msg mine" : "msg"}>
                    <p>{msg.content}</p>
                    <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
                {messages.length === 0 && <p className="small">메시지가 없습니다.</p>}
              </div>

              <form onSubmit={onSend} className="chat-form">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="메시지를 입력하세요" />
                <button type="submit">전송</button>
              </form>
              <p className="small">갱신 방식: polling ({POLL_MS / 1000}초)</p>
            </>
          ) : (
            <p className="small">문의 시작을 누르면 채팅방이 열립니다.</p>
          )}
        </aside>
      )}

      {isOwner && <p className="small">내 상품이라 문의 채팅은 숨깁니다.</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
