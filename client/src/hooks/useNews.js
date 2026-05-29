import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchNews, refreshNews } from "../api/newsApi.js";

export function useNews(filters) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stableFilters = useMemo(() => filters, [filters.q, filters.source, filters.tag, filters.sort]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setData(await fetchNews(stableFilters));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }, [stableFilters]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError("");

    try {
      setData(await refreshNews());
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, isLoading, isRefreshing, refresh };
}
