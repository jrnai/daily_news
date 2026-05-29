import express from "express";
import { getSettings, saveSettings } from "../services/settingsService.js";
import { sourceDefinitions } from "../sources/sourceRegistry.js";

export function createAdminRouter(newsService) {
  const router = express.Router();

  router.get("/settings", (_req, res) => {
    res.json({
      ...getSettings(),
      availableSources: sourceDefinitions.map(({ id, name, kind }) => ({ id, name, kind })),
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

  router.post("/cache/clear", (_req, res) => {
    newsService.clearCache();
    res.json({ ok: true, message: "Cache cleared. Next request will re-fetch all sources." });
  });

  return router;
}
