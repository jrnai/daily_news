import "dotenv/config";
import cors from "cors";
import express from "express";
import { createNewsRouter } from "./routes/newsRoutes.js";
import { ChatService } from "./services/chatService.js";
import { NewsService } from "./services/newsService.js";
import { createSourceAdapters } from "./sources/sourceRegistry.js";

const port = Number(process.env.PORT || 3001);
const app = express();
const newsService = new NewsService(createSourceAdapters());
const chatService = new ChatService(newsService);

app.use(cors());
app.use(express.json());
app.use("/api", createNewsRouter(newsService, chatService));

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: "Unable to load news right now.",
    detail: process.env.NODE_ENV === "production" ? undefined : error.message
  });
});

app.listen(port, () => {
  console.log(`Daily Tech News API listening on http://localhost:${port}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
