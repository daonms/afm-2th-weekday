import { badRequest, forbidden, firstImageUrl, json, mapProduct, readBody, requireUser, withClient } from "../_shared.js";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req);
    const id = req.query?.id || new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname.split("/").pop();

    return await withClient(async (client) => {
      const result = await client.query("select * from public.products where id = $1 limit 1", [id]);
      const product = result.rows[0];
      if (!product) return json(res, 404, { error: "상품을 찾을 수 없습니다." });

      if (req.method === "GET") {
        return json(res, 200, { product: mapProduct(product) });
      }

      if (req.method === "PUT" || req.method === "PATCH") {
        if (product.seller_id !== user.id) return forbidden(res, "본인 상품만 수정할 수 있습니다.");
        const body = await readBody(req);
        const title = String(body.title || "").trim();
        const description = String(body.description || "").trim();
        const price = Number(body.price);
        const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.slice(0, 3) : [];
        if (!title || !description || Number.isNaN(price)) {
          return badRequest(res, "상품 정보를 다시 확인해 주세요.");
        }

        const updated = await client.query(
          `update public.products
              set title = $2,
                  description = $3,
                  price = $4,
                  image_url = $5,
                  image_urls = $6::jsonb,
                  updated_at = now()
            where id = $1
            returning id`,
          [id, title, description, price, firstImageUrl(imageUrls, product.image_url), JSON.stringify(imageUrls)]
        );
        return json(res, 200, { id: updated.rows[0].id });
      }

      if (req.method === "DELETE") {
        if (product.seller_id !== user.id) return forbidden(res, "본인 상품만 삭제할 수 있습니다.");
        await client.query("delete from public.products where id = $1", [id]);
        return json(res, 200, { ok: true });
      }

      return badRequest(res, "지원하지 않는 요청입니다.");
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
