import { json, requireUser, withClient } from "../../_shared.js";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req);
    const productId = req.query?.productId || new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname.split("/").at(-2);

    return await withClient(async (client) => {
      if (req.method !== "POST") return json(res, 405, { error: "지원하지 않는 요청입니다." });

      const existing = await client.query(
        "select id from public.likes where user_id = $1 and product_id = $2 limit 1",
        [user.id, productId]
      );
      if (existing.rows[0]) {
        await client.query("delete from public.likes where id = $1", [existing.rows[0].id]);
        return json(res, 200, { liked: false });
      }

      await client.query("insert into public.likes (user_id, product_id) values ($1, $2)", [user.id, productId]);
      return json(res, 200, { liked: true });
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
