/**
 * Checkpoint and rollback for safe automations.
 * Saves manifest + lockfile copies to .upshiftai-tmp/checkpoints/<timestamp>/;
 * rollback restores from latest checkpoint.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

const CHECKPOINTS_DIR = '.upshiftai-tmp/checkpoints';
const META_FILE = 'meta.json';

/**
 * Detect ecosystem from project root (same logic as analyze: lockfile presence).
 * @param {string} projectRoot
 * @returns {'npm'|'pip'|null}
 */
export function detectEcosystem(projectRoot) {
  const root = resolve(projectRoot);
  if (existsSync(join(root, 'package-lock.json')) || existsSync(join(root, 'package.json'))) return 'npm';
  if (existsSync(join(root, 'pyproject.toml')) || existsSync(join(root, 'requirements.txt'))) return 'pip';
  return null;
}

/**
 * List manifest/lockfile paths we should checkpoint for this ecosystem.
 * @param {string} projectRoot
 * @param {'npm'|'pip'} ecosystem
 * @returns {Array<{ absolute: string, rel: string }>}
 */
export function getCheckpointFiles(projectRoot, ecosystem) {
  const root = resolve(projectRoot);
  const out = [];
  if (ecosystem === 'npm') {
    if (existsSync(join(root, 'package.json'))) out.push({ absolute: join(root, 'package.json'), rel: 'package.json' });
    if (existsSync(join(root, 'package-lock.json'))) out.push({ absolute: join(root, 'package-lock.json'), rel: 'package-lock.json' });
  }
  if (ecosystem === 'pip') {
    if (existsSync(join(root, 'pyproject.toml'))) out.push({ absolute: join(root, 'pyproject.toml'), rel: 'pyproject.toml' });
    if (existsSync(join(root, 'requirements.txt'))) out.push({ absolute: join(root, 'requirements.txt'), rel: 'requirements.txt' });
    const reqDir = join(root, 'requirements');
    if (existsSync(reqDir)) {
      try {
        for (const name of readdirSync(reqDir)) {
          if (name.endsWith('.txt')) {
            const abs = join(reqDir, name);
            out.push({ absolute: abs, rel: `requirements/${name}` });
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return out;
}

/**
 * Create a checkpoint: copy manifest/lockfile into .upshiftai-tmp/checkpoints/<timestamp>/.
 * @param {string} projectRoot
 * @param {{ ecosystem?: 'npm'|'pip', reason?: string }} options
 * @returns {{ path: string, timestamp: string, files: string[] } | { error: string }}
 */
export function createCheckpoint(projectRoot, options = {}) {
  if (!projectRoot || typeof projectRoot !== 'string') return { error: 'Invalid project root' };
  const root = resolve(projectRoot);
  if (!existsSync(root)) return { error: `Path does not exist: ${root}` };
  try {
    if (!statSync(root).isDirectory()) return { error: `Path is not a directory: ${root}` };
  } catch (e) {
    return { error: e?.message || 'Invalid path' };
  }
  const ecosystem = options.ecosystem ?? detectEcosystem(root);
  if (!ecosystem) {
    return { error: 'No npm or pip project found (no package-lock.json/pyproject.toml/requirements.txt)' };
  }
  const files = getCheckpointFiles(root, ecosystem);
  if (files.length === 0) {
    return { error: `No manifest files found for ${ecosystem}` };
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cpDir = join(root, CHECKPOINTS_DIR, timestamp);
  try {
    if (!existsSync(cpDir)) mkdirSync(cpDir, { recursive: true });
    for (const { absolute, rel } of files) {
      if (!existsSync(absolute)) return { error: `Manifest file missing: ${absolute}` };
      const dest = join(cpDir, rel);
      const destDir = resolve(dest, '..');
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
      copyFileSync(absolute, dest);
    }
    const meta = {
      timestamp: new Date().toISOString(),
      ecosystem,
      reason: options.reason || 'manual',
      files: files.map((f) => f.rel),
    };
    writeFileSync(join(cpDir, META_FILE), JSON.stringify(meta, null, 2), 'utf8');
    return { path: cpDir, timestamp, files: files.map((f) => f.rel) };
  } catch (e) {
    return { error: e?.message || 'Checkpoint failed' };
  }
}

/**
 * List all checkpoints (newest first).
 * @param {string} projectRoot
 * @returns {Array<{ timestamp: string, path: string, reason: string }>}
 */
export function listCheckpoints(projectRoot) {
  const root = resolve(projectRoot);
  const base = join(root, CHECKPOINTS_DIR);
  if (!existsSync(base)) return [];
  const out = [];
  try {
    const names = readdirSync(base).filter((n) => {
      const full = join(base, n);
      return existsSync(join(full, META_FILE));
    }).sort().reverse();
    for (const name of names) {
      const full = join(base, name);
      try {
        const raw = readFileSync(join(full, META_FILE), 'utf8');
        const meta = raw && raw.trim() ? JSON.parse(raw) : {};
        out.push({ timestamp: name, path: full, reason: meta.reason || 'manual' });
      } catch (_) {
        out.push({ timestamp: name, path: full, reason: 'manual' });
      }
    }
  } catch (_) {
    // ignore
  }
  return out;
}

/**
 * Find the latest checkpoint directory (by name = timestamp).
 * @param {string} projectRoot
 * @returns {string|null} path to checkpoint dir or null
 */
export function getLatestCheckpoint(projectRoot) {
  const list = listCheckpoints(projectRoot);
  return list.length ? list[0].path : null;
}

/**
 * Restore project from a checkpoint (latest or specified timestamp).
 * @param {string} projectRoot
 * @param {{ dryRun?: boolean, checkpoint?: string }} options - checkpoint = timestamp dir name (e.g. from --checkpoint=2026-01-29T12-00-00)
 * @returns {{ restored: string[], checkpoint: string } | { error: string }}
 */
export function rollback(projectRoot, options = {}) {
  const root = resolve(projectRoot);
  let cpPath = null;
  if (options.checkpoint) {
    const full = join(root, CHECKPOINTS_DIR, options.checkpoint);
    if (existsSync(full) && existsSync(join(full, META_FILE))) cpPath = full;
  }
  if (!cpPath) cpPath = getLatestCheckpoint(root);
  if (!cpPath) {
    return { error: 'No checkpoint found. Run "upshiftai-deps checkpoint" first, or use --checkpoint=TS with "upshiftai-deps checkpoint --list".' };
  }
  const metaPath = join(cpPath, META_FILE);
  let meta;
  try {
    const raw = readFileSync(metaPath, 'utf8');
    if (!raw || !raw.trim()) return { error: 'Checkpoint meta file is empty' };
    meta = JSON.parse(raw);
  } catch (e) {
    return { error: e instanceof SyntaxError ? 'Invalid checkpoint meta' : (e?.message || 'Failed to read checkpoint') };
  }
  const files = Array.isArray(meta.files) ? meta.files : [];
  if (options.dryRun) {
    return { restored: files, checkpoint: cpPath, dryRun: true };
  }
  const restored = [];
  for (const rel of files) {
    const src = join(cpPath, rel);
    const dest = join(root, rel);
    if (existsSync(src)) {
      const destDir = resolve(dest, '..');
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
      copyFileSync(src, dest);
      restored.push(rel);
    }
  }
  return { restored, checkpoint: cpPath };
}
