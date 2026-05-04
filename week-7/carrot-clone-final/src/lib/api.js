import { supabase, STORAGE_BUCKET } from "./supabase";

function authUserOrThrow() {
  return supabase.auth.getUser().then(({ data, error }) => {
    if (error) throw error;
    if (!data.user) throw new Error("로그인된 사용자가 없습니다.");
    return data.user;
  });
}

function normalizeImagePayload(imageUrls) {
  const urls = (imageUrls || []).slice(0, 3);
  return {
    image_url: urls[0] || null,
    image_urls: urls,
  };
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("로그인된 사용자가 없습니다.");
  return token;
}

async function apiRequest(path, options = {}) {
  const token = await getAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api/${String(path).replace(/^\/+/, "")}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "요청에 실패했습니다.");
  }
  return data;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

export async function signUp({ email, password, nickname }) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });
}

export async function signIn({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getMyProfile() {
  const data = await apiRequest("profile/me");
  return data.profile ?? null;
}

export async function getProfileById(id) {
  const data = await apiRequest(`profile/${id}`);
  return data.profile ?? null;
}

export async function ensureMyProfile() {
  return getMyProfile();
}

export async function updateMyNeighborhood(neighborhood) {
  const data = await apiRequest("profile/me", {
    method: "PUT",
    body: JSON.stringify({ neighborhood }),
  });
  return data.profile;
}

export async function listProducts(neighborhood) {
  const query = neighborhood ? `?neighborhood=${encodeURIComponent(neighborhood)}` : "";
  const data = await apiRequest(`products${query}`);
  return data.products ?? [];
}

export async function getProductById(id) {
  const data = await apiRequest(`products/${id}`);
  return data.product;
}

export async function uploadProductImages(files) {
  if (!files || files.length === 0) return [];
  if (files.length > 3) throw new Error("이미지는 최대 3장까지 업로드 가능합니다.");

  const user = await authUserOrThrow();
  const uploadedUrls = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, {
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

export async function createProduct({ title, description, price, imageUrls }) {
  const payload = {
    title,
    description,
    price,
    ...normalizeImagePayload(imageUrls),
  };
  const data = await apiRequest("products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.id;
}

export async function updateProduct(id, { title, description, price, imageUrls }) {
  await apiRequest(`products/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      title,
      description,
      price,
      ...normalizeImagePayload(imageUrls),
    }),
  });
}

export async function deleteProduct(id) {
  await apiRequest(`products/${id}`, {
    method: "DELETE",
  });
}

export async function getMyProducts() {
  const data = await apiRequest("products?mine=1");
  return data.products ?? [];
}

export async function getMyLike(productId) {
  const data = await apiRequest(`likes/${productId}`);
  return data.like ?? null;
}

export async function toggleLike(productId) {
  const data = await apiRequest(`likes/${productId}/toggle`, {
    method: "POST",
  });
  return Boolean(data.liked);
}

export async function getMyLikedProducts() {
  const data = await apiRequest("likes/me/products");
  return data.products ?? [];
}

export async function getOrCreateRoom(product) {
  if (!product?.id) throw new Error("상품 정보가 없습니다.");
  const data = await apiRequest("chats/rooms", {
    method: "POST",
    body: JSON.stringify({ productId: product.id }),
  });
  if (!data.id) throw new Error("채팅방을 만들 수 없습니다.");
  return data.id;
}

export async function getRoom(roomId) {
  const data = await apiRequest(`chats/rooms/${roomId}`);
  if (!data.room) throw new Error("채팅방을 찾을 수 없습니다.");
  return data.room;
}

export async function listMyChatRooms() {
  const data = await apiRequest("chats/rooms");
  return data.rooms ?? [];
}

export async function fetchMessages(roomId) {
  const data = await apiRequest(`chats/rooms/${roomId}/messages`);
  return data.messages ?? [];
}

export async function sendMessage(roomId, content) {
  await apiRequest(`chats/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function getCurrentUserId() {
  const user = await authUserOrThrow();
  return user.id;
}
