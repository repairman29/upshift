/**
 * Resolve Python dependencies from requirements.txt.
 * No lockfile tree (depth 0 for all). Optionally fetch PyPI metadata.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { cachePath, cacheGet, cacheSet } from '../cache.js';

const PYPI_URL = 'https://pypi.org/pypi';

async function fetchPyPIJson(normalized) {
  try {
    const { fetchJson } = await import('../network.js');
    return await fetchJson(`${PYPI_URL}/${normalized}/json`, { timeoutMs: 15000, retries: 2 });
  } catch {
    return null;
  }
}

/**
 * Read [project] name and [project.urls] from pyproject.toml for report header.
 * @param {string} projectRoot
 * @returns {{ name?: string, url?: string, description?: string } | null}
 */
export function loadPyProjectMeta(projectRoot) {
  const root = resolve(projectRoot);
  const path = join(root, 'pyproject.toml');
  if (!existsSync(path)) return null;
  const content = readFileSync(path, 'utf8');
  const lines = content.split(/\r?\n/);
  let name = null;
  let description = null;
  let inUrls = false;
  let homepage = null;
  let repository = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('[')) {
      inUrls = trimmed === '[project.urls]';
      continue;
    }
    if (trimmed.startsWith('name') && trimmed.includes('=')) {
      const val = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
      if (!name) name = val;
    }
    if (trimmed.startsWith('description') && trimmed.includes('=')) {
      const val = trimmed.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (!description) description = val;
    }
    if (inUrls) {
      if (trimmed.startsWith('Homepage') && trimmed.includes('=')) {
        homepage = trimmed.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      }
      if ((trimmed.startsWith('Repository') || trimmed.startsWith('Source')) && trimmed.includes('=')) {
        repository = trimmed.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  const url = repository || homepage || null;
  if (!name && !url) return null;
  return { name: name || undefined, url: url || undefined, description: description || undefined };
}

/**
 * @param {string} projectRoot
 * @returns {{ requirements: Array<{ name: string, version: string, raw: string, source?: string }>, root: string, path: string } | null }
 */
export function loadRequirements(projectRoot) {
  const root = resolve(projectRoot);
  const paths = [
    join(root, 'requirements.txt'),
    join(root, 'requirements', 'base.txt'),
    join(root, 'requirements', 'production.txt'),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      const content = readFileSync(p, 'utf8');
      const packages = parseRequirements(content, root);
      return { requirements: packages, root, path: p };
    }
  }
  const pyprojectPath = join(root, 'pyproject.toml');
  if (existsSync(pyprojectPath)) {
    const content = readFileSync(pyprojectPath, 'utf8');
    const packages = parsePyProjectDependencies(content);
    if (packages.length) return { requirements: packages, root, path: pyprojectPath };
  }
  return null;
}

/**
 * Parse [project] dependencies and [project.optional-dependencies] from pyproject.toml.
 * Only these sections; ignore [tool.*], [build-system], etc.
 * @param {string} content
 * @returns {Array<{ name: string, version: string, raw: string, source?: string }>}
 */
function parsePyProjectDependencies(content) {
  const results = [];
  const lines = content.split(/\r?\n/);
  let inDeps = false;
  let inProject = false;
  let inOptionalDeps = false;
  let currentExtra = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('[')) {
      inDeps = false;
      if (trimmed === '[project]') {
        inProject = true;
        inOptionalDeps = false;
      } else if (trimmed === '[project.optional-dependencies]') {
        inOptionalDeps = true;
        inProject = false;
      } else {
        inProject = false;
        inOptionalDeps = false;
      }
      continue;
    }
    if (inProject && trimmed === 'dependencies = [') {
      inDeps = true;
      currentExtra = 'dependencies';
      continue;
    }
    if (inOptionalDeps && trimmed.match(/^[\w-]+\s*=\s*\[/)) {
      currentExtra = trimmed.split('=')[0].trim();
      inDeps = true;
      continue;
    }
    if (inDeps) {
      if (trimmed === ']') {
        inDeps = false;
        continue;
      }
      const spec = trimmed.replace(/,$/, '').trim().replace(/^["']|["']$/g, '').split('#')[0].trim();
      if (!spec) continue;
      const parsed = parseOne(spec);
      // Only accept valid package names (alphanumeric, underscore, hyphen, dot)
      if (!parsed || !/^[a-zA-Z0-9_.-]+$/.test(parsed.name)) continue;
      parsed.source = currentExtra ? `pyproject.toml (${currentExtra})` : 'pyproject.toml';
      results.push(parsed);
    }
  }

  return results;
}

/**
 * Parse requirements.txt lines. Handles:
 * name==version, name>=x, name~=x, name, -r other.txt, -e, # comments
 * @param {string} content
 * @param {string} projectRoot - for -r includes
 * @param {Set<string>} [seen] - avoid circular -r
 * @returns {Array<{ name: string, version: string, raw: string }>}
 */
function parseRequirements(content, projectRoot, seen = new Set()) {
  const results = [];
  const lines = content.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('-r ')) {
      const includePath = join(projectRoot, line.slice(3).trim());
      if (seen.has(includePath)) continue;
      seen.add(includePath);
      if (existsSync(includePath)) {
        const sub = readFileSync(includePath, 'utf8');
        results.push(...parseRequirements(sub, resolve(includePath, '..'), seen));
      }
      continue;
    }
    if (line.startsWith('-e ') || line.startsWith('--') || line.startsWith('-f ')) continue;

    const spec = parseOne(line);
    if (spec) results.push(spec);
  }

  return results;
}

/**
 * @param {string} line - e.g. "django==4.2" or "requests>=2.28"
 * @returns {{ name: string, version: string, raw: string } | null}
 */
function parseOne(line) {
  const trimmed = line.split('#')[0].trim();
  if (!trimmed) return null;
  // Normalize: name may have [extras]; version is after == or >= etc.
  const match = trimmed.match(/^([a-zA-Z0-9_.-]+)(?:\[[^\]]+\])?\s*([=<>!~]+)\s*(.+)$/) ||
    trimmed.match(/^([a-zA-Z0-9_.-]+)(?:\[[^\]]+\])?$/);
  const name = match ? match[1].toLowerCase().replace(/_/g, '-') : trimmed.split(/[=<>!~\s]/)[0]?.toLowerCase().replace(/_/g, '-');
  if (!name) return null;
  let version = '';
  if (match && match[2]) {
    version = match[3].trim();
  } else {
    version = trimmed.includes('==') ? trimmed.split('==')[1]?.trim() || '' : '*';
  }
  return { name, version, raw: trimmed };
}

/**
 * Build tree-like list (all depth 0, no "why") for report compatibility.
 * @param {Array<{ name: string, version: string, raw: string }>} requirements
 * @returns {Array<{ key: string, name: string, version: string, depth: number, why: string[], raw?: string }>}
 */
export function requirementsToTree(requirements) {
  return requirements.map((r) => ({
    key: `${r.name}@${r.version || '*'}`,
    name: r.name,
    version: r.version || '*',
    depth: 0,
    why: [r.source || 'requirements.txt'],
    raw: r.raw,
  }));
}

/**
 * Fetch PyPI metadata for a package.
 * @param {string} name - package name
 * @param {string} [version] - constraint or *
 * @param {{ cacheDir?: string, cacheTtlMs?: number }} [options]
 * @returns {Promise<{ lastPublish?: string, deprecated?: string, requiresPython?: string, latestVersion?: string, license?: string }>}
 */
export async function fetchPyPIMetadata(name, version, options = {}) {
  if (!name || typeof name !== 'string') return {};
  const normalized = name.toLowerCase().replace(/_/g, '-');
  const cacheDir = options.cacheDir;
  const cacheTtlMs = options.cacheTtlMs ?? 24 * 60 * 60 * 1000;
  if (cacheDir) {
    const path = cachePath(cacheDir, 'pypi', normalized);
    const cached = cacheGet(path, cacheTtlMs);
    if (cached && typeof cached === 'object') return cached;
  }
  try {
    const data = await fetchPyPIJson(normalized);
    if (!data || typeof data !== 'object') return {};
    const releases = data.releases || {};
    let uploadTime = null;
    if (version && version !== '*' && releases[version]?.length) {
      uploadTime = releases[version][0]?.upload_time;
    }
    if (!uploadTime && data.info?.version && releases[data.info.version]?.length) {
      uploadTime = releases[data.info.version][0]?.upload_time;
    }
    const requiresPython = data.info?.requires_python || undefined;
    const latestVersion = data.info?.version || undefined;
    const license = data.info?.license || (data.info?.classifiers && data.info.classifiers.find((c) => typeof c === 'string' && c.startsWith('License ::')));
    const licenseVal = typeof license === 'string' ? license.replace(/^License ::\s*/i, '') : license;
    const result = {
      lastPublish: uploadTime || undefined,
      deprecated: data.info?.classifiers?.some((c) => typeof c === 'string' && c.includes('Development Status') && c.includes('Deprecated')) ? 'Deprecated' : undefined,
      requiresPython,
      latestVersion,
      license: licenseVal || undefined,
    };
    if (cacheDir) cacheSet(cachePath(cacheDir, 'pypi', normalized), result);
    return result;
  } catch {
    return {};
  }
}

/**
 * Get latest version of a package from PyPI.
 * @param {string} name - package name
 * @returns {Promise<string|null>}
 */
export async function getPyPILatestVersion(name) {
  const meta = await fetchPyPIMetadata(name, '*');
  return meta.latestVersion || null;
}
