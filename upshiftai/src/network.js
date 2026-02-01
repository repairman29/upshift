/**
 * Robust fetch: timeout, retries, and safe JSON.
 */

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 2;

/**
 * Fetch with timeout and retries.
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {{ timeoutMs?: number, retries?: number }} [options]
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, init = {}, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = Math.max(0, options.retries ?? DEFAULT_RETRIES);
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...init.headers },
      });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      lastErr = err;
      if (attempt < retries) {
        const backoffMs = 500 * Math.pow(2, attempt);
        await sleep(backoffMs);
      }
    }
  }
  throw lastErr;
}

/**
 * Fetch JSON with timeout and retries. Returns null on non-OK or parse error.
 * @param {string} url
 * @param {{ timeoutMs?: number, retries?: number }} [options]
 * @returns {Promise<object|null>}
 */
export async function fetchJson(url, options = {}) {
  try {
    const res = await fetchWithTimeout(url, {}, options);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
