import { useState } from "react";
import { ArticleCard } from "../../components/ArticleCard.jsx";
import { ChatPanel } from "../../components/ChatPanel.jsx";
import { NewsControls } from "../../components/NewsControls.jsx";
import { StatusBanner } from "../../components/StatusBanner.jsx";
import { useNews } from "../../hooks/useNews.js";

const initialFilters = {
  q: "",
  source: "all",
  tag: "all",
  sort: "newest"
};

export function NewsDashboard() {
  const [filters, setFilters] = useState(initialFilters);
  const { data, error, isLoading, isRefreshing, refresh } = useNews(filters);
  const articles = data?.articles || [];
  const meta = data?.meta;

  function updateFilters(next) {
    setFilters((current) => ({ ...current, ...next }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local aggregator</p>
          <h1>Daily Tech News</h1>
        </div>
        <div className="feed-stats">
          <strong>{meta?.count ?? 0}</strong>
          <span>stories</span>
        </div>
      </header>

      <NewsControls
        filters={filters}
        sources={meta?.sources || []}
        tags={meta?.tags || []}
        onChange={updateFilters}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />

      <StatusBanner error={error} meta={meta} />

      <ChatPanel />

      {isLoading ? (
        <section className="state-panel">
          <div className="spinner" />
          <p>Loading fresh stories...</p>
        </section>
      ) : articles.length ? (
        <section className="news-grid" aria-label="Tech news feed">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </section>
      ) : (
        <section className="state-panel">
          <p>No stories match the current filters.</p>
          <button type="button" onClick={() => setFilters(initialFilters)}>
            Clear filters
          </button>
        </section>
      )}
    </main>
  );
}
