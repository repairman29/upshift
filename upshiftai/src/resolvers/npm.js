/**
 * Resolve npm dependency tree from package.json + package-lock.json.
 * Optionally fetch registry metadata (last publish, deprecated) for each package.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fetchJson } from '../network.js';
import { cachePath, cacheGet, cacheSet } from '../cache.js';

const REGISTRY = 'https://registry.npmjs.org';

/**
 * @param {string} projectRoot
 * @returns {{ lockfile: object, root: string } | { error: string } | null }
 */
export function loadLockfile(projectRoot) {
  if (!projectRoot || typeof projectRoot !== 'string') return { error: 'Invalid project root' };
  const root = resolve(projectRoot);
  const lockPath = join(root, 'package-lock.json');
  if (!existsSync(lockPath)) return null;
  try {
    const raw = readFileSync(lockPath, 'utf8');
    if (!raw || !raw.trim()) return { error: 'package-lock.json is empty' };
    const lockfile = JSON.parse(raw);
    if (!lockfile || typeof lockfile !== 'object') return { error: 'package-lock.json is invalid' };
    if (!lockfile.packages && !lockfile.dependencies) return { error: 'package-lock.json has no packages or dependencies' };
    return { lockfile, root };
  } catch (err) {
    const msg = err instanceof SyntaxError ? 'Invalid JSON in package-lock.json' : (err?.message || 'Failed to read package-lock.json');
    return { error: msg };
  }
}

/**
 * Flatten lockfile packages into a list of { name, version, resolved, deprecated?, ... }
 * and build a simple tree of who-depends-on-who from node_modules structure in lockfile.
 * specToKey maps lockfile path (e.g. "node_modules/lodash") -> key ("lodash@4.17.21").
 *
 * @param {object} lockfile - parsed package-lock.json
 * @returns {{ packages: Map<string, object>, dependencies: Map<string, string[]>, specToKey: Map<string, string> }}
 */
export function flattenPackages(lockfile) {
  const packages = new Map();
  const dependencies = new Map();
  const specToKey = new Map();

  const nodePackages = lockfile.packages || {};

  for (const [spec, pkg] of Object.entries(nodePackages)) {
    const name = pkg.name || (spec === '' ? 'root' : spec.replace(/^node_modules\//, '').split('/').pop() || spec);
    const version = pkg.version || '0.0.0';
    const key = `${name}@${version}`;
    specToKey.set(spec, key);
    packages.set(key, {
      name,
      version,
      spec,
      resolved: pkg.resolved ?? null,
      deprecated: pkg.deprecated ?? null,
      optional: pkg.optional ?? false,
      dev: pkg.dev ?? false,
      peer: pkg.peer ?? false,
      inBundle: pkg.inBundle ?? false,
      dependencies: pkg.dependencies ? { ...pkg.dependencies } : {},
    });

    const deps = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
    dependencies.set(key, deps);
  }

  // Root: lockfile v2 may not have packages[""], use root fields
  if (!specToKey.has('')) {
    const rootPkg = lockfile.packages?.[''] || lockfile;
    const rootName = rootPkg.name || 'root';
    const rootVersion = rootPkg.version || '0.0.0';
    const rootKey = `${rootName}@${rootVersion}`;
    const rootDeps = { ...(rootPkg.dependencies || {}), ...(rootPkg.devDependencies || lockfile.dependencies || {}) };
    specToKey.set('', rootKey);
    packages.set(rootKey, {
      name: rootName,
      version: rootVersion,
      spec: '',
      resolved: null,
      deprecated: null,
      optional: false,
      dev: false,
      peer: false,
      inBundle: false,
      dependencies: rootDeps,
    });
    dependencies.set(rootKey, Object.keys(rootDeps));
  }

  return { packages, dependencies, specToKey };
}

/**
 * Resolve child package path from lockfile (npm v2/v3 layout).
 * Tries nested path first, then hoisted node_modules/name.
 */
function getChildPath(lockfile, parentPath, name) {
  const nodePackages = lockfile.packages || {};
  const nested = parentPath ? `${parentPath}/node_modules/${name}` : `node_modules/${name}`;
  if (nodePackages[nested]) return nested;
  const hoisted = `node_modules/${name}`;
  if (nodePackages[hoisted]) return hoisted;
  return null;
}

/**
 * Build tree with depth and "why" (list of parent keys that depend on this).
 *
 * @param {{ packages: Map<string, object>, dependencies: Map<string, string[]>, specToKey: Map<string, string> }} flat
 * @param {object} lockfile
 * @returns {Array<{ key: string, name: string, version: string, depth: number, why: string[], deprecated?: string, resolved?: string }>}
 */
export function buildTreeWithDepth(flat, lockfile) {
  const { packages, dependencies, specToKey } = flat;
  const rootKey = specToKey.get('');
  if (!rootKey) return [];

  const depth = new Map();
  const why = new Map();
  depth.set(rootKey, 0);
  why.set(rootKey, []);

  const queue = [{ key: rootKey, spec: '', d: 0 }];
  const seen = new Set([rootKey]);

  while (queue.length) {
    const { key, spec: parentSpec, d } = queue.shift();
    const childNames = dependencies.get(key) || [];

    for (const name of childNames) {
      const childPath = getChildPath(lockfile, parentSpec, name);
      if (!childPath) continue;
      const childKey = specToKey.get(childPath);
      if (!childKey || !packages.has(childKey)) continue;

      if (!seen.has(childKey)) {
        seen.add(childKey);
        depth.set(childKey, d + 1);
        why.set(childKey, [key]);
        queue.push({ key: childKey, spec: childPath, d: d + 1 });
      } else {
        const existing = why.get(childKey) || [];
        if (!existing.includes(key)) existing.push(key);
        why.set(childKey, existing);
      }
    }
  }

  return [...packages.entries()]
    .filter(([k]) => k !== rootKey && depth.has(k))
    .map(([key, pkg]) => ({
      key,
      name: pkg.name,
      version: pkg.version,
      depth: depth.get(key) ?? -1,
      why: why.get(key) || [],
      deprecated: pkg.deprecated ?? undefined,
      resolved: pkg.resolved ?? undefined,
    }));
}

/**
 * Fetch minimal metadata from registry for a package name.
 * If version is provided, returns that version's publish time; else latest.
 * No auth; rate-limit friendly (single request per package).
 *
 * @param {string} name - package name
 * @param {string} [version] - specific version (e.g. from lockfile)
 * @param {{ cacheDir?: string, cacheTtlMs?: number }} [options]
 * @returns {Promise<{ lastPublish?: string, deprecated?: string, latestVersion?: string, license?: string }>}
 */
export async function fetchRegistryMetadata(name, version, options = {}) {
  if (!name || typeof name !== 'string') return {};
  const cacheDir = options.cacheDir;
  const cacheTtlMs = options.cacheTtlMs ?? 24 * 60 * 60 * 1000;
  if (cacheDir) {
    const path = cachePath(cacheDir, 'npm', name);
    const cached = cacheGet(path, cacheTtlMs);
    if (cached && typeof cached === 'object') return cached;
  }
  try {
    const data = await fetchJson(`${REGISTRY}/${encodeURIComponent(name)}`, { timeoutMs: 15000, retries: 2 });
    if (!data || typeof data !== 'object') return {};
    const latest = data['dist-tags']?.latest;
    const useVersion = (version && data.versions?.[version]) ? version : latest;
    const verData = data.versions?.[useVersion];
    const time = data.time && useVersion ? data.time[useVersion] : data.time?.modified;
    const license = verData?.license ?? data.license;
    const licenseVal = typeof license === 'string' ? license : (license && license.type);
    const result = {
      lastPublish: time || undefined,
      deprecated: verData?.deprecated ?? data.deprecated ?? undefined,
      latestVersion: latest || undefined,
      license: licenseVal || undefined,
    };
    if (cacheDir) cacheSet(cachePath(cacheDir, 'npm', name), result);
    return result;
  } catch (_) {
    return {};
  }
}
