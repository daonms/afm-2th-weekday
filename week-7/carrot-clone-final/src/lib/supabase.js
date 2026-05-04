import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase env 값이 없습니다. .env를 확인하세요.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "product-images";
