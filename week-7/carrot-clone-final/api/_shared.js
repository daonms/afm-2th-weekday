import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Pool } = pg;

export const pool =
  globalThis.__carrotPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

if (!globalThis.__carrotPool) globalThis.__carrotPool = pool;

export const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function badRequest(res, message) {
  json(res, 400, { error: message });
}

export function unauthorized(res, message = "로그인이 필요합니다.") {
  json(res, 401, { error: message });
}

export function forbidden(res, message = "권한이 없습니다.") {
  json(res, 403, { error: message });
}

export function notFound(res, message = "찾을 수 없습니다.") {
  json(res, 404, { error: message });
}

export async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

export async function requireUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) throw Object.assign(new Error("로그인이 필요합니다."), { status: 401 });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw Object.assign(new Error("로그인이 필요합니다."), { status: 401 });
  }

  return data.user;
}

export function firstImageUrl(imageUrls, imageUrl) {
  if (Array.isArray(imageUrls) && imageUrls.length > 0) return imageUrls[0];
  return imageUrl || null;
}

export function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    neighborhood: row.neighborhood,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapProduct(row) {
  if (!row) return null;
  return {
    ...row,
    image_url: firstImageUrl(row.image_urls, row.image_url),
  };
}

export async function withClient(fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function ensureProfile(client, user) {
  const existing = await client.query("select * from public.profiles where id = $1 limit 1", [user.id]);
  if (existing.rows[0]) return existing.rows[0];

  const nickname =
    String(user.user_metadata?.nickname || "").trim() ||
    (user.email ? user.email.split("@")[0] : "회원");

  const inserted = await client.query(
    `insert into public.profiles (id, email, nickname, neighborhood)
     values ($1, $2, $3, null)
     on conflict (id) do update
       set email = excluded.email,
           nickname = excluded.nickname,
           updated_at = now()
     returning *`,
    [user.id, user.email || "", nickname]
  );

  return inserted.rows[0];
}

export async function assertParticipant(client, roomId, userId) {
  const room = await client.query("select * from public.chat_rooms where id = $1 limit 1", [roomId]);
  const row = room.rows[0];
  if (!row) throw Object.assign(new Error("채팅방을 찾을 수 없습니다."), { status: 404 });
  if (row.buyer_id !== userId && row.seller_id !== userId) {
    throw Object.assign(new Error("채팅방 접근 권한이 없습니다."), { status: 403 });
  }
  return row;
}
