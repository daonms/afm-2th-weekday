const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeProductImages,
  sanitizeChatMessage,
} = require("../shop-utils");

test("normalizeProductImages keeps at most three usable urls", () => {
  const result = normalizeProductImages({
    image_urls: ["https://a.example/1.png", "", null, "https://a.example/2.png", "https://a.example/3.png"],
    image_url: "https://fallback.example/legacy.png",
  });

  assert.deepEqual(result, [
    "https://a.example/1.png",
    "https://a.example/2.png",
    "https://a.example/3.png",
  ]);
});

test("sanitizeChatMessage trims whitespace and rejects empty input", () => {
  assert.equal(sanitizeChatMessage("   문의 있어요   "), "문의 있어요");
  assert.equal(sanitizeChatMessage("   "), null);
});
