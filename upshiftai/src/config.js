/**
 * Load UpshiftAI config from project root: .upshiftai.json (or path from env/config flag).
 * Used for webhooks, approval policy, and HITL.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const DEFAULT_CONFIG = {
  webhooks: [],
  approval: {
    mode: 'prompt',
    requireFor: ['replace', 'major'],
    timeoutMs: 60000,
  },
  platformUrl: '',
  apiKey: '',
};

/**
 * @param {string} projectRoot
 * @param {string} [configPath] - override path to config file
 * @returns {{ webhooks: string[], approval: { mode: 'prompt'|'webhook'|'none', requireFor: string[], webhookUrl?: string, timeoutMs: number } }}
 */
export function loadConfig(projectRoot, configPath) {
  const root = resolve(projectRoot);
  const paths = configPath
    ? [resolve(configPath)]
    : [
        join(root, '.upshiftai.json'),
        join(root, '.upshiftai.jsonc'),
        process.env.UPSHIFTAI_CONFIG ? resolve(process.env.UPSHIFTAI_CONFIG) : null,
      ].filter(Boolean);

  for (const p of paths) {
    if (p && existsSync(p)) {
      try {
        const raw = readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw.replace(/\/\/.*$/gm, '')); // loose jsonc
        return mergeConfig(DEFAULT_CONFIG, parsed);
      } catch {
        // ignore invalid config
      }
    }
  }
  return { ...DEFAULT_CONFIG };
}

function mergeConfig(base, over) {
  const webhooks = Array.isArray(over.webhooks) ? over.webhooks : base.webhooks;
  const approval = over.approval && typeof over.approval === 'object'
    ? { ...base.approval, ...over.approval }
    : base.approval;
  const platformUrl = over.platformUrl ?? base.platformUrl ?? '';
  const apiKey = over.apiKey ?? base.apiKey ?? '';
  return { webhooks, approval, platformUrl, apiKey };
}

/**
 * Whether this action type requires approval per config.
 * @param {{ requireFor: string[] }} approval
 * @param {string} action - 'upgrade' | 'replace' | 'pin'
 * @param {{ isMajor?: boolean }} context
 */
export function requiresApproval(approval, action, context = {}) {
  const req = approval.requireFor || [];
  if (req.includes('replace') && action === 'replace') return true;
  if (req.includes('major') && action === 'upgrade' && context.isMajor) return true;
  if (req.includes('pin') && action === 'pin') return true;
  return false;
}
