/**
 * upshiftai — ancient dependency lineage.
 * Resolve tree, fetch registry metadata, detect ancient/legacy/fork, output report.
 */

import { join, resolve } from 'path';
import { loadLockfile, flattenPackages, buildTreeWithDepth, fetchRegistryMetadata } from './resolvers/npm.js';
import { runNpmAudit, runPipAudit } from './audit.js';
import { loadRequirements, requirementsToTree, fetchPyPIMetadata } from './resolvers/pip.js';
import { loadGoMod, goModToTree, fetchGoProxyMetadata } from './resolvers/go.js';
import { buildReport, reportToMarkdown } from './report.js';

/**
 * Analyze a project directory. Auto-detects npm, pip, or go (first found).
 *
 * @param {string} projectRoot - path to project
 * @param {{ ancientMonths?: number, fetchRegistry?: boolean, ecosystem?: 'npm'|'pip'|'go'|'auto' }} options
 * @returns {Promise<object>} report
 */
export async function analyze(projectRoot, options = {}) {
  const ecosystem = options.ecosystem ?? 'auto';
  if (ecosystem === 'npm') return analyzeNpm(projectRoot, options);
  if (ecosystem === 'pip') return analyzePip(projectRoot, options);
  if (ecosystem === 'go') return analyzeGo(projectRoot, options);
  const npmLoaded = loadLockfile(projectRoot);
  if (npmLoaded && !npmLoaded.error) return analyzeNpm(projectRoot, options);
  if (loadRequirements(projectRoot)) return analyzePip(projectRoot, options);
  if (loadGoMod(projectRoot)) return analyzeGo(projectRoot, options);
  return {
    ok: false,
    error: 'No package-lock.json, requirements.txt, or go.mod found',
    summary: { total: 0, ancient: 0, deprecated: 0, forkHint: 0 },
    entries: [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Analyze npm project (package-lock.json).
 */
export async function analyzeNpm(projectRoot, options = {}) {
  const fetchRegistry = options.fetchRegistry !== false;
  const ancientMonths = options.ancientMonths ?? 24;

  const loaded = loadLockfile(projectRoot);
  if (!loaded) {
    return {
      ok: false,
      error: 'No package-lock.json found',
      summary: { total: 0, ancient: 0, deprecated: 0, forkHint: 0 },
      entries: [],
      generatedAt: new Date().toISOString(),
    };
  }
  if (loaded.error) {
    return {
      ok: false,
      error: loaded.error,
      summary: { total: 0, ancient: 0, deprecated: 0, forkHint: 0 },
      entries: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const { lockfile } = loaded;
  const flat = flattenPackages(lockfile);
  const tree = buildTreeWithDepth(flat, lockfile);

  const metadata = new Map();
  if (fetchRegistry) {
    const seen = new Set();
    const uniqueNodes = [];
    for (const node of tree) {
      const key = node.key;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueNodes.push(node);
    }
    const cacheDir = options.cacheDir ?? join(resolve(projectRoot), '.upshiftai-tmp', 'cache');
    const concurrency = Math.min(options.concurrency ?? 10, 20);
    const fetchOpts = { cacheDir, cacheTtlMs: options.cacheTtlMs };
    for (let i = 0; i < uniqueNodes.length; i += concurrency) {
      const batch = uniqueNodes.slice(i, i + concurrency);
      const metas = await Promise.all(
        batch.map((n) => fetchRegistryMetadata(n.name, n.version, fetchOpts))
      );
      batch.forEach((n, j) => {
        metadata.set(n.key, metas[j]);
        metadata.set(n.name, metas[j]);
      });
    }
  }

  const report = buildReport(tree, metadata, { ancientMonths });
  report.ok = true;
  report.ecosystem = 'npm';
  if (options.runAudit !== false) {
    const audit = runNpmAudit(projectRoot);
    if (audit) {
      report.audit = {
        critical: audit.critical,
        high: audit.high,
        moderate: audit.moderate,
        low: audit.low,
      };
      report.auditVulnerabilities = audit.vulnerabilities;
    }
  }
  return report;
}

/**
 * Analyze pip project (requirements.txt).
 */
export async function analyzePip(projectRoot, options = {}) {
  const fetchRegistry = options.fetchRegistry !== false;
  const ancientMonths = options.ancientMonths ?? 24;

  const loaded = loadRequirements(projectRoot);
  if (!loaded) {
    return {
      ok: false,
      error: 'No requirements.txt found',
      summary: { total: 0, ancient: 0, deprecated: 0, forkHint: 0 },
      entries: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const tree = requirementsToTree(loaded.requirements);
  const metadata = new Map();
  if (fetchRegistry) {
    const cacheDir = options.cacheDir ?? join(resolve(projectRoot), '.upshiftai-tmp', 'cache');
    const concurrency = Math.min(options.concurrency ?? 10, 20);
    const fetchOpts = { cacheDir, cacheTtlMs: options.cacheTtlMs };
    const nodes = [...tree];
    for (let i = 0; i < nodes.length; i += concurrency) {
      const batch = nodes.slice(i, i + concurrency);
      const metas = await Promise.all(
        batch.map((n) => fetchPyPIMetadata(n.name, n.version, fetchOpts))
      );
      batch.forEach((n, j) => {
        metadata.set(n.key, metas[j]);
        metadata.set(n.name, metas[j]);
      });
    }
  }

  const report = buildReport(tree, metadata, { ancientMonths });
  report.ok = true;
  report.ecosystem = 'pip';
  if (options.runAudit !== false) {
    const pipAudit = runPipAudit(projectRoot);
    if (pipAudit) {
      report.audit = {
        critical: pipAudit.critical,
        high: pipAudit.high,
        moderate: pipAudit.moderate,
        low: pipAudit.low,
      };
      report.auditVulnerabilities = pipAudit.vulnerabilities;
    }
  }
  return report;
}

/**
 * Analyze Go project (go.mod). Optionally fetch GOPROXY for lastPublish per module.
 */
export async function analyzeGo(projectRoot, options = {}) {
  const ancientMonths = options.ancientMonths ?? 24;
  const fetchRegistry = options.fetchRegistry !== false;

  const loaded = loadGoMod(projectRoot);
  if (!loaded) {
    return {
      ok: false,
      error: 'No go.mod found',
      summary: { total: 0, ancient: 0, deprecated: 0, forkHint: 0 },
      entries: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const tree = goModToTree(loaded);
  const metadata = new Map();
  if (fetchRegistry) {
    const cacheDir = options.cacheDir ?? join(resolve(projectRoot), '.upshiftai-tmp', 'cache');
    const concurrency = Math.min(options.concurrency ?? 10, 20);
    const fetchOpts = { cacheDir, cacheTtlMs: options.cacheTtlMs };
    for (let i = 0; i < tree.length; i += concurrency) {
      const batch = tree.slice(i, i + concurrency);
      const metas = await Promise.all(
        batch.map((n) => fetchGoProxyMetadata(n.name, n.version, fetchOpts))
      );
      batch.forEach((n, j) => {
        metadata.set(n.key, metas[j]);
        metadata.set(n.name, metas[j]);
      });
    }
  }
  const report = buildReport(tree, metadata, { ancientMonths });
  report.ok = true;
  report.ecosystem = 'go';
  return report;
}

/**
 * Same as analyze() but also return markdown string.
 *
 * @param {string} projectRoot
 * @param {{ ancientMonths?: number, fetchRegistry?: boolean }} options
 * @returns {Promise<{ report: object, markdown: string }>}
 */
export async function analyzeWithMarkdown(projectRoot, options = {}) {
  const report = await analyze(projectRoot, options);
  const markdown = reportToMarkdown(report);
  return { report, markdown };
}

export { loadLockfile, flattenPackages, buildTreeWithDepth, fetchRegistryMetadata } from './resolvers/npm.js';
export { loadRequirements, requirementsToTree, fetchPyPIMetadata } from './resolvers/pip.js';
export { loadGoMod, goModToTree, loadGoSum, fetchGoProxyMetadata } from './resolvers/go.js';
export { analyzePackage, ageSignal, forkHint, isDeprecated, isOldPython } from './detectors/ancient.js';
export { buildReport, reportToMarkdown, reportToCsv } from './report.js';
export { createCheckpoint, rollback, getLatestCheckpoint, getCheckpointFiles, listCheckpoints, detectEcosystem } from './checkpoint.js';
export { loadConfig, requiresApproval } from './config.js';
export { on, off, emit, requestApproval } from './events.js';
export { approvalGate, applyNpmUpgrade, applyNpmReplace, applyPipUpgrade, applyPipReplace } from './apply.js';
export { getReplacementSuggestions, loadCustomSuggestions } from './suggestions.js';
export { buildOnePager, buildFullReport } from './report-full.js';
export { runNpmAudit, runPipAudit } from './audit.js';
