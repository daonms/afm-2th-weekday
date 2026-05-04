import { json, mapProduct, requireUser, withClient } from "../../_shared.js";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req);
    return await withClient(async (client) => {
      const likes = await client.query(
        `select p.*
           from public.likes l
           join public.products p on p.id = l.product_id
          where l.user_id = $1
          order by l.created_at desc`,
        [user.id]
      );
      return json(res, 200, { products: likes.rows.map(mapProduct) });
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
