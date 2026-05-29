export function NewsControls({ filters, sources, tags, onChange, onRefresh, isRefreshing }) {
  return (
    <section className="controls" aria-label="News controls">
      <label className="search-field">
        <span>Search</span>
        <input
          value={filters.q}
          onChange={(event) => onChange({ q: event.target.value })}
          placeholder="AI, cloud, chips..."
        />
      </label>
      <label>
        <span>Source</span>
        <select value={filters.source} onChange={(event) => onChange({ source: event.target.value })}>
          <option value="all">All sources</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Topic</span>
        <select value={filters.tag} onChange={(event) => onChange({ tag: event.target.value })}>
          <option value="all">All topics</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Sort</span>
        <select value={filters.sort} onChange={(event) => onChange({ sort: event.target.value })}>
          <option value="newest">Newest</option>
          <option value="top">Top stories</option>
        </select>
      </label>
      <button type="button" onClick={onRefresh} disabled={isRefreshing}>
        {isRefreshing ? "Refreshing" : "Refresh"}
      </button>
    </section>
  );
}
