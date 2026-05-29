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

const PAGE_SIZE = 30;

export function NewsDashboard() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isRefreshing, refresh } = useNews(filters, page, PAGE_SIZE);
  const articles = data?.articles || [];
  const meta = data?.meta;

  function updateFilters(next) {
    setPage(1); // reset to first page on filter change
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
          <strong>{meta?.total ?? 0}</strong>
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
        <>
          <section className="news-grid" aria-label="Tech news feed">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </section>
          {meta?.totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <span className="pagination-info">
                Page {page} of {meta.totalPages}
                <small>{meta.total} stories</small>
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPages}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      ) : (
        <section className="state-panel">
          <p>No stories match the current filters.</p>
          <button type="button" onClick={() => { setFilters(initialFilters); setPage(1); }}>
            Clear filters
          </button>
        </section>
      )}
    </main>
  );
}
