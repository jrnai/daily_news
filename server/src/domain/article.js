import crypto from "node:crypto";

export const SOURCE_TYPES = {
  RSS: "rss",
  API: "api"
};

export function stableId(input) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

export function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function safeDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function normalizeArticle({
  title,
  summary,
  url,
  source,
  sourceType,
  publishedAt,
  imageUrl,
  tags = []
}) {
  const cleanTitle = stripHtml(title || "Untitled story");
  const cleanUrl = String(url || "").trim();

  if (!cleanUrl) {
    return null;
  }

  return {
    id: stableId(`${source}:${cleanUrl}`),
    title: cleanTitle,
    summary: stripHtml(summary || ""),
    url: cleanUrl,
    source,
    sourceType,
    publishedAt: safeDate(publishedAt),
    imageUrl: imageUrl || null,
    tags: Array.from(new Set(tags.map((tag) => stripHtml(tag).toLowerCase()).filter(Boolean)))
  };
}
