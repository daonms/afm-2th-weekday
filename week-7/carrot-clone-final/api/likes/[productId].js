import { json, requireUser, withClient } from "../_shared.js";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req);
    const productId = req.query?.productId || new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname.split("/").pop();

    return await withClient(async (client) => {
      if (req.method === "GET") {
        const existing = await client.query(
          "select id from public.likes where user_id = $1 and product_id = $2 limit 1",
          [user.id, productId]
        );
        return json(res, 200, { like: existing.rows[0] || null });
      }
      return json(res, 405, { error: "지원하지 않는 요청입니다." });
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
