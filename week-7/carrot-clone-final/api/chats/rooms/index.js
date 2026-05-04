import { badRequest, json, readBody, requireUser, withClient } from "../../_shared.js";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req);
    return await withClient(async (client) => {
      if (req.method === "GET") {
        const roomRows = await client.query(
          `select cr.id, cr.product_id, cr.buyer_id, cr.seller_id, cr.created_at,
                  p.title, p.price, p.image_url, p.image_urls, p.neighborhood, p.status,
                  buyer.nickname as buyer_nickname, buyer.email as buyer_email, buyer.neighborhood as buyer_neighborhood,
                  seller.nickname as seller_nickname, seller.email as seller_email, seller.neighborhood as seller_neighborhood
             from public.chat_rooms cr
             left join public.products p on p.id = cr.product_id
             left join public.profiles buyer on buyer.id = cr.buyer_id
             left join public.profiles seller on seller.id = cr.seller_id
            where cr.buyer_id = $1 or cr.seller_id = $1
            order by cr.created_at desc`,
          [user.id]
        );
        const rooms = roomRows.rows.map((row) => ({
          id: row.id,
          product_id: row.product_id,
          buyer_id: row.buyer_id,
          seller_id: row.seller_id,
          created_at: row.created_at,
          product: row.title
            ? {
                id: row.product_id,
                title: row.title,
                price: row.price,
                image_url: row.image_urls?.[0] || row.image_url || null,
                image_urls: row.image_urls || [],
                neighborhood: row.neighborhood,
                status: row.status,
              }
            : null,
          buyer: row.buyer_nickname
            ? { id: row.buyer_id, nickname: row.buyer_nickname, email: row.buyer_email, neighborhood: row.buyer_neighborhood }
            : null,
          seller: row.seller_nickname
            ? { id: row.seller_id, nickname: row.seller_nickname, email: row.seller_email, neighborhood: row.seller_neighborhood }
            : null,
          partner:
            row.buyer_id === user.id
              ? row.seller_nickname
                ? { id: row.seller_id, nickname: row.seller_nickname, email: row.seller_email, neighborhood: row.seller_neighborhood }
                : null
              : row.buyer_nickname
                ? { id: row.buyer_id, nickname: row.buyer_nickname, email: row.buyer_email, neighborhood: row.buyer_neighborhood }
                : null,
        }));
        return json(res, 200, { rooms });
      }

      if (req.method === "POST") {
        const body = await readBody(req);
        const productId = body.productId;
        if (!productId) return badRequest(res, "상품 ID가 필요합니다.");

        const productRow = await client.query("select id, seller_id from public.products where id = $1 limit 1", [productId]);
        const product = productRow.rows[0];
        if (!product) return json(res, 404, { error: "상품을 찾을 수 없습니다." });
        if (product.seller_id === user.id) return badRequest(res, "판매자는 본인 상품에 문의할 수 없습니다.");

        const found = await client.query(
          "select id from public.chat_rooms where product_id = $1 and buyer_id = $2 limit 1",
          [productId, user.id]
        );
        if (found.rows[0]) return json(res, 200, { id: found.rows[0].id });

        const inserted = await client.query(
          `insert into public.chat_rooms (product_id, buyer_id, seller_id)
           values ($1, $2, $3)
           returning id`,
          [productId, user.id, product.seller_id]
        );
        return json(res, 201, { id: inserted.rows[0].id });
      }

      return badRequest(res, "지원하지 않는 요청입니다.");
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
