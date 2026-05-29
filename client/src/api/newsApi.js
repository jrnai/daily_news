export async function fetchNews(params = {}) {
  const url = new URL("/api/news", window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to load news.");
  }

  return response.json();
}

export async function refreshNews() {
  const response = await fetch("/api/refresh", { method: "POST" });
  if (!response.ok) {
    throw new Error("Unable to refresh news.");
  }

  return response.json();
}
