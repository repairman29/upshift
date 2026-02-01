/**
 * Resolve Go dependencies from go.mod (and go.sum for full list).
 * Optionally fetch module proxy (GOPROXY) for lastPublish per version.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fetchJson } from '../network.js';
import { cachePath, cacheGet, cacheSet } from '../cache.js';

const DEFAULT_GOPROXY = 'https://proxy.golang.org';

function safeFilename(str) {
  return String(str).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'unknown';
}

/**
 * First proxy URL from GOPROXY (e.g. "https://proxy.golang.org,direct" -> "https://proxy.golang.org").
 * @returns {string}
 */
function getGoProxyBase() {
  const raw = typeof process !== 'undefined' && process.env && process.env.GOPROXY;
  if (!raw || typeof raw !== 'string') return DEFAULT_GOPROXY;
  const first = raw.split(',')[0].trim();
  if (/^https?:\/\//i.test(first)) return first;
  return DEFAULT_GOPROXY;
}

/**
 * @param {string} projectRoot
 * @returns {{ modules: Array<{ path: string, version: string, indirect?: boolean }>, root: string } | null }
 */
export function loadGoMod(projectRoot) {
  if (!projectRoot || typeof projectRoot !== 'string') return null;
  const root = resolve(projectRoot);
  const goModPath = join(root, 'go.mod');
  if (!existsSync(goModPath)) return null;
  try {
    const content = readFileSync(goModPath, 'utf8');
    if (!content || typeof content !== 'string') return null;
    const modules = parseGoMod(content);
    return Array.isArray(modules) ? { modules, root } : null;
  } catch {
    return null;
  }
}

/**
 * Parse go.mod require blocks. Handles:
 * require ( path v1.2.3 path2 v2.0.0 )
 * require path v1.2.3
 * // indirect
 * @param {string} content
 * @returns {Array<{ path: string, version: string, indirect?: boolean }>}
 */
function parseGoMod(content) {
  const results = [];
  const lines = content.split(/\r?\n/);
  let inRequire = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) continue;

    if (trimmed.startsWith('require (')) {
      inRequire = true;
      continue;
    }
    if (inRequire) {
      if (trimmed === ')') {
        inRequire = false;
        continue;
      }
      const indirect = trimmed.includes('// indirect');
      const parts = trimmed.split(/\s+/).filter((p) => p && !p.startsWith('//'));
      const path = parts[0];
      const version = parts[1] || '';
      if (path && path !== ')') results.push({ path, version, indirect });
      continue;
    }
    const singleRequire = trimmed.match(/^require\s+(\S+)\s+(\S+)/);
    if (singleRequire) {
      const [, path, version] = singleRequire;
      const indirect = trimmed.includes('// indirect');
      results.push({ path, version, indirect });
    }
  }

  return results;
}

/**
 * Optionally merge go.sum entries (module version) so we have one row per module@version.
 * go.sum format: module version [/go.mod version]
 * @param {string} projectRoot
 * @returns {Set<string>} "path@version"
 */
export function loadGoSum(projectRoot) {
  const root = resolve(projectRoot);
  const goSumPath = join(root, 'go.sum');
  if (!existsSync(goSumPath)) return new Set();
  const content = readFileSync(goSumPath, 'utf8');
  const set = new Set();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const path = parts[0];
    const version = parts[1];
    if (path && version) set.add(`${path}@${version}`);
  }
  return set;
}

/**
 * Build tree-like list (depth 1 = direct, 2 = indirect) for report compatibility.
 * @param {{ modules: Array<{ path: string, version: string, indirect?: boolean }> }} loaded
 * @returns {Array<{ key: string, name: string, version: string, depth: number, why: string[] }>}
 */
export function goModToTree(loaded) {
  return loaded.modules.map((m) => ({
    key: `${m.path}@${m.version}`,
    name: m.path,
    version: m.version,
    depth: m.indirect ? 2 : 1,
    why: m.indirect ? ['go.mod (indirect)'] : ['go.mod'],
  }));
}

/**
 * Fetch version info from Go module proxy (@v/<version>.info). Returns Time as lastPublish.
 *
 * @param {string} modulePath - e.g. "github.com/foo/bar"
 * @param {string} version - e.g. "v1.0.0"
 * @param {{ cacheDir?: string, cacheTtlMs?: number }} [options]
 * @returns {Promise<{ lastPublish?: string }>}
 */
export async function fetchGoProxyMetadata(modulePath, version, options = {}) {
  if (!modulePath || !version) return {};
  const cacheDir = options.cacheDir;
  const cacheTtlMs = options.cacheTtlMs ?? 24 * 60 * 60 * 1000;
  const cacheKey = safeFilename(modulePath + '@' + version);
  if (cacheDir) {
    const path = cachePath(cacheDir, 'go', cacheKey);
    const cached = cacheGet(path, cacheTtlMs);
    if (cached && typeof cached === 'object') return cached;
  }
  const base = getGoProxyBase().replace(/\/$/, '');
  const url = `${base}/${modulePath}/@v/${version}.info`;
  try {
    const data = await fetchJson(url, { timeoutMs: 15000, retries: 2 });
    if (!data || typeof data !== 'object') return {};
    const time = data.Time;
    const result = time ? { lastPublish: time } : {};
    if (cacheDir && result.lastPublish) {
      const path = cachePath(cacheDir, 'go', cacheKey);
      cacheSet(path, result);
    }
    return result;
  } catch (_) {
    return {};
  }
}
