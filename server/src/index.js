import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createNewsRouter } from "./routes/newsRoutes.js";
import { createAdminRouter } from "./routes/adminRoutes.js";
import { ChatService } from "./services/chatService.js";
import { NewsService } from "./services/newsService.js";
import { loadSettings } from "./services/settingsService.js";
import { createSourceAdapters } from "./sources/sourceRegistry.js";

await loadSettings();

const port = Number(process.env.PORT || 3001);
const app = express();
const newsService = new NewsService(createSourceAdapters());
const chatService = new ChatService(newsService);

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.CHAT_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use("/api", createNewsRouter(newsService, chatService, chatLimiter));
app.use("/api/admin", createAdminRouter(newsService));

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
