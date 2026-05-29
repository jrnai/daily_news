import { useEffect, useState } from "react";
import { fetchAdminSettings, updateAdminSettings, clearCache } from "../api/adminApi.js";

export function AdminPage({ onBack }) {
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminSettings()
      .then(setSettings)
      .catch(() => setStatus({ type: "error", message: "Failed to load settings." }));
  }, []);

  function toggleSource(id) {
    setSettings((s) => {
      const disabled = s.disabledSources.includes(id)
        ? s.disabledSources.filter((x) => x !== id)
        : [...s.disabledSources, id];
      return { ...s, disabledSources: disabled };
    });
  }

  async function handleSave() {
    setSaving(true);
    setStatus({ type: "", message: "" });
    try {
      const { disabledSources, cacheTtlMs, maxArticles, groqModel, topK } = settings;
      const saved = await updateAdminSettings({ disabledSources, cacheTtlMs, maxArticles, groqModel, topK });
      setSettings((s) => ({ ...s, ...saved }));
      setStatus({ type: "success", message: "Settings saved." });
    } catch {
      setStatus({ type: "error", message: "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  }

  async function handleClearCache() {
    try {
      await clearCache();
      setStatus({ type: "success", message: "Cache cleared. Next page load will re-fetch all sources." });
    } catch {
      setStatus({ type: "error", message: "Failed to clear cache." });
    }
  }

  if (!settings) {
    return (
      <main className="app-shell">
        <section className="state-panel"><div className="spinner" /><p>Loading settings…</p></section>
      </main>
    );
  }

  const cacheTtlMinutes = Math.round(settings.cacheTtlMs / 60000);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1>Admin Settings</h1>
        </div>
        <button className="admin-back-btn" type="button" onClick={onBack}>
          ← Back to feed
        </button>
      </header>

      <p className="admin-notice">⚠ Local dev tool — no authentication. Do not expose this in production.</p>

      {status.message && (
        <div className={`admin-status admin-status--${status.type}`}>{status.message}</div>
      )}

      <div className="admin-grid">
        {/* Sources */}
        <section className="admin-card">
          <h2>Sources</h2>
          <p className="admin-card-desc">Disabled sources are skipped on the next cache refresh.</p>
          <ul className="source-list">
            {settings.availableSources.map((src) => {
              const enabled = !settings.disabledSources.includes(src.id);
              return (
                <li key={src.id} className="source-row">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleSource(src.id)}
                    />
                    <span className="toggle-track">
                      <span className="toggle-thumb" />
                    </span>
                  </label>
                  <span className="source-name">{src.name}</span>
                  <span className="source-kind">{src.kind}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Feed settings */}
        <section className="admin-card">
          <h2>Feed</h2>
          <label className="admin-field">
            <span>Cache TTL (minutes)</span>
            <input
              type="number"
              min="1"
              max="120"
              value={cacheTtlMinutes}
              onChange={(e) =>
                setSettings((s) => ({ ...s, cacheTtlMs: Number(e.target.value) * 60000 }))
              }
            />
          </label>
          <label className="admin-field">
            <span>Max cached articles</span>
            <input
              type="number"
              min="10"
              max="500"
              value={settings.maxArticles}
              onChange={(e) =>
                setSettings((s) => ({ ...s, maxArticles: Number(e.target.value) }))
              }
            />
          </label>
        </section>

        {/* AI settings */}
        <section className="admin-card">
          <h2>AI (Groq)</h2>
          <label className="admin-field">
            <span>Model</span>
            <input
              type="text"
              value={settings.groqModel}
              onChange={(e) => setSettings((s) => ({ ...s, groqModel: e.target.value }))}
            />
          </label>
          <label className="admin-field">
            <span>Context articles (top K)</span>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.topK}
              onChange={(e) => setSettings((s) => ({ ...s, topK: Number(e.target.value) }))}
            />
          </label>
        </section>
      </div>

      <div className="admin-actions">
        <button type="button" className="admin-btn-secondary" onClick={handleClearCache}>
          Clear cache
        </button>
        <button type="button" className="admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </main>
  );
}
