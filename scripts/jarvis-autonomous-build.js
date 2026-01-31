#!/usr/bin/env node

/**
 * JARVIS Autonomous Build
 * Non-interactive: pull, validate skills, run known builds. For scheduled or scripted use.
 * Usage: node scripts/jarvis-autonomous-build.js [--dry-run] [--skip-pull] [--skip-build] [--log path]
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO_ROOT, 'skills');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
JARVIS Autonomous Build — pull, validate skills, run builds (non-interactive).

Usage: node scripts/jarvis-autonomous-build.js [options]

Options:
  --dry-run      Log what would run; make no changes
  --skip-pull    Do not run git pull
  --skip-build   Do not run subproject builds (e.g. upshiftai/platform)
  --log <path>   Write full run log to this file (stdout always gets full log)

Schedule (Windows): Run add-autonomous-build-schedule.ps1 once to add a daily task.
`);
  process.exit(0);
}
const dryRun = args.includes('--dry-run');
const skipPull = args.includes('--skip-pull');
const skipBuild = args.includes('--skip-build');
const logIndex = args.indexOf('--log');
const logPath = logIndex >= 0 && args[logIndex + 1] ? args[logIndex + 1] : null;

const out = [];
function log(msg, level = 'info') {
  const line = `[${new Date().toISOString()}] ${msg}`;
  out.push(line);
  const color = level === 'err' ? '\x1b[31m' : level === 'ok' ? '\x1b[32m' : '\x1b[36m';
  console.log(`${color}${msg}\x1b[0m`);
}

function exec(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      cwd: REPO_ROOT,
      stdio: opts.silent ? 'pipe' : 'inherit',
      ...opts
    });
  } catch (e) {
    if (!opts.silent) log(`Command failed: ${cmd}`, 'err');
    throw e;
  }
}

function stepPull() {
  if (skipPull) {
    log('⏭️  Skipping git pull (--skip-pull)');
    return;
  }
  if (dryRun) {
    log('🔍 [dry-run] Would run: git pull');
    return;
  }
  log('📥 Pulling latest...');
  exec('git pull --rebase origin main', { silent: false });
  log('✅ Pull complete', 'ok');
}

function stepValidateSkills() {
  log('🧪 Validating skills...');
  const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let failed = 0;
  for (const name of dirs) {
    const skillDir = path.join(SKILLS_DIR, name);
    const skillJsonPath = path.join(skillDir, 'skill.json');
    const indexPath = path.join(skillDir, 'index.js');

    if (!fs.existsSync(skillJsonPath)) continue;

    try {
      const raw = fs.readFileSync(skillJsonPath, 'utf8');
      const json = JSON.parse(raw);
      if (!json.name || !json.tools) {
        log(`❌ ${name}: invalid skill.json (missing name or tools)`, 'err');
        failed++;
        continue;
      }
    } catch (e) {
      log(`❌ ${name}: skill.json parse error - ${e.message}`, 'err');
      failed++;
      continue;
    }

    if (fs.existsSync(indexPath)) {
      if (!dryRun) {
        const r = spawnSync(process.execPath, ['-c', indexPath], { cwd: REPO_ROOT, encoding: 'utf8' });
        if (r.status !== 0) {
          log(`❌ ${name}: index.js syntax error`, 'err');
          failed++;
          continue;
        }
      }
    }
  }
  if (failed > 0) {
    log(`❌ Validation failed (${failed} skills)`, 'err');
    throw new Error('Skills validation failed');
  }
  log('✅ Skills validation passed', 'ok');
}

function stepOptimize() {
  const script = path.join(REPO_ROOT, 'scripts', 'optimize-jarvis.js');
  if (!fs.existsSync(script)) return;
  if (dryRun) {
    log('🔍 [dry-run] Would run: node scripts/optimize-jarvis.js --quick');
    return;
  }
  log('🔧 Running optimize-jarvis --quick...');
  try {
    exec('node scripts/optimize-jarvis.js --quick', { silent: true });
    log('✅ Optimize complete', 'ok');
  } catch (e) {
    log('⚠️  Optimize failed (non-fatal): ' + e.message);
  }
}

// Directories to skip when discovering buildable subprojects (e.g. moved to own repo, or not apps)
const SKIP_BUILD_DIRS = new Set(['node_modules', '.git', '.cursor', 'scripts', 'jarvis']);

function stepBuildSubprojects() {
  if (skipBuild) {
    log('⏭️  Skipping subproject builds (--skip-build)');
    return;
  }
  // Discover in-repo dirs that have package.json with a "build" script (no hardcoded paths)
  const buildable = [];
  const topDirs = fs.readdirSync(REPO_ROOT, { withFileTypes: true }).filter(d => d.isDirectory() && !SKIP_BUILD_DIRS.has(d.name));
  for (const top of topDirs) {
    const topPath = path.join(REPO_ROOT, top.name);
    const pkgPath = path.join(topPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts && pkg.scripts.build) buildable.push(topPath);
      } catch (_) { /* ignore */ }
    }
    let subDirs = [];
    try {
      subDirs = fs.readdirSync(topPath, { withFileTypes: true }).filter(d => d.isDirectory() && !SKIP_BUILD_DIRS.has(d.name));
    } catch (_) { continue; }
    for (const sub of subDirs) {
      const subPath = path.join(topPath, sub.name);
      const subPkg = path.join(subPath, 'package.json');
      if (!fs.existsSync(subPkg)) continue;
      try {
        const pkg = JSON.parse(fs.readFileSync(subPkg, 'utf8'));
        if (pkg.scripts && pkg.scripts.build) buildable.push(subPath);
      } catch (_) { /* ignore */ }
    }
  }
  if (buildable.length === 0) {
    log('📦 No in-repo subprojects with a "build" script (e.g. apps in their own repos are not built here)');
    return;
  }
  for (const dir of buildable) {
    const rel = path.relative(REPO_ROOT, dir);
    if (dryRun) {
      log(`🔍 [dry-run] Would run: npm run build in ${rel}`);
      continue;
    }
    log(`📦 Building ${rel}...`);
    try {
      execSync('npm run build', { encoding: 'utf8', cwd: dir, stdio: 'inherit' });
      log(`✅ Build OK: ${rel}`, 'ok');
    } catch (e) {
      log(`⚠️  Build failed (non-fatal): ${rel} - ${e.message}`);
    }
  }
}

async function main() {
  log('🔨 JARVIS Autonomous Build');
  log('==========================');
  if (dryRun) log('🔍 DRY RUN — no changes will be made');

  try {
    stepPull();
    stepValidateSkills();
    stepOptimize();
    stepBuildSubprojects();
    log('✅ Autonomous build finished successfully', 'ok');
  } catch (e) {
    log('❌ Build failed: ' + e.message, 'err');
    if (logPath) fs.writeFileSync(logPath, out.join('\n'), 'utf8');
    process.exit(1);
  }

  if (logPath) {
    fs.writeFileSync(logPath, out.join('\n'), 'utf8');
    log(`📄 Log written to ${logPath}`);
  }
}

main();
