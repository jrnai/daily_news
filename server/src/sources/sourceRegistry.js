import { createDevToAdapter } from "./devToAdapter.js";
import { createHackerNewsAdapter } from "./hackerNewsAdapter.js";
import { createRssAdapter } from "./rssAdapter.js";

export const sourceDefinitions = [
  {
    id: "ars-technica",
    name: "Ars Technica",
    kind: "rss",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    tags: ["technology", "science"],
    timeoutMs: 9000
  },
  {
    id: "techcrunch",
    name: "TechCrunch",
    kind: "rss",
    url: "https://techcrunch.com/feed/",
    tags: ["startups", "business"],
    timeoutMs: 9000
  },
  {
    id: "the-verge",
    name: "The Verge",
    kind: "rss",
    url: "https://www.theverge.com/rss/index.xml",
    tags: ["gadgets", "culture"],
    timeoutMs: 9000
  },
  {
    id: "hacker-news",
    name: "Hacker News",
    kind: "hacker-news",
    tags: ["developer", "startup"],
    timeoutMs: 9000
  },
  {
    id: "dev-to",
    name: "Dev.to",
    kind: "dev-to",
    tags: ["developer", "software"],
    timeoutMs: 9000
  }
];

const factories = {
  rss: createRssAdapter,
  "hacker-news": createHackerNewsAdapter,
  "dev-to": createDevToAdapter
};

export function createSourceAdapters(definitions = sourceDefinitions) {
  return definitions.map((source) => {
    const factory = factories[source.kind];
    if (!factory) {
      throw new Error(`Unsupported source kind: ${source.kind}`);
    }
    return factory(source);
  });
}
