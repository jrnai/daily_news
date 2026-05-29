import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const SETTINGS_FILE = join(process.cwd(), "settings.json");

const DEFAULTS = {
  disabledSources: [],
  customSources: [],
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000),
  maxArticles: Number(process.env.MAX_ARTICLES || 120),
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  topK: Number(process.env.GROQ_TOP_K || 6),
};

let current = { ...DEFAULTS };

export async function loadSettings() {
  try {
    const text = await readFile(SETTINGS_FILE, "utf8");
    current = { ...DEFAULTS, ...JSON.parse(text) };
  } catch {
    current = { ...DEFAULTS };
  }
  return current;
}

export function getSettings() {
  return current;
}

export async function saveSettings(patch) {
  current = { ...current, ...patch };
  await writeFile(SETTINGS_FILE, JSON.stringify(current, null, 2), "utf8");
  return current;
}
