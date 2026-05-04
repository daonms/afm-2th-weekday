import { json, requireUser, withClient } from "../../_shared.js";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req);
    const roomId = req.query?.roomId || new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname.split("/").at(-1);
    return await withClient(async (client) => {
      const room = await client.query("select * from public.chat_rooms where id = $1 limit 1", [roomId]);
      const row = room.rows[0];
      if (!row) return json(res, 404, { error: "채팅방을 찾을 수 없습니다." });
      if (row.buyer_id !== user.id && row.seller_id !== user.id) {
        return json(res, 403, { error: "채팅방 접근 권한이 없습니다." });
      }
      return json(res, 200, { room: row });
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
