import { badRequest, json, readBody, requireUser, withClient } from "../../../_shared.js";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req);
    const roomId = req.query?.roomId || new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname.split("/").at(-2);
    return await withClient(async (client) => {
      const room = await client.query("select * from public.chat_rooms where id = $1 limit 1", [roomId]);
      const row = room.rows[0];
      if (!row) return json(res, 404, { error: "채팅방을 찾을 수 없습니다." });
      if (row.buyer_id !== user.id && row.seller_id !== user.id) {
        return json(res, 403, { error: "채팅방 접근 권한이 없습니다." });
      }

      if (req.method === "GET") {
        const messages = await client.query(
          `select id, content, sender_id, created_at
             from public.messages
            where room_id = $1
            order by created_at asc`,
          [roomId]
        );
        return json(res, 200, { messages: messages.rows });
      }

      if (req.method === "POST") {
        const body = await readBody(req);
        const content = String(body.content || "").trim();
        if (!content) return badRequest(res, "메시지를 입력해 주세요.");
        const inserted = await client.query(
          `insert into public.messages (room_id, sender_id, content)
           values ($1, $2, $3)
           returning id`,
          [roomId, user.id, content]
        );
        return json(res, 201, { id: inserted.rows[0].id });
      }

      return badRequest(res, "지원하지 않는 요청입니다.");
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
