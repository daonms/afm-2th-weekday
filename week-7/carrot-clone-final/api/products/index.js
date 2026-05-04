import { badRequest, ensureProfile, firstImageUrl, json, mapProduct, readBody, requireUser, withClient } from "../_shared.js";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req);
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    return await withClient(async (client) => {
      if (req.method === "GET") {
        const neighborhood = url.searchParams.get("neighborhood") || "";
        const mine = url.searchParams.get("mine") === "1";
        const { rows } = neighborhood
          ? await client.query(
              `select id, title, price, image_url, image_urls, created_at, neighborhood, seller_id, status
                 from public.products
                where neighborhood = $1
                order by created_at desc`,
              [neighborhood]
            )
          : mine
            ? await client.query(
                `select id, title, price, image_url, image_urls, created_at, neighborhood, seller_id, status
                   from public.products
                  where seller_id = $1
                  order by created_at desc`,
                [user.id]
              )
            : await client.query(
                `select id, title, price, image_url, image_urls, created_at, neighborhood, seller_id, status
                   from public.products
                  order by created_at desc`
              );
        return json(res, 200, { products: rows.map(mapProduct) });
      }

      if (req.method === "POST") {
        const body = await readBody(req);
        const profile = await ensureProfile(client, user);
        const title = String(body.title || "").trim();
        const description = String(body.description || "").trim();
        const price = Number(body.price);
        const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.slice(0, 3) : [];

        if (!profile.neighborhood) return badRequest(res, "동네를 먼저 입력해 주세요.");
        if (!title || !description || Number.isNaN(price)) {
          return badRequest(res, "상품 정보를 다시 확인해 주세요.");
        }

        const inserted = await client.query(
          `insert into public.products
             (seller_id, title, description, price, image_url, image_urls, neighborhood, status)
           values
             ($1, $2, $3, $4, $5, $6::jsonb, $7, 'selling')
           returning id`,
          [
            user.id,
            title,
            description,
            price,
            firstImageUrl(imageUrls, null),
            JSON.stringify(imageUrls),
            profile.neighborhood,
          ]
        );
        return json(res, 201, { id: inserted.rows[0].id });
      }

      return badRequest(res, "지원하지 않는 요청입니다.");
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
