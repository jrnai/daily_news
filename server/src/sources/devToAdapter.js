import { normalizeArticle, SOURCE_TYPES } from "../domain/article.js";
import { fetchJson } from "./http.js";

export function createDevToAdapter(source) {
  return {
    source,
    async fetchArticles() {
      const url = new URL("https://dev.to/api/articles");
      url.searchParams.set("top", "7");
      url.searchParams.set("per_page", "30");

      const payload = await fetchJson(url, { timeoutMs: source.timeoutMs });

      return (payload || [])
        .map((item) =>
          normalizeArticle({
            title: item.title,
            summary: item.description,
            url: item.url,
            source: source.name,
            sourceType: SOURCE_TYPES.API,
            publishedAt: item.published_at,
            imageUrl: item.cover_image || item.social_image,
            tags: [...(source.tags || []), ...(item.tag_list || [])]
          })
        )
        .filter(Boolean);
    }
  };
}
