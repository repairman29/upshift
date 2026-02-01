/**
 * Parse pipdeptree JSON and build full-tree structures for the "deep" report.
 * Optionally fetch PyPI for each package to flag ancient / old Python.
 */

import { readFileSync } from 'fs';
import { fetchPyPIMetadata } from './resolvers/pip.js';
import { analyzePackage } from './detectors/ancient.js';

/**
 * Parse pipdeptree -o json output. Returns flat list of { name, version, requestedBy: [parentKey] }.
 * @param {string} jsonContent - raw JSON from pipdeptree -o json
 * @returns {{ packages: Map<string, { name: string, version: string, requestedBy: string[] }>, rootPackages: string[] }}
 */
function normName(s) {
  return (s || '').replace(/-/g, '_').toLowerCase().replace(/_/g, '-');
}

export function parsePipdeptreeJson(jsonContent) {
  if (!jsonContent || typeof jsonContent !== 'string') return { packages: new Map(), rootPackages: [] };
  let raw;
  try {
    raw = JSON.parse(jsonContent);
  } catch (_) {
    return { packages: new Map(), rootPackages: [] };
  }
  if (!Array.isArray(raw)) return { packages: new Map(), rootPackages: [] };
  const packages = new Map();
  const seenAsRoot = new Set();

  for (const node of raw) {
    if (!node || typeof node !== 'object' || !node.package) continue;
    const pkg = node.package;
    const name = normName(pkg.package_name || pkg.key);
    const version = pkg.installed_version || '*';
    const keyNorm = `${name}@${version}`;
    if (!packages.has(keyNorm)) {
      packages.set(keyNorm, { name, version, requestedBy: [] });
    }
    const deps = node.dependencies || [];
    for (const dep of deps) {
      const depName = normName(dep.package_name || dep.key);
      const depVersion = dep.installed_version || '*';
      const depKeyNorm = `${depName}@${depVersion}`;
      if (!packages.has(depKeyNorm)) {
        packages.set(depKeyNorm, { name: depName, version: depVersion, requestedBy: [] });
      }
      packages.get(depKeyNorm).requestedBy.push(keyNorm);
    }
    seenAsRoot.add(keyNorm);
  }

  const rootPackages = [...seenAsRoot];
  return { packages, rootPackages };
}

/**
 * Fetch PyPI metadata for each package in the tree and mark ancient/oldPython.
 * @param {Map<string, { name: string, version: string, requestedBy: string[] }>} packages
 * @param {{ ancientMonths?: number }} options
 * @returns {Promise<Map<string, { ancient: boolean, oldPython: boolean, monthsSincePublish: number | null, requiresPython?: string, chain: string }>>}
 */
export async function enrichTreeWithPyPI(packages, options = {}) {
  const ancientMonths = options.ancientMonths ?? 24;
  const results = new Map();

  for (const [key, pkg] of packages) {
    const meta = await fetchPyPIMetadata(pkg.name, pkg.version);
    const signals = analyzePackage(
      { name: pkg.name, version: pkg.version },
      meta,
      { ancientMonths }
    );
    const chain = buildChain(key, pkg, packages);
    results.set(key, {
      ancient: signals.ancient,
      oldPython: signals.oldPython || false,
      monthsSincePublish: signals.monthsSincePublish,
      requiresPython: meta.requiresPython,
      chain,
    });
  }

  return results;
}

function buildChain(key, pkg, packages, visited = new Set()) {
  if (visited.has(key)) return pkg.name;
  visited.add(key);
  const parents = pkg.requestedBy || [];
  if (parents.length === 0) return pkg.name;
  const parentKey = parents[0];
  const parentPkg = packages.get(parentKey);
  if (!parentPkg) return `${parentKey} → ${pkg.name}`;
  const up = buildChain(parentKey, parentPkg, packages, visited);
  return `${up} → ${pkg.name}`;
}

/**
 * Build "something old" chains: list of transitive/direct deps that are ancient or old Python.
 * @param {Map<string, { name: string, version: string, requestedBy: string[] }>} packages
 * @param {Map<string, { ancient: boolean, oldPython: boolean, monthsSincePublish: number | null, requiresPython?: string, chain: string }>} enriched
 * @returns {Array<{ name: string, version: string, chain: string, why: string }>}
 */
export function buildSomethingOldChains(packages, enriched) {
  const out = [];
  for (const [key, pkg] of packages) {
    const e = enriched.get(key);
    if (!e || (!e.ancient && !e.oldPython)) continue;
    const reasons = [];
    if (e.ancient && e.monthsSincePublish != null) reasons.push(`no publish in ${e.monthsSincePublish} months`);
    if (e.oldPython && e.requiresPython) reasons.push(`requires old Python: ${e.requiresPython}`);
    out.push({
      name: pkg.name,
      version: pkg.version,
      chain: e.chain,
      why: reasons.join('; '),
    });
  }
  return out.sort((a, b) => a.chain.localeCompare(b.chain));
}

/**
 * Read pipdeptree JSON from file.
 * @param {string} filePath
 * @returns {{ packages: Map, rootPackages: string[] }}
 */
export function loadPipdeptreeFromFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return parsePipdeptreeJson(content);
  } catch (_) {
    return { packages: new Map(), rootPackages: [] };
  }
}

/**
 * Build a simple text tree from packages + rootPackages for report <details> block.
 * @param {Map<string, { name: string, version: string, requestedBy: string[] }>} packages
 * @param {string[]} rootPackages
 * @param {number} maxDepth - limit depth to avoid huge output (default 4)
 * @returns {string}
 */
export function pipTreeToText(packages, rootPackages, maxDepth = 4) {
  const children = new Map();
  for (const [key, pkg] of packages) {
    for (const parentKey of pkg.requestedBy || []) {
      if (!children.has(parentKey)) children.set(parentKey, []);
      children.get(parentKey).push(key);
    }
  }
  const lines = [];
  function walk(key, prefix, depth) {
    if (depth > maxDepth) return;
    const pkg = packages.get(key);
    if (!pkg) return;
    const label = `${pkg.name}==${pkg.version}`;
    const childKeys = children.get(key) || [];
    for (let i = 0; i < childKeys.length; i++) {
      const isLast = i === childKeys.length - 1;
      const branch = prefix + (isLast ? '└── ' : '├── ');
      const childPkg = packages.get(childKeys[i]);
      if (childPkg) lines.push(branch + `${childPkg.name} [required: *, installed: ${childPkg.version}]`);
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      walk(childKeys[i], nextPrefix, depth + 1);
    }
  }
  for (const rootKey of rootPackages) {
    const pkg = packages.get(rootKey);
    if (pkg) {
      lines.push(`${pkg.name}==${pkg.version}`);
      walk(rootKey, '', 0);
    }
  }
  return lines.join('\n') || '(empty tree)';
}
