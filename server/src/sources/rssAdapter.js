import Parser from "rss-parser";
import { normalizeArticle, SOURCE_TYPES } from "../domain/article.js";
import { fetchText } from "./http.js";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"]
    ]
  }
});

function pickImage(item) {
  return (
    item.enclosure?.url ||
    item.mediaContent?.$?.url ||
    item.mediaThumbnail?.$?.url ||
    null
  );
}

export function createRssAdapter(source) {
  return {
    source,
    async fetchArticles() {
      const xml = await fetchText(source.url, { timeoutMs: source.timeoutMs });
      const feed = await parser.parseString(xml);

      return feed.items
        .map((item) =>
          normalizeArticle({
            title: item.title,
            summary: item.contentSnippet || item.content || item.summary,
            url: item.link || item.guid,
            source: source.name,
            sourceType: SOURCE_TYPES.RSS,
            publishedAt: item.isoDate || item.pubDate,
            imageUrl: pickImage(item),
            tags: [...(source.tags || []), ...(item.categories || [])]
          })
        )
        .filter(Boolean);
    }
  };
}
