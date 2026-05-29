import express from "express";

export function createNewsRouter(newsService, chatService) {
  const router = express.Router();

  router.get("/news", async (req, res, next) => {
    try {
      const payload = await newsService.getNews({
        q: req.query.q || "",
        source: req.query.source || "all",
        tag: req.query.tag || "all",
        sort: req.query.sort || "newest"
      });
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

  router.post("/chat", async (req, res, next) => {
    try {
      const question = (req.body.question || "").trim();
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
