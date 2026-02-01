/**
 * Replacement suggestions for known deprecated or legacy packages.
 * Key: package name (lowercase). Value: { replacement, note, action?, targetPackage?, targetVersion? }.
 * action: 'replace' | 'upgrade' | 'pin' for future automations.
 * Load .upshiftai-suggestions.json from project root to merge custom suggestions.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const CUSTOM_FILE = '.upshiftai-suggestions.json';
const customSuggestions = new Map();
let lastLoadedRoot = null;

/**
 * Load custom suggestions from projectRoot/.upshiftai-suggestions.json (merge with built-in).
 * @param {string} projectRoot
 */
export function loadCustomSuggestions(projectRoot) {
  const root = resolve(projectRoot);
  if (lastLoadedRoot === root) return;
  lastLoadedRoot = root;
  customSuggestions.clear();
  const path = join(root, CUSTOM_FILE);
  if (!existsSync(path)) return;
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    for (const [name, value] of Object.entries(data)) {
      if (value && typeof value.replacement === 'string') {
        const key = name.toLowerCase().trim().replace(/_/g, '-');
        customSuggestions.set(key, {
          replacement: value.replacement,
          note: value.note || '',
          action: value.action || 'replace',
          targetPackage: value.targetPackage,
          targetVersion: value.targetVersion,
        });
      }
    }
  } catch {
    // ignore invalid file
  }
}

const REPLACEMENTS = new Map([
  // npm
  ['lodash', { replacement: 'lodash-es (or native)', note: 'Tree-shakeable or use built-in Array/Object methods', action: 'replace' }],
  ['request', { replacement: 'axios, node-fetch, or undici', note: 'request is deprecated', action: 'replace' }],
  ['node-sass', { replacement: 'sass (dart-sass)', note: 'node-sass is deprecated', action: 'replace', targetPackage: 'sass' }],
  ['gulp-util', { replacement: 'individual packages or custom', note: 'gulp-util is deprecated', action: 'replace' }],
  ['babel-preset-es2015', { replacement: '@babel/preset-env', note: 'Use Babel 7 presets', action: 'replace', targetPackage: '@babel/preset-env' }],
  ['babel-preset-stage-0', { replacement: '@babel/preset-env + plugin', note: 'Stage presets removed', action: 'replace' }],
  ['uuid', { replacement: 'crypto.randomUUID() (Node 19+)', note: 'Built-in where available', action: 'replace' }],
  ['left-pad', { replacement: 'String.prototype.padStart or small util', note: 'Unmaintained', action: 'replace' }],
  ['event-stream', { replacement: 'events, EventEmitter', note: 'Compromised; use stdlib', action: 'replace' }],
  ['moment', { replacement: 'date-fns, dayjs, or Temporal', note: 'Moment is in maintenance mode', action: 'replace', targetPackage: 'date-fns' }],
  ['express-session', { replacement: 'better-sqlite3 + custom or redis', note: 'If replacing memory store', action: 'replace' }],
  // pip
  ['six', { replacement: 'stdlib (Python 3)', note: 'six is a Python 2/3 compat shim; remove and use built-ins on 3.x', action: 'replace' }],
  ['python-dateutil', { replacement: 'zoneinfo (stdlib 3.9+) or datetime', note: 'For timezone handling use zoneinfo; for parsing consider datetime or dateutil 2.x', action: 'replace' }],
  ['ntplib', { replacement: 'ntplib (pin) or system NTP / chrony', note: 'No release in years; pin version and document or use system NTP', action: 'pin' }],
  ['enum34', { replacement: 'stdlib enum (Python 3.4+)', note: 'enum34 only for Python 2; remove on 3.x', action: 'replace' }],
  ['futures', { replacement: 'concurrent.futures (stdlib 3.2+)', note: 'futures is backport for 2.7; remove on 3.x', action: 'replace' }],
  ['configparser', { replacement: 'configparser (stdlib)', note: 'On Python 3 use stdlib configparser; drop backport', action: 'replace' }],
  ['typing', { replacement: 'typing (stdlib 3.5+)', note: 'On 3.5+ use stdlib typing; drop backport', action: 'replace' }],
  ['backports.ssl-match-hostname', { replacement: 'stdlib ssl (Python 3.2+)', note: 'Backport for 2.x; remove on 3.x', action: 'replace' }],
  ['subprocess32', { replacement: 'subprocess (stdlib 3.2+)', note: 'Backport for 2.7; remove on 3.x', action: 'replace' }],
]);

/**
 * @param {string} name - package name (any case)
 * @returns {{ replacement: string, note: string, action?: 'replace'|'upgrade'|'pin', targetPackage?: string, targetVersion?: string } | undefined}
 */
export function getReplacementSuggestions(name) {
  if (!name || typeof name !== 'string') return undefined;
  const key = name.toLowerCase().trim().replace(/_/g, '-');
  return customSuggestions.get(key) ?? REPLACEMENTS.get(key);
}

/**
 * Enrich report entries with suggestion when available.
 * @param {object} report - from buildReport
 * @returns {object} report with entries[].suggestion added where known
 */
export function addSuggestionsToReport(report) {
  if (!report.entries) return report;
  const entries = report.entries.map((e) => {
    const suggestion = getReplacementSuggestions(e.name);
    return suggestion ? { ...e, suggestion } : e;
  });
  return { ...report, entries };
}
