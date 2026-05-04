import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyChatRooms } from "../lib/api";
import { PATHS } from "../routes/paths";

function roomLabel(room) {
  const productTitle = room.product?.title || "상품";
  const partnerName = room.partner?.nickname || room.partner?.email || "상대방";
  return `${productTitle} · ${partnerName}`;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listMyChatRooms().then(setRooms).catch((e) => setError(e.message));
  }, []);

  return (
    <section>
      <h2>채팅</h2>
      {error && <p className="error">{error}</p>}
      <div className="stack">
        {rooms.map((room) => (
          <Link key={room.id} className="room-card" to={PATHS.chatRoom(room.id)}>
            <strong>{roomLabel(room)}</strong>
            <span className="small">{new Date(room.created_at).toLocaleString()}</span>
          </Link>
        ))}
        {rooms.length === 0 && <p className="small">아직 채팅방이 없습니다.</p>}
      </div>
    </section>
  );
}
