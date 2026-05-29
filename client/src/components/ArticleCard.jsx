function formatAge(value) {
  const diffMs = Date.now() - Date.parse(value);
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}

export function ArticleCard({ article }) {
  return (
    <article className="article-card">
      {article.imageUrl ? (
        <img className="article-image" src={article.imageUrl} alt="" loading="lazy" />
      ) : null}
      <div className="article-body">
        <div className="article-meta">
          <span>{article.source}</span>
          <span>{formatAge(article.publishedAt)}</span>
        </div>
        <h2>
          <a href={article.url} target="_blank" rel="noreferrer">
            {article.title}
          </a>
        </h2>
        {article.summary ? <p>{article.summary}</p> : null}
        <div className="tag-row">
          {article.tags.slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}
