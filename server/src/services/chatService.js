// RAG-based chat service.
// Retrieves the most relevant cached articles for a question, then sends
// them as grounding context to the Groq LLM. The system prompt instructs
// the model to answer ONLY from the provided articles — no outside knowledge.

import { getSettings } from "./settingsService.js";

const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "it", "in", "on", "at", "to", "for",
  "of", "and", "or", "but", "with", "from", "by", "as", "was",
  "are", "be", "this", "that", "what", "how", "why", "when",
  "who", "which", "do", "did", "does", "has", "have", "had",
  "not", "no", "can", "will", "about", "me", "my", "tell",
]);

// Simple keyword extraction: lowercase, split on non-word chars, drop stop words
function extractKeywords(text) {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// Score an article against a set of query keywords
function scoreArticle(article, keywords) {
  let score = 0;
  const titleTokens = extractKeywords(article.title);
  const summaryTokens = extractKeywords(article.summary || "");
  const tagTokens = (article.tags || []).flatMap(extractKeywords);

  for (const kw of keywords) {
    if (titleTokens.includes(kw)) score += 3;
    if (summaryTokens.includes(kw)) score += 2;
    if (tagTokens.includes(kw)) score += 1;
  }
  return score;
}

// Pick the TOP_K most relevant articles for the question
function retrieveContext(articles, question, topK = 6) {
  const keywords = extractKeywords(question);
  if (!keywords.length) return articles.slice(0, topK);

  const scored = articles
    .map((article) => ({ article, score: scoreArticle(article, keywords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  // Fall back to recency when nothing matches
  const selected = scored.length ? scored.slice(0, topK) : articles.slice(0, topK);
  return selected.map(({ article }) => article);
}

// Build the grounding context string injected into the prompt
function buildContextBlock(articles) {
  return articles
    .map((a, i) => {
      const date = a.publishedAt ? new Date(a.publishedAt).toDateString() : "unknown date";
      return [
        `[Article ${i + 1}]`,
        `Title: ${a.title}`,
        `Source: ${a.source}`,
        `Date: ${date}`,
        `Summary: ${a.summary || "No summary available."}`,
        `URL: ${a.url}`,
      ].join("\n");
    })
    .join("\n\n");
}

export class ChatService {
  constructor(newsService) {
    this.newsService = newsService;
  }

  async ask(question) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set. Add it to your .env file.");
    }

    // Pull articles from the in-memory cache (refresh if stale)
    const newsPayload = await this.newsService.getNews();
    const articles = newsPayload.articles || [];

    if (!articles.length) {
      return {
        answer: "No articles are available yet. Try refreshing the feed first.",
        sources: [],
      };
    }

    const { groqModel, topK } = getSettings();
    const contextArticles = retrieveContext(articles, question, topK);
    const contextBlock = buildContextBlock(contextArticles);

    const systemPrompt = [
      "You are a helpful news assistant for a tech news dashboard.",
      "Answer the user's question ONLY using the articles provided below.",
      "Do NOT use any knowledge outside of these articles.",
      "If the answer is not found in the articles, say: \"I couldn't find information about that in the current news feed.\"",
      "Be concise. When citing facts, mention the article title or source.",
      "",
      "--- ARTICLES ---",
      contextBlock,
      "--- END OF ARTICLES ---",
    ].join("\n");

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        max_tokens: 512,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const json = await response.json();
    const answer = json.choices?.[0]?.message?.content?.trim() || "No response received.";

    return {
      answer,
      sources: contextArticles.map((a) => ({ title: a.title, url: a.url, source: a.source })),
    };
  }
}
