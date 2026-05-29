import express from "express";

const VALID_SORTS = new Set(["newest", "top"]);
const MAX_Q_LENGTH = 200;
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 30;
const MAX_QUESTION_LENGTH = 500;

export function createNewsRouter(newsService, chatService, chatLimiter) {
  const router = express.Router();

  router.get("/news", async (req, res, next) => {
    try {
      const q = String(req.query.q || "").slice(0, MAX_Q_LENGTH);
      const sort = VALID_SORTS.has(req.query.sort) ? req.query.sort : "newest";
      const source = req.query.source || "all";
      const tag = req.query.tag || "all";
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || DEFAULT_PAGE_SIZE));

      const payload = await newsService.getNews({ q, source, tag, sort, page, limit });
      res.json(payload);
    } catch (error) {
      next(error);
    }
  });

  router.get("/sources", (_req, res) => {
    res.json({ sources: newsService.getSourceList() });
  });

  router.post("/refresh", async (_req, res, next) => {
    try {
      await newsService.refresh();
      res.json(await newsService.getNews());
    } catch (error) {
      next(error);
    }
  });

  router.post("/chat", chatLimiter, async (req, res, next) => {
    try {
      const question = String(req.body.question || "").trim().slice(0, MAX_QUESTION_LENGTH);
      if (!question) {
        return res.status(400).json({ error: "question is required" });
      }
      const result = await chatService.ask(question);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
