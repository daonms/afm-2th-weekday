function normalizeProductImages(product = {}) {
  const seen = new Set();
  const out = [];

  const add = (value) => {
    if (typeof value !== "string") return;
    const url = value.trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  };

  const raw = product.image_urls;
  if (Array.isArray(raw)) {
    raw.forEach(add);
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) parsed.forEach(add);
      else add(raw);
    } catch {
      add(raw);
    }
  }

  add(product.image_url);
  return out.slice(0, 3);
}

function sanitizeChatMessage(message) {
  if (typeof message !== "string") return null;
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 500);
}

module.exports = {
  normalizeProductImages,
  sanitizeChatMessage,
};
