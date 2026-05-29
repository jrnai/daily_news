import { normalizeArticle, SOURCE_TYPES } from "../domain/article.js";
import { fetchJson } from "./http.js";

export function createHackerNewsAdapter(source) {
  return {
    source,
    async fetchArticles() {
      const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
      url.searchParams.set("tags", "story");
      url.searchParams.set("query", "technology OR ai OR startup OR software");
      url.searchParams.set("hitsPerPage", "30");

      const payload = await fetchJson(url, { timeoutMs: source.timeoutMs });

      return (payload.hits || [])
        .map((hit) =>
          normalizeArticle({
            title: hit.title || hit.story_title,
            summary: `${hit.points || 0} points and ${hit.num_comments || 0} comments on Hacker News.`,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            source: source.name,
            sourceType: SOURCE_TYPES.API,
            publishedAt: hit.created_at,
            imageUrl: null,
            tags: source.tags || []
          })
        )
        .filter(Boolean);
    }
  };
}
