/**
 * Heuristics for "ancient" / legacy / forked dependencies.
 */

/**
 * @param {string} [lastPublish] - ISO date string from registry
 * @param {number} ancientMonths - months without publish to consider ancient (default 24)
 * @returns {{ ancient: boolean, monthsSincePublish: number | null }}
 */
export function ageSignal(lastPublish, ancientMonths = 24) {
  if (!lastPublish) return { ancient: false, monthsSincePublish: null };
  const then = new Date(lastPublish);
  if (Number.isNaN(then.getTime())) return { ancient: false, monthsSincePublish: null };
  const now = new Date();
  const months = (now.getTime() - then.getTime()) / (30 * 24 * 60 * 60 * 1000);
  return {
    ancient: months >= ancientMonths,
    monthsSincePublish: Math.round(months * 10) / 10,
  };
}

/**
 * @param {string} name - package name
 * @returns {boolean} - true if name suggests a fork/legacy variant
 */
export function forkHint(name) {
  if (!name || typeof name !== 'string') return false;
  const lower = name.toLowerCase();
  const hints = ['-fork', '-legacy', '-old', '-unofficial', '.fork', 'fork-', 'legacy-', 'old-', 'unofficial-'];
  return hints.some((h) => lower.includes(h));
}

/**
 * @param {string} [deprecated] - npm deprecated message
 * @returns {boolean}
 */
export function isDeprecated(deprecated) {
  return Boolean(deprecated && String(deprecated).trim().length > 0);
}

/**
 * Heuristic: does requires_python spec suggest old Python (2.7, 3.0–3.5)?
 * Don't flag modern-only specs like ">=3.10" or "<3.13,>=3.10".
 * @param {string} [spec] - e.g. ">=3.8", "==2.7.*", ">=2.7"
 * @returns {boolean}
 */
export function isOldPython(spec) {
  if (!spec || typeof spec !== 'string') return false;
  const s = spec.trim();
  if (/2\.7|==2\.|<=2\./.test(s)) return true; // Python 2
  if (/^<3$|,<3,|,<3$/.test(s)) return true;  // under 3 (not <3.13)
  if (/>=3\.([0-5])\b/.test(s)) return true;  // 3.0–3.5 only
  return false;
}

/**
 * Combine all signals for one package.
 *
 * @param {object} pkg - { name, version, deprecated, ... }
 * @param {{ lastPublish?: string, deprecated?: string, requiresPython?: string }} meta - from registry
 * @param {{ ancientMonths?: number }} options
 * @returns {{ ancient: boolean, deprecated: boolean, forkHint: boolean, oldPython: boolean, monthsSincePublish: number | null, reasons: string[] }}
 */
export function analyzePackage(pkg, meta = {}, options = {}) {
  const ancientMonths = options.ancientMonths ?? 24;
  const reasons = [];

  const dep = isDeprecated(pkg.deprecated ?? meta.deprecated);
  if (dep) reasons.push('deprecated');

  const { ancient, monthsSincePublish } = ageSignal(meta.lastPublish, ancientMonths);
  if (ancient && monthsSincePublish != null) reasons.push(`no publish in ${monthsSincePublish} months`);
  else if (monthsSincePublish != null) reasons.push(`last publish ${monthsSincePublish} months ago`);

  const fork = forkHint(pkg.name);
  if (fork) reasons.push('name suggests fork/legacy');

  const oldPy = isOldPython(meta.requiresPython);
  if (oldPy) reasons.push(`requires old Python: ${meta.requiresPython}`);

  return {
    ancient: ancient || dep || oldPy,
    deprecated: dep,
    forkHint: fork,
    oldPython: oldPy,
    monthsSincePublish: monthsSincePublish ?? null,
    reasons,
  };
}
