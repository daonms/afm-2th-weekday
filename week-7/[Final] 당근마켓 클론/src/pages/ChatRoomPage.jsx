import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchMessages, getRoom, sendMessage } from "../lib/api";
import { PATHS } from "../routes/paths";

const POLL_MS = 4000;

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  async function reload() {
    if (!roomId) return;
    const [roomData, msgData] = await Promise.all([getRoom(roomId), fetchMessages(roomId)]);
    setRoom(roomData);
    setMessages(msgData);
  }

  useEffect(() => {
    reload().catch((e) => setError(e.message));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      reload().catch(() => {});
    }, POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await sendMessage(roomId, draft.trim());
      setDraft("");
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="row between">
        <div>
          <h2>{room?.product?.title || "채팅방"}</h2>
          <p className="small">{room?.id ? room.id : "불러오는 중..."}</p>
        </div>
        <Link to={PATHS.chats} className="ghost-btn">
          목록
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="chat-panel">
        <p className="small">상품 문의 전용 방입니다.</p>
        <div className="messages">
          {messages.map((msg) => (
            <div key={msg.id} className="msg">
              <p>{msg.content}</p>
              <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
        <form className="chat-form" onSubmit={onSubmit}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="메시지를 입력하세요" />
          <button type="submit">전송</button>
        </form>
        <p className="small">갱신 방식: polling ({POLL_MS / 1000}초)</p>
      </div>
    </section>
  );
}
