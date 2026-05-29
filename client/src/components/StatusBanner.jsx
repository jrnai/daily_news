export function StatusBanner({ error, meta }) {
  if (error) {
    return <div className="status-banner error">{error}</div>;
  }

  if (meta?.stale) {
    return <div className="status-banner warn">Showing cached stories because fresh sources are unavailable.</div>;
  }

  if (meta?.warnings?.length) {
    return <div className="status-banner warn">Some sources failed. Showing {meta.count} available stories.</div>;
  }

  return null;
}
