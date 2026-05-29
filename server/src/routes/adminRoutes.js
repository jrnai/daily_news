import express from "express";
import { getSettings, saveSettings } from "../services/settingsService.js";
import { sourceDefinitions, createSourceAdapters } from "../sources/sourceRegistry.js";

function slugify(name) {
  return "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function createAdminRouter(newsService) {
  const router = express.Router();

  router.get("/settings", (_req, res) => {
    const settings = getSettings();
    const builtIn = sourceDefinitions.map(({ id, name, kind }) => ({ id, name, kind, custom: false }));
    const custom = (settings.customSources || []).map((s) => ({ id: s.id, name: s.name, kind: s.kind, url: s.url, custom: true }));
    res.json({
      ...settings,
      availableSources: [...builtIn, ...custom],
    });
  });

  router.put("/settings", async (req, res, next) => {
    try {
      const { disabledSources, cacheTtlMs, maxArticles, groqModel, topK } = req.body;
      const patch = {
        ...(Array.isArray(disabledSources) && { disabledSources }),
        ...(typeof cacheTtlMs === "number" && cacheTtlMs >= 60000 && { cacheTtlMs }),
        ...(typeof maxArticles === "number" && maxArticles >= 1 && { maxArticles: Math.floor(maxArticles) }),
        ...(typeof groqModel === "string" && groqModel.trim() && { groqModel: groqModel.trim() }),
        ...(typeof topK === "number" && topK >= 1 && { topK: Math.floor(topK) }),
      };
      const saved = await saveSettings(patch);
      res.json(saved);
    } catch (error) {
      next(error);
    }
  });

  router.post("/sources", async (req, res, next) => {
    try {
      const name = String(req.body.name || "").trim().slice(0, 80);
      const url = String(req.body.url || "").trim().slice(0, 500);

      if (!name) return res.status(400).json({ error: "name is required" });
      if (!url) return res.status(400).json({ error: "url is required" });

      // Basic URL validation — must be http/https
      let parsed;
      try { parsed = new URL(url); } catch {
        return res.status(400).json({ error: "Invalid URL" });
      }
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return res.status(400).json({ error: "URL must use http or https" });
      }

      const id = slugify(name);
      const settings = getSettings();

      // Prevent duplicate ids
      const allIds = [...sourceDefinitions.map((s) => s.id), ...(settings.customSources || []).map((s) => s.id)];
      if (allIds.includes(id)) {
        return res.status(409).json({ error: `A source with id "${id}" already exists. Choose a different name.` });
      }

      const newSource = { id, name, kind: "rss", url, tags: [], timeoutMs: 9000 };
      const [adapter] = createSourceAdapters([newSource]);
      newsService.addAdapter(adapter);

      const customSources = [...(settings.customSources || []), newSource];
      await saveSettings({ customSources });

      res.status(201).json({ source: { id, name, kind: "rss", url, custom: true } });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/sources/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const settings = getSettings();
      const exists = (settings.customSources || []).some((s) => s.id === id);
      if (!exists) {
        return res.status(404).json({ error: "Custom source not found. Built-in sources cannot be deleted." });
      }
      newsService.removeAdapter(id);
      const customSources = (settings.customSources || []).filter((s) => s.id !== id);
      // Also remove from disabledSources if present
      const disabledSources = (settings.disabledSources || []).filter((x) => x !== id);
      await saveSettings({ customSources, disabledSources });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/cache/clear", (_req, res) => {
    newsService.clearCache();
    res.json({ ok: true, message: "Cache cleared. Next request will re-fetch all sources." });
  });

  return router;
}
