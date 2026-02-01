/**
 * Event bus: emit events to in-process listeners and to webhook URLs.
 * Used by apply flow for HITL, rollback, and customer observability.
 */

const listeners = new Map();

/**
 * Register an in-process listener for an event (or '*' for all).
 * @param {string} event
 * @param {(payload: object) => void} fn
 */
export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, []);
  listeners.get(event).push(fn);
}

/**
 * Remove all listeners for event (or all if event omitted).
 * @param {string} [event]
 */
export function off(event) {
  if (event) listeners.delete(event);
  else listeners.clear();
}

/**
 * Emit event to in-process listeners and POST to webhook URLs (fire-and-forget).
 * @param {string} event
 * @param {object} payload
 * @param {string[]} [webhookUrls]
 */
export function emit(event, payload, webhookUrls = []) {
  const envelope = { event, timestamp: new Date().toISOString(), ...payload };
  for (const fn of listeners.get(event) || []) {
    try { fn(envelope); } catch { /* ignore */ }
  }
  for (const fn of listeners.get('*') || []) {
    try { fn(envelope); } catch { /* ignore */ }
  }
  for (const url of webhookUrls) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    }).catch(() => { /* fire-and-forget */ });
  }
}

/**
 * POST to approval webhook and wait for { approved: boolean } in response body.
 * @param {string} url
 * @param {object} payload
 * @param {{ timeoutMs?: number }} options
 * @returns {Promise<{ approved: boolean }>}
 */
export async function requestApproval(url, payload, options = {}) {
  const timeoutMs = options.timeoutMs ?? 60000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'approval.required', ...payload }),
      signal: controller.signal,
    });
    clearTimeout(t);
    const body = await res.json().catch(() => ({}));
    return { approved: body.approved === true };
  } catch (e) {
    clearTimeout(t);
    return { approved: false };
  }
}
