/**
 * Apply upgrade or replace with checkpoint, verify, rollback, and events.
 * HITL: approval gate before executing when config says so.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { createCheckpoint, rollback as doRollback } from './checkpoint.js';
import { loadConfig, requiresApproval } from './config.js';
import { emit, requestApproval } from './events.js';

/** CLI prompt for approval (ESM: readline is async import). */
async function promptApprovalAsync(message) {
  const { createInterface } = await import('readline');
  return new Promise((resolvePromise) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolvePromise(/^y/i.test(answer?.trim() || ''));
    });
  });
}

/**
 * Run approval gate: if action needs approval per config, prompt or call approval webhook.
 * @param {object} config - from loadConfig
 * @param {string} action - 'upgrade' | 'replace' | 'pin'
 * @param {object} context - { pkg, targetVersion?, targetPackage?, isMajor?, projectRoot }
 * @returns {Promise<boolean>} true = approved (or not required)
 */
export async function approvalGate(config, action, context) {
  const { approval } = config;
  if (!requiresApproval(approval, action, context)) return true;
  if (approval.mode === 'none') return true;
  if (approval.mode === 'webhook' && approval.webhookUrl) {
    const result = await requestApproval(
      approval.webhookUrl,
      { action, ...context },
      { timeoutMs: approval.timeoutMs }
    );
    return result.approved;
  }
  if (approval.mode === 'prompt' && typeof process !== 'undefined' && process.stdin && !process.stdin.isTTY) {
    return false; // non-interactive: require --yes or webhook
  }
  const msg = `Apply ${action} ${context.pkg}${context.targetPackage ? ` → ${context.targetPackage}` : ''}${context.targetVersion ? ` @ ${context.targetVersion}` : ''}?`;
  return await promptApprovalAsync(msg);
}

/**
 * Verify npm: run npm ls; exit 0 = ok.
 * @param {string} projectRoot
 * @returns {{ ok: boolean, stderr?: string }}
 */
const NPM_SPAWN_OPTS = { encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024 };

function verifyNpm(projectRoot) {
  const r = spawnSync('npm', ['ls'], { cwd: projectRoot, ...NPM_SPAWN_OPTS });
  return { ok: r.status === 0, stderr: r.stderr };
}

/**
 * Get latest version of npm package from registry.
 * @param {string} name
 * @returns {Promise<string|null>}
 */
async function npmLatestVersion(name) {
  const r = spawnSync('npm', ['view', name, 'version'], { encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
  if (r.status !== 0 || !r.stdout) return null;
  return String(r.stdout).trim();
}

/**
 * Check if target version is a major bump vs current (loose: compare first number).
 * @param {string} current - e.g. "1.2.3"
 * @param {string} target - e.g. "2.0.0"
 */
function isMajorBump(current, target) {
  const c = parseInt(current.split('.')[0], 10);
  const t = parseInt(target.split('.')[0], 10);
  return !Number.isNaN(c) && !Number.isNaN(t) && t > c;
}

/**
 * Apply npm upgrade: set dependency to targetVersion (or latest) and run npm install.
 * @param {string} projectRoot
 * @param {string} pkg - package name
 * @param {string} [targetVersion] - e.g. "latest" or "2.0.0"
 * @param {object} [options] - { dryRun, config, emit }
 */
function safeReadPackageJson(root) {
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) return { error: 'No package.json' };
  try {
    const raw = readFileSync(pkgPath, 'utf8');
    if (!raw || !raw.trim()) return { error: 'package.json is empty' };
    const pkgJson = JSON.parse(raw);
    if (!pkgJson || typeof pkgJson !== 'object') return { error: 'package.json is invalid' };
    return { pkgJson, pkgPath };
  } catch (e) {
    return { error: e instanceof SyntaxError ? 'Invalid JSON in package.json' : (e?.message || 'Failed to read package.json') };
  }
}

export async function applyNpmUpgrade(projectRoot, pkg, targetVersion, options = {}) {
  if (!projectRoot || typeof projectRoot !== 'string') return { ok: false, error: 'Invalid project root' };
  const root = resolve(projectRoot);
  if (!existsSync(root)) return { ok: false, error: `Path does not exist: ${root}` };
  const config = options.config ?? loadConfig(root);
  const webhooks = config.webhooks || [];
  const loaded = safeReadPackageJson(root);
  if (loaded.error) return { ok: false, error: loaded.error };
  const { pkgJson, pkgPath } = loaded;
  const deps = pkgJson.dependencies || {};
  const devDeps = pkgJson.devDependencies || {};
  const current = deps[pkg] ?? devDeps[pkg];
  const inDev = pkg in devDeps;
  if (!current) return { ok: false, error: `Package ${pkg} not found in dependencies` };
  const target = targetVersion === 'latest' || !targetVersion
    ? await npmLatestVersion(pkg)
    : targetVersion;
  if (!target) return { ok: false, error: `Could not resolve version for ${pkg}` };
  const isMajor = isMajorBump((current.replace(/^[\^~]/, '')), target);
  const needsApproval = requiresApproval(config.approval, 'upgrade', { isMajor });
  if (needsApproval && !options.skipApproval) {
    const approved = await approvalGate(config, 'upgrade', {
      pkg, targetVersion: target, isMajor, projectRoot: root,
    });
    if (!approved) return { ok: false, error: 'Approval denied' };
  }
  if (options.dryRun) return { ok: true, dryRun: true, pkg, before: current, after: target };
  if (!options.skipCheckpoint) {
    const cp = createCheckpoint(root, { reason: 'apply-upgrade', ecosystem: 'npm' });
    if (cp.error) return { ok: false, error: cp.error };
    emit('checkpoint.created', { path: cp.path, files: cp.files }, webhooks);
  }
  emit('apply.started', { action: 'upgrade', pkg, targetVersion: target }, webhooks);
  const prefix = inDev ? 'devDependencies' : 'dependencies';
  const key = inDev ? 'devDependencies' : 'dependencies';
  pkgJson[key] = pkgJson[key] || {};
  pkgJson[key][pkg] = target;
  try {
    writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf8');
  } catch (e) {
    return { ok: false, error: e?.message || 'Failed to write package.json' };
  }
  const install = spawnSync('npm', ['install'], { cwd: root, ...NPM_SPAWN_OPTS });
  if (install.status !== 0) {
    if (!options.skipCheckpoint) {
      const rb = doRollback(root);
      emit('apply.failed', { action: 'upgrade', pkg, error: install.stderr }, webhooks);
      if (rb.restored) {
        emit('rollback.triggered', { reason: 'install_failed', checkpoint: rb.checkpoint }, webhooks);
        emit('rollback.completed', { restored: rb.restored }, webhooks);
      }
    }
    return { ok: false, error: install.stderr || 'npm install failed' };
  }
  const verify = verifyNpm(root);
  if (!verify.ok) {
    if (!options.skipCheckpoint) {
      const rb = doRollback(root);
      emit('apply.failed', { action: 'upgrade', pkg, error: verify.stderr }, webhooks);
      if (rb.restored) {
        emit('rollback.triggered', { reason: 'verify_failed', checkpoint: rb.checkpoint }, webhooks);
        emit('rollback.completed', { restored: rb.restored }, webhooks);
      }
    }
    return { ok: false, error: verify.stderr || 'Verify failed' };
  }
  emit('apply.completed', { action: 'upgrade', pkg, before: current, after: target }, webhooks);
  return { ok: true, pkg, before: current, after: target };
}

/**
 * Apply npm replace: remove oldPkg, add newPkg (with optional version), npm install.
 * @param {string} projectRoot
 * @param {string} oldPkg
 * @param {string} newPkg
 * @param {string} [newVersion] - e.g. "latest" or "2.0.0"
 */
export async function applyNpmReplace(projectRoot, oldPkg, newPkg, newVersion, options = {}) {
  if (!projectRoot || typeof projectRoot !== 'string') return { ok: false, error: 'Invalid project root' };
  const root = resolve(projectRoot);
  if (!existsSync(root)) return { ok: false, error: `Path does not exist: ${root}` };
  const config = options.config ?? loadConfig(root);
  const webhooks = config.webhooks || [];
  const loadedReplace = safeReadPackageJson(root);
  if (loadedReplace.error) return { ok: false, error: loadedReplace.error };
  const { pkgJson, pkgPath } = loadedReplace;
  const deps = pkgJson.dependencies || {};
  const devDeps = pkgJson.devDependencies || {};
  const inDev = oldPkg in devDeps;
  if (!(oldPkg in deps) && !(oldPkg in devDeps)) return { ok: false, error: `Package ${oldPkg} not found` };
  const version = newVersion === 'latest' || !newVersion ? await npmLatestVersion(newPkg) : newVersion;
  if (!version) return { ok: false, error: `Could not resolve version for ${newPkg}` };
  if (!options.skipApproval && requiresApproval(config.approval, 'replace')) {
    const approved = await approvalGate(config, 'replace', {
      pkg: oldPkg, targetPackage: newPkg, targetVersion: version, projectRoot: root,
    });
    if (!approved) return { ok: false, error: 'Approval denied' };
  }
  if (options.dryRun) return { ok: true, dryRun: true, oldPkg, newPkg, newVersion: version };
  if (!options.skipCheckpoint) {
    const cp = createCheckpoint(root, { reason: 'apply-replace', ecosystem: 'npm' });
    if (cp.error) return { ok: false, error: cp.error };
    emit('checkpoint.created', { path: cp.path, files: cp.files }, webhooks);
  }
  emit('apply.started', { action: 'replace', pkg: oldPkg, targetPackage: newPkg, targetVersion: version }, webhooks);
  const key = inDev ? 'devDependencies' : 'dependencies';
  pkgJson[key] = pkgJson[key] || {};
  delete pkgJson[key][oldPkg];
  pkgJson[key][newPkg] = version;
  try {
    writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf8');
  } catch (e) {
    return { ok: false, error: e?.message || 'Failed to write package.json' };
  }
  const install = spawnSync('npm', ['install'], { cwd: root, ...NPM_SPAWN_OPTS });
  if (install.status !== 0) {
    if (!options.skipCheckpoint) {
      const rb = doRollback(root);
      emit('apply.failed', { action: 'replace', pkg: oldPkg, error: install.stderr }, webhooks);
      if (rb.restored) {
        emit('rollback.triggered', { reason: 'install_failed', checkpoint: rb.checkpoint }, webhooks);
        emit('rollback.completed', { restored: rb.restored }, webhooks);
      }
    }
    return { ok: false, error: install.stderr || 'npm install failed' };
  }
  const verify = verifyNpm(root);
  if (!verify.ok) {
    if (!options.skipCheckpoint) {
      const rb = doRollback(root);
      emit('apply.failed', { action: 'replace', pkg: oldPkg, error: verify.stderr }, webhooks);
      if (rb.restored) {
        emit('rollback.triggered', { reason: 'verify_failed', checkpoint: rb.checkpoint }, webhooks);
        emit('rollback.completed', { restored: rb.restored }, webhooks);
      }
    }
    return { ok: false, error: verify.stderr || 'Verify failed' };
  }
  emit('apply.completed', { action: 'replace', pkg: oldPkg, newPkg, newVersion: version }, webhooks);
  return { ok: true, oldPkg, newPkg, newVersion: version };
}

const SPAWN_OPTS = { encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024 };

function verifyPip(projectRoot) {
  const r = spawnSync('pip', ['check'], { cwd: projectRoot, ...SPAWN_OPTS });
  return { ok: r.status === 0, stderr: r.stderr };
}

function pipAvailable(projectRoot) {
  const r = spawnSync('pip', ['--version'], { cwd: projectRoot, encoding: 'utf8', timeout: 5000 });
  return r.status === 0;
}

/**
 * Apply pip upgrade: update dependency version in requirements.txt or pyproject.toml, pip install, verify.
 * @param {string} projectRoot
 * @param {string} pkg - package name
 * @param {string} [targetVersion] - e.g. "latest" or "2.0.0"
 * @param {object} [options]
 */
export async function applyPipUpgrade(projectRoot, pkg, targetVersion, options = {}) {
  if (!projectRoot || typeof projectRoot !== 'string') return { ok: false, error: 'Invalid project root' };
  const root = resolve(projectRoot);
  if (!existsSync(root)) return { ok: false, error: `Path does not exist: ${root}` };
  if (!pipAvailable(root)) return { ok: false, error: 'pip not found or not in PATH' };
  const { loadRequirements, getPyPILatestVersion } = await import('./resolvers/pip.js');
  const loaded = loadRequirements(root);
  if (!loaded) return { ok: false, error: 'No requirements.txt or pyproject.toml dependencies found' };
  const config = options.config ?? loadConfig(root);
  const webhooks = config.webhooks || [];
  const version = targetVersion === 'latest' || !targetVersion ? await getPyPILatestVersion(pkg) : targetVersion;
  if (!version) return { ok: false, error: `Could not resolve version for ${pkg}` };
  if (!options.skipApproval && requiresApproval(config.approval, 'upgrade')) {
    const approved = await approvalGate(config, 'upgrade', { pkg, targetVersion: version, projectRoot: root });
    if (!approved) return { ok: false, error: 'Approval denied' };
  }
  if (options.dryRun) return { ok: true, dryRun: true, pkg, after: version };
  if (!options.skipCheckpoint) {
    const cp = createCheckpoint(root, { reason: 'apply-pip-upgrade', ecosystem: 'pip' });
    if (cp.error) return { ok: false, error: cp.error };
    emit('checkpoint.created', { path: cp.path, files: cp.files }, webhooks);
  }
  const content = readFileSync(loaded.path, 'utf8');
  const pkgNorm = pkg.toLowerCase().replace(/_/g, '-');
  const newLine = loaded.path.endsWith('.txt')
    ? `${pkgNorm}==${version}`
    : `"${pkgNorm}>=${version}"`;
  const lines = content.split(/\r?\n/);
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^["']?([a-zA-Z0-9_.-]+)/);
    if (m && m[1].toLowerCase().replace(/_/g, '-') === pkgNorm) {
      lines[i] = loaded.path.endsWith('.txt') ? newLine : line.replace(/["'][^"']+["']/, `"${pkgNorm}>=${version}"`);
      found = true;
      break;
    }
  }
  if (!found) return { ok: false, error: `Package ${pkg} not found in ${loaded.path}` };
  try {
    writeFileSync(loaded.path, lines.join('\n'), 'utf8');
  } catch (e) {
    return { ok: false, error: e?.message || 'Failed to write manifest' };
  }
  const install = spawnSync('pip', ['install', '-e', '.'], { cwd: root, ...SPAWN_OPTS });
  if (install.status !== 0) {
    if (!options.skipCheckpoint) doRollback(root);
    return { ok: false, error: install.stderr || 'pip install failed' };
  }
  const verify = verifyPip(root);
  if (!verify.ok) {
    if (!options.skipCheckpoint) doRollback(root);
    return { ok: false, error: verify.stderr || 'Verify failed' };
  }
  return { ok: true, pkg, after: version };
}

/**
 * Apply pip replace: remove oldPkg, add newPkg, pip install, verify.
 */
export async function applyPipReplace(projectRoot, oldPkg, newPkg, newVersion, options = {}) {
  if (!projectRoot || typeof projectRoot !== 'string') return { ok: false, error: 'Invalid project root' };
  const root = resolve(projectRoot);
  if (!existsSync(root)) return { ok: false, error: `Path does not exist: ${root}` };
  if (!pipAvailable(root)) return { ok: false, error: 'pip not found or not in PATH' };
  const { loadRequirements, getPyPILatestVersion } = await import('./resolvers/pip.js');
  const loaded = loadRequirements(root);
  if (!loaded) return { ok: false, error: 'No requirements.txt or pyproject.toml dependencies found' };
  const config = options.config ?? loadConfig(root);
  const webhooks = config.webhooks || [];
  const version = newVersion === 'latest' || !newVersion ? await getPyPILatestVersion(newPkg) : newVersion;
  if (!version) return { ok: false, error: `Could not resolve version for ${newPkg}` };
  if (!options.skipApproval && requiresApproval(config.approval, 'replace')) {
    const approved = await approvalGate(config, 'replace', { pkg: oldPkg, targetPackage: newPkg, targetVersion: version, projectRoot: root });
    if (!approved) return { ok: false, error: 'Approval denied' };
  }
  if (options.dryRun) return { ok: true, dryRun: true, oldPkg, newPkg, newVersion: version };
  if (!options.skipCheckpoint) {
    const cp = createCheckpoint(root, { reason: 'apply-pip-replace', ecosystem: 'pip' });
    if (cp.error) return { ok: false, error: cp.error };
    emit('checkpoint.created', { path: cp.path, files: cp.files }, webhooks);
  }
  const content = readFileSync(loaded.path, 'utf8');
  const oldNorm = oldPkg.toLowerCase().replace(/_/g, '-');
  const lines = content.split(/\r?\n/);
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^["']?([a-zA-Z0-9_.-]+)/);
    if (m && m[1].toLowerCase().replace(/_/g, '-') === oldNorm) {
      const newLine = loaded.path.endsWith('.txt') ? `${newPkg.toLowerCase().replace(/_/g, '-')}==${version}` : `"${newPkg.toLowerCase().replace(/_/g, '-')}>=${version}"`;
      lines[i] = newLine;
      found = true;
      break;
    }
  }
  if (!found) return { ok: false, error: `Package ${oldPkg} not found in ${loaded.path}` };
  try {
    writeFileSync(loaded.path, lines.join('\n'), 'utf8');
  } catch (e) {
    return { ok: false, error: e?.message || 'Failed to write manifest' };
  }
  const install = spawnSync('pip', ['install', '-e', '.'], { cwd: root, ...SPAWN_OPTS });
  if (install.status !== 0) {
    if (!options.skipCheckpoint) doRollback(root);
    return { ok: false, error: install.stderr || 'pip install failed' };
  }
  const verify = verifyPip(root);
  if (!verify.ok) {
    if (!options.skipCheckpoint) doRollback(root);
    return { ok: false, error: verify.stderr || 'Verify failed' };
  }
  return { ok: true, oldPkg, newPkg, newVersion: version };
}
