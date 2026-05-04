import { badRequest, ensureProfile, json, readBody, requireUser, withClient } from "../_shared.js";

export default async function handler(req, res) {
  try {
    const user = await requireUser(req);
    return await withClient(async (client) => {
      if (req.method === "GET") {
        const profile = await ensureProfile(client, user);
        return json(res, 200, { profile });
      }

      if (req.method === "PUT" || req.method === "PATCH") {
        const body = await readBody(req);
        const neighborhood = String(body.neighborhood || "").trim();
        if (!neighborhood) return badRequest(res, "동네를 입력해 주세요.");
        await ensureProfile(client, user);
        const updated = await client.query(
          `update public.profiles
             set neighborhood = $2,
                 updated_at = now()
           where id = $1
           returning *`,
          [user.id, neighborhood]
        );
        return json(res, 200, { profile: updated.rows[0] });
      }

      return badRequest(res, "지원하지 않는 요청입니다.");
    });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
}
