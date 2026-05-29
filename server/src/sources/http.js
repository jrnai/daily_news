import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function fetchTextWithPowerShell(url, { timeoutMs }) {
  const command = [
    "$ProgressPreference='SilentlyContinue';",
    "$response = Invoke-WebRequest -Uri $env:DAILY_NEWS_FETCH_URL -UseBasicParsing -Headers @{'User-Agent'='DailyTechNews/1.0 local aggregator'};",
    "$response.Content"
  ].join(" ");

  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-Command", command],
    {
      timeout: timeoutMs + 3000,
      maxBuffer: 8 * 1024 * 1024,
      env: {
        ...process.env,
        DAILY_NEWS_FETCH_URL: url
      },
      windowsHide: true
    }
  );

  return stdout;
}

export async function fetchText(url, { timeoutMs = 9000, headers = {} } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "DailyTechNews/1.0 local aggregator",
        ...headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.text();
  } catch (error) {
    const code = error.cause?.code;
    const canUseWindowsFallback =
      process.platform === "win32" &&
      ["SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "DEPTH_ZERO_SELF_SIGNED_CERT"].includes(code);

    if (canUseWindowsFallback) {
      return fetchTextWithPowerShell(url, { timeoutMs });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJson(url, options = {}) {
  const text = await fetchText(url, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options.headers || {})
    }
  });

  return JSON.parse(text);
}
