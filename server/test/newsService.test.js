import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeArticle, SOURCE_TYPES } from "../src/domain/article.js";
import { NewsService, dedupeArticles, filterArticles, sortArticles } from "../src/services/newsService.js";

function article(overrides = {}) {
  return normalizeArticle({
    title: "AI chips reshape cloud infrastructure",
    summary: "Semiconductors, data centers, and developer platforms.",
    url: "https://example.com/story",
    source: "Example",
    sourceType: SOURCE_TYPES.RSS,
    publishedAt: "2026-05-28T08:00:00.000Z",
    tags: ["ai", "cloud"],
    ...overrides
  });
}

describe("article normalization", () => {
  it("creates predictable clean articles", () => {
    const normalized = article({ title: "<b>Hello</b> &amp; welcome" });

    assert.equal(normalized.title, "Hello & welcome");
    assert.equal(normalized.sourceType, "rss");
    assert.equal(normalized.tags.includes("ai"), true);
  });

  it("rejects articles without a URL", () => {
    assert.equal(article({ url: "" }), null);
  });
});

describe("news service pure behavior", () => {
  it("dedupes by URL", () => {
    const items = dedupeArticles([article(), article({ title: "Duplicate" })]);

    assert.equal(items.length, 1);
  });

  it("filters by query source and tag", () => {
    const items = [
      article(),
      article({ title: "Phone launch", url: "https://example.com/phone", source: "Gadgets", tags: ["hardware"] })
    ];

    assert.equal(filterArticles(items, { q: "chips", source: "Example", tag: "ai" }).length, 1);
  });

  it("sorts newest first", () => {
    const older = article({ url: "https://example.com/old", publishedAt: "2025-01-01T00:00:00.000Z" });
    const newer = article({ url: "https://example.com/new", publishedAt: "2026-01-01T00:00:00.000Z" });

    assert.equal(sortArticles([older, newer])[0].url, newer.url);
  });
});

describe("news service resilience", () => {
  it("returns partial results when one source fails", async () => {
    const service = new NewsService([
      {
        source: { id: "ok", name: "OK Source", kind: "test", tags: [] },
        fetchArticles: async () => [article()]
      },
      {
        source: { id: "bad", name: "Bad Source", kind: "test", tags: [] },
        fetchArticles: async () => {
          throw new Error("source unavailable");
        }
      }
    ]);

    const payload = await service.getNews();

    assert.equal(payload.articles.length, 1);
    assert.equal(payload.meta.warnings.length, 1);
    assert.equal(payload.meta.sourceStatuses.find((status) => status.id === "bad").status, "error");
  });
});
