const DEFAULT_CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000);
const MAX_ARTICLES = Number(process.env.MAX_ARTICLES || 120);

function nowIso() {
  return new Date().toISOString();
}

export function dedupeArticles(articles) {
  const seen = new Set();

  return articles.filter((article) => {
    const key = article.url.toLowerCase().replace(/\/$/, "");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function sortArticles(articles, sort = "newest") {
  const copy = [...articles];

  if (sort === "top") {
    return copy.sort((a, b) => {
      const bScore = b.tags.length * 3 + (b.summary ? 2 : 0) + Date.parse(b.publishedAt) / 1000000000000;
      const aScore = a.tags.length * 3 + (a.summary ? 2 : 0) + Date.parse(a.publishedAt) / 1000000000000;
      return bScore - aScore;
    });
  }

  return copy.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function filterArticles(articles, { q = "", source = "all", tag = "all" } = {}) {
  const query = q.trim().toLowerCase();

  return articles.filter((article) => {
    const matchesQuery =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query) ||
      article.tags.some((articleTag) => articleTag.includes(query));
    const matchesSource = source === "all" || article.source === source;
    const matchesTag = tag === "all" || article.tags.includes(tag);

    return matchesQuery && matchesSource && matchesTag;
  });
}

export class NewsService {
  constructor(adapters, { cacheTtlMs = DEFAULT_CACHE_TTL_MS } = {}) {
    this.adapters = adapters;
    this.cacheTtlMs = cacheTtlMs;
    this.cache = null;
  }

  isCacheFresh() {
    return this.cache && Date.now() - this.cache.fetchedAtMs < this.cacheTtlMs;
  }

  getSourceList() {
    const statuses = this.cache?.sourceStatuses || [];
    return this.adapters.map(({ source }) => {
      const cached = statuses.find((status) => status.id === source.id);
      return {
        id: source.id,
        name: source.name,
        kind: source.kind,
        tags: source.tags || [],
        status: cached?.status || "idle",
        error: cached?.error || null,
        articleCount: cached?.articleCount || 0
      };
    });
  }

  async refresh() {
    const settled = await Promise.allSettled(
      this.adapters.map(async (adapter) => ({
        source: adapter.source,
        articles: await adapter.fetchArticles()
      }))
    );

    const articles = [];
    const sourceStatuses = settled.map((result, index) => {
      const source = this.adapters[index].source;

      if (result.status === "fulfilled") {
        articles.push(...result.value.articles);
        return {
          id: source.id,
          name: source.name,
          status: "ok",
          error: null,
          articleCount: result.value.articles.length,
          checkedAt: nowIso()
        };
      }

      return {
        id: source.id,
        name: source.name,
        status: "error",
        error: result.reason?.message || "Unknown source error",
        articleCount: 0,
        checkedAt: nowIso()
      };
    });

    const normalized = sortArticles(dedupeArticles(articles)).slice(0, MAX_ARTICLES);

    if (!normalized.length && this.cache?.articles?.length) {
      this.cache = {
        ...this.cache,
        stale: true,
        sourceStatuses,
        warnings: ["Refresh failed to return fresh stories. Showing the previous cached feed."]
      };
      return this.cache;
    }

    this.cache = {
      articles: normalized,
      sourceStatuses,
      fetchedAt: nowIso(),
      fetchedAtMs: Date.now(),
      stale: false,
      warnings: sourceStatuses
        .filter((status) => status.status === "error")
        .map((status) => `${status.name}: ${status.error}`)
    };

    return this.cache;
  }

  async getNews(options = {}) {
    if (!this.isCacheFresh() || options.refresh) {
      await this.refresh();
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 30));

    const filtered = sortArticles(filterArticles(this.cache.articles, options), options.sort);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const articles = filtered.slice((page - 1) * limit, page * limit);

    const tags = Array.from(new Set(this.cache.articles.flatMap((article) => article.tags))).sort();
    const sources = Array.from(new Set(this.cache.articles.map((article) => article.source))).sort();

    return {
      articles,
      meta: {
        count: articles.length,
        total,
        page,
        limit,
        totalPages,
        totalAvailable: this.cache.articles.length,
        fetchedAt: this.cache.fetchedAt,
        stale: this.cache.stale,
        warnings: this.cache.warnings,
        sources,
        tags,
        sourceStatuses: this.cache.sourceStatuses
      }
    };
  }
}
