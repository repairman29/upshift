/**
 * npm audit: run npm audit --json and return simplified counts + list.
 * pip-audit: run pip-audit --format json when available for pip projects.
 */

import { spawnSync } from 'child_process';
import { resolve } from 'path';

/**
 * @param {string} projectRoot
 * @returns {{ critical: number, high: number, moderate: number, low: number, vulnerabilities: Array<{ name: string, severity: string, via: string }> } | null }
 */
export function runNpmAudit(projectRoot) {
  const root = resolve(projectRoot);
  const r = spawnSync('npm', ['audit', '--json'], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (r.status !== 0 && r.status !== 1) return null; // 1 = vulnerabilities found
  try {
    const data = JSON.parse(r.stdout || '{}');
    const vulns = data.vulnerabilities || {};
    const list = [];
    for (const [name, v] of Object.entries(vulns)) {
      const severity = (v.severity || 'moderate').toLowerCase();
      const via = (v.via && Array.isArray(v.via) ? v.via[0] : v.via);
      const viaStr = typeof via === 'string' ? via : (via?.title || via?.url || '');
      list.push({ name, severity, via: viaStr });
    }
    list.sort((a, b) => {
      const order = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 5) - (order[b.severity] ?? 5);
    });
    const critical = data.metadata?.vulnerabilities?.critical ?? list.filter((x) => x.severity === 'critical').length;
    const high = data.metadata?.vulnerabilities?.high ?? list.filter((x) => x.severity === 'high').length;
    const moderate = data.metadata?.vulnerabilities?.moderate ?? list.filter((x) => x.severity === 'moderate').length;
    const low = data.metadata?.vulnerabilities?.low ?? list.filter((x) => x.severity === 'low').length;
    return { critical, high, moderate, low, vulnerabilities: list };
  } catch (_) {
    return null;
  }
}

/**
 * Run pip-audit --format json when pip-audit is installed. Returns same shape as runNpmAudit.
 * If pip-audit is not in PATH or fails, returns null (report still works without security section).
 *
 * @param {string} projectRoot
 * @returns {{ critical: number, high: number, moderate: number, low: number, vulnerabilities: Array<{ name: string, severity: string, via: string }> } | null }
 */
export function runPipAudit(projectRoot) {
  const root = resolve(projectRoot);
  const r = spawnSync('pip-audit', ['--format', 'json'], { cwd: root, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, timeout: 60000 });
  if (r.error || r.status === null) return null; // not installed or timeout
  try {
    const data = JSON.parse(r.stdout || '{}');
    const deps = data.dependencies || data.vulnerabilities;
    if (!Array.isArray(deps)) return null;
    const list = [];
    for (const dep of deps) {
      const name = dep.name || dep.package;
      const vulns = dep.vulns || dep.vulnerabilities || [];
      for (const v of vulns) {
        const id = v.id || v.aliases?.[0] || v.name || '';
        const severity = (v.severity || 'high').toLowerCase();
        const via = typeof id === 'string' ? id : (v.details || '');
        list.push({ name: name || 'unknown', severity, via });
      }
    }
    list.sort((a, b) => {
      const order = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
      return (order[a.severity] ?? 5) - (order[b.severity] ?? 5);
    });
    const critical = list.filter((x) => x.severity === 'critical').length;
    const high = list.filter((x) => x.severity === 'high').length;
    const moderate = list.filter((x) => x.severity === 'moderate').length;
    const low = list.filter((x) => x.severity === 'low').length;
    return { critical, high, moderate, low, vulnerabilities: list };
  } catch (_) {
    return null;
  }
}
