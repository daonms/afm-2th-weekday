import { json, requireUser, withClient } from "../_shared.js";

export default async function handler(req, res) {
  try {
    await requireUser(req);
    const id = req.query?.id || new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname.split("/").pop();
    return await withClient(async (client) => {
      const found = await client.query(
        `select id, email, nickname, neighborhood, created_at, updated_at
           from public.profiles
          where id = $1
          limit 1`,
        [id]
      );
      return json(res, 200, { profile: found.rows[0] || null });
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
