/**
 * File-based cache for registry responses. TTL in ms.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function safeFilename(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'unknown';
}

/**
 * @param {string} cacheDir - e.g. projectRoot/.upshiftai-tmp/cache
 * @param {string} ecosystem - 'npm' | 'pypi'
 * @param {string} name - package name
 * @returns {string} absolute path to cache file
 */
export function cachePath(cacheDir, ecosystem, name) {
  const dir = join(resolve(cacheDir), ecosystem);
  return join(dir, safeFilename(name) + '.json');
}

/**
 * @param {string} filePath - absolute path to cache file
 * @param {number} ttlMs - max age in ms
 * @returns {object|null} parsed JSON or null if miss/expired/invalid
 */
export function cacheGet(filePath, ttlMs = DEFAULT_TTL_MS) {
  try {
    if (!existsSync(filePath)) return null;
    const stat = statSync(filePath);
    const age = Date.now() - (stat.mtimeMs ?? (stat.mtime && stat.mtime.getTime ? stat.mtime.getTime() : 0));
    if (age > ttlMs) return null;
    const raw = readFileSync(filePath, 'utf8');
    if (!raw || !raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {string} filePath - absolute path to cache file
 * @param {object} data - JSON-serializable
 */
export function cacheSet(filePath, data) {
  try {
    const dir = resolve(filePath, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(data), 'utf8');
  } catch (_) {
    // ignore write errors
  }
}
