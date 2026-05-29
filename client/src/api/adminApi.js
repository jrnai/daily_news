export async function fetchAdminSettings() {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) throw new Error("Failed to load settings.");
  return res.json();
}

export async function updateAdminSettings(settings) {
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to save settings.");
  return res.json();
}

export async function addSource(name, url) {
  const res = await fetch("/api/admin/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add source.");
  return data;
}

export async function deleteSource(id) {
  const res = await fetch(`/api/admin/sources/${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete source.");
  return data;
}

export async function clearCache() {
  const res = await fetch("/api/admin/cache/clear", { method: "POST" });
  if (!res.ok) throw new Error("Failed to clear cache.");
  return res.json();
}
