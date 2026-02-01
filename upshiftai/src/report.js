/**
 * Build and format the ancient-dependency report.
 */

import { analyzePackage } from './detectors/ancient.js';
import { getReplacementSuggestions } from './suggestions.js';

/**
 * @param {Array<object>} tree - entries from buildTreeWithDepth
 * @param {Map<string, { lastPublish?: string, deprecated?: string }>} metadata - key -> registry meta
 * @param {{ ancientMonths?: number }} options
 * @returns {object} report
 */
export function buildReport(tree, metadata, options = {}) {
  const entries = [];
  let ancientCount = 0;
  const nodeList = Array.isArray(tree) ? tree : [];
  const metaMap = metadata && typeof metadata.get === 'function' ? metadata : new Map();

  for (const node of nodeList) {
    if (!node || typeof node !== 'object') continue;
    const key = node.key;
    const meta = metaMap.get(key) || metaMap.get(node.name) || {};
    const signals = analyzePackage(
      { name: node.name, version: node.version, deprecated: node.deprecated },
      meta,
      options
    );

    const latestVersion = meta.latestVersion;
    const license = meta.license;
    const entry = {
      key,
      name: node.name,
      version: node.version,
      depth: node.depth,
      why: node.why,
      latestVersion: latestVersion || undefined,
      license: license || undefined,
      ...signals,
    };
    entries.push(entry);
    if (signals.ancient) ancientCount++;
  }

  // Sort: ancient first, then by depth, then by name
  entries.sort((a, b) => {
    if (a.ancient !== b.ancient) return a.ancient ? -1 : 1;
    if (a.depth !== b.depth) return a.depth - b.depth;
    return (a.name || '').localeCompare(b.name || '');
  });

  const directCount = entries.filter((e) => e.depth === 1).length;
  const transitiveCount = entries.length - directCount;
  return {
    summary: {
      total: entries.length,
      direct: directCount,
      transitive: transitiveCount,
      ancient: ancientCount,
      deprecated: entries.filter((e) => e.deprecated).length,
      forkHint: entries.filter((e) => e.forkHint).length,
      oldPython: entries.filter((e) => e.oldPython).length,
    },
    entries,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * @param {object} report - from buildReport
 * @returns {string} markdown
 */
export function reportToMarkdown(report) {
  const { summary, entries } = report;
  const oldPyCount = summary.oldPython ?? 0;
  const lines = [
    '# Dependency Lineage Report',
    '',
    `**Total packages:** ${summary.total} | **Ancient/legacy:** ${summary.ancient} | **Deprecated:** ${summary.deprecated} | **Fork hints:** ${summary.forkHint}${oldPyCount ? ` | **Old Python:** ${oldPyCount}` : ''}`,
    '',
    '## Ancient or problematic',
    '',
  ];

  const problematic = entries.filter((e) => e.ancient || e.deprecated || e.forkHint || e.oldPython);
  if (problematic.length === 0) {
    lines.push('None detected.');
  } else {
    const hasLatest = problematic.some((e) => e.latestVersion && e.latestVersion !== e.version);
    const headers = hasLatest
      ? '| Package | Version | Latest | Depth | Reasons |'
      : '| Package | Version | Depth | Reasons |';
    lines.push(headers);
    lines.push(hasLatest ? '|---------|---------|-------|-------|---------|' : '|---------|---------|-------|---------|');
    for (const e of problematic) {
      const reasons = e.reasons.join('; ') || '—';
      if (hasLatest) {
        const latest = e.latestVersion && e.latestVersion !== e.version ? e.latestVersion : '—';
        lines.push(`| ${e.name} | ${e.version} | ${latest} | ${e.depth} | ${reasons} |`);
      } else {
        lines.push(`| ${e.name} | ${e.version} | ${e.depth} | ${reasons} |`);
      }
    }
  }

  if (report.ecosystem === 'pip') {
    lines.push('');
    lines.push('## ⚠️ Pip: what this report *doesn’t* show');
    lines.push('');
    lines.push('This report lists **direct** dependencies from `pyproject.toml` or `requirements.txt` only. It does **not** resolve the full **transitive** tree (the things *those* packages depend on). So if “everything depends on something old,” that “something old” is often a *transitive* dep—not listed above. To see the full tree and who pulls in old Python / old packages, run:');
    lines.push('');
    lines.push('```bash');
    lines.push('pip install pipdeptree');
    lines.push('pip install -e .   # or pip install -r requirements.txt');
    lines.push('pipdeptree       # full tree with who-depends-on-who');
    lines.push('pipdeptree --warn fail  # fail on conflicting deps');
    lines.push('```');
    lines.push('');
  }

  lines.push('');
  lines.push('---');
  lines.push(`Generated ${report.generatedAt}`);
  return lines.join('\n');
}

/**
 * @param {object} report - from buildReport
 * @param {{ includeSuggestions?: boolean }} options
 * @returns {string} CSV (header + rows)
 */
export function reportToCsv(report, options = {}) {
  const includeSuggestions = options.includeSuggestions !== false;
  const headers = ['name', 'version', 'depth', 'ancient', 'deprecated', 'forkHint', 'reasons', ...(includeSuggestions ? ['replacement', 'note'] : [])];
  const rows = report.entries.map((e) => {
    const base = [e.name, e.version, e.depth, e.ancient, e.deprecated, e.forkHint, (e.reasons || []).join('; ')];
    if (includeSuggestions) {
      const suggestion = getReplacementSuggestions(e.name);
      base.push(suggestion?.replacement ?? '', suggestion?.note ?? '');
    }
    return base.map((c) => (typeof c === 'string' && (c.includes(',') || c.includes('"') || c.includes('\n')) ? `"${String(c).replace(/"/g, '""')}"` : c)).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}
