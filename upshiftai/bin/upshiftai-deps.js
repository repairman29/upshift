#!/usr/bin/env node

/**
 * CLI: upshiftai-deps analyze | report | checkpoint | rollback
 * analyze: JSON (+ optional --markdown, --csv)
 * report: full "deep throat" report (direct + transitive, something-old chains, optional --pdf)
 * checkpoint: save manifest + lockfile for rollback before automations
 * rollback: restore from latest checkpoint
 */

import { resolve, join } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { spawnSync } from 'child_process';

/** Parse non-negative integer option; exit with message if invalid. */
function parseNonNegativeInt(value, name) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) {
    console.error(`Error: --${name} must be a non-negative integer (got: ${value})`);
    process.exit(1);
  }
  return n;
}

/** Ensure project root exists and is a directory; exit with message if not. */
function ensureProjectRoot(projectRoot) {
  try {
    const p = resolve(projectRoot);
    if (!existsSync(p)) {
      console.error(`Error: path does not exist: ${p}`);
      process.exit(1);
    }
    const stat = statSync(p);
    if (!stat.isDirectory()) {
      console.error(`Error: path is not a directory: ${p}`);
      process.exit(1);
    }
    return p;
  } catch (err) {
    console.error('Error:', err?.message || 'Invalid path');
    process.exit(1);
  }
}
import { analyzeWithMarkdown, reportToCsv, analyze } from '../src/index.js';
import { buildFullReport, buildOnePager } from '../src/report-full.js';
import { loadPyProjectMeta } from '../src/resolvers/pip.js';
import {
  loadPipdeptreeFromFile,
  enrichTreeWithPyPI,
  buildSomethingOldChains,
  pipTreeToText,
} from '../src/pip-tree.js';
import { createCheckpoint, rollback as doRollback, getLatestCheckpoint, listCheckpoints, detectEcosystem } from '../src/checkpoint.js';
import { loadConfig } from '../src/config.js';

const PLATFORM_URL = process.env.UPSHIFTAI_PLATFORM_URL || '';
import { applyNpmUpgrade, applyNpmReplace, applyPipUpgrade, applyPipReplace } from '../src/apply.js';
import { getReplacementSuggestions, loadCustomSuggestions } from '../src/suggestions.js';

const args = process.argv.slice(2);
const cmd = args[0];
const subCmd = args[1];
// Path: for apply upgrade/replace it's the last positional; for others it's args[1]
function getProjectRoot() {
  if (cmd === 'apply' && (subCmd === 'upgrade' || subCmd === 'replace' || subCmd === 'fix')) {
    const idx = subCmd === 'fix' ? 2 : (subCmd === 'upgrade' ? 3 : 4);
    const pathArg = args[idx] && !args[idx].startsWith('--') ? args[idx] : '.';
    return resolve(pathArg);
  }
  if (cmd === 'fix') {
    const pathArg = (args[2] && !args[2].startsWith('--')) ? args[2] : '.';
    return resolve(pathArg);
  }
  if (cmd === 'health' || cmd === 'check') {
    const pathArg = (args[1] && !args[1].startsWith('--')) ? args[1] : '.';
    return resolve(pathArg);
  }
  const pathArg = (args[1] && !args[1].startsWith('--')) ? args[1] : '.';
  return resolve(pathArg);
}

function diffReport(prev, curr) {
  const prevKeys = new Set((prev.entries || []).map((e) => e.key || e.name));
  const currKeys = new Set((curr.entries || []).map((e) => e.key || e.name));
  const prevProblematic = new Set((prev.entries || []).filter((e) => e.ancient || e.deprecated).map((e) => e.name));
  const currProblematic = new Set((curr.entries || []).filter((e) => e.ancient || e.deprecated).map((e) => e.name));
  return {
    ancientChange: (curr.summary?.ancient ?? 0) - (prev.summary?.ancient ?? 0),
    deprecatedChange: (curr.summary?.deprecated ?? 0) - (prev.summary?.deprecated ?? 0),
    newProblematic: [...currProblematic].filter((n) => !prevProblematic.has(n)),
    fixed: [...prevProblematic].filter((n) => !currProblematic.has(n)),
    added: [...currKeys].filter((k) => !prevKeys.has(k)),
    removed: [...prevKeys].filter((k) => !currKeys.has(k)),
  };
}
const projectRoot = ensureProjectRoot(getProjectRoot());

function getOpt(name, defaultValue) {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : defaultValue;
}
function hasOpt(name) {
  return args.includes(`--${name}`);
}

async function main() {
  if (cmd === 'analyze') {
    await runAnalyze();
    return;
  }
  if (cmd === 'report') {
    await runReport();
    return;
  }
  if (cmd === 'checkpoint') {
    runCheckpoint();
    return;
  }
  if (cmd === 'rollback') {
    runRollback();
    return;
  }
  if (cmd === 'apply') {
    await runApply();
    return;
  }
  if (cmd === 'fix') {
    await runFix();
    return;
  }
  if (cmd === 'health' || cmd === 'check') {
    await runHealth();
    return;
  }
  console.error(`Usage:
  upshiftai-deps analyze [path] [--markdown] [--csv] [--summary] [--exit-code] [--max-ancient=N] [--max-deprecated=N] [--no-registry] [--no-audit] [--ecosystem=npm|pip|go]
  upshiftai-deps report [path] [--output FILE] [--summary] [--json] [--pdf] [--upload] [--diff] [--licenses] [--pip-tree FILE.json] [--full-tree] [--no-full-tree] [--project-name NAME] [--project-url URL] [--ecosystem=pip]
  upshiftai-deps checkpoint [path] [--reason "..."] [--list]
  upshiftai-deps rollback [path] [--dry-run] [--checkpoint TS]
  upshiftai-deps apply upgrade <pkg> [path] [--version VER] [--dry-run] [--yes]
  upshiftai-deps apply replace <old> <new> [path] [--version VER] [--dry-run] [--yes]
  upshiftai-deps apply fix [path] [--dry-run] [--yes] [--limit N]
  upshiftai-deps fix <pkg> [path] [--dry-run] [--yes]
  upshiftai-deps health [path] [--exit-code] [--json]
  upshiftai-deps (uses .upshiftai.json for webhooks & approval; --yes skips HITL)`);
  process.exit(1);
}

async function runApply() {
  const action = subCmd;
  const dryRun = hasOpt('dry-run');
  const skipApproval = hasOpt('yes');
  const configPath = getOpt('config');
  const version = getOpt('version', 'latest');
  const config = loadConfig(projectRoot, configPath);
  const ecosystem = detectEcosystem(projectRoot) || 'npm';

  if (action === 'upgrade') {
    const pkg = args[2];
    if (!pkg || pkg.startsWith('--')) {
      console.error('Usage: upshiftai-deps apply upgrade <pkg> [path] [--version VER] [--dry-run] [--yes]');
      process.exit(1);
    }
    const opts = { config, dryRun, skipApproval };
    const result = ecosystem === 'pip'
      ? await applyPipUpgrade(projectRoot, pkg, version, opts)
      : await applyNpmUpgrade(projectRoot, pkg, version, opts);
    if (result.error) {
      console.error(result.error);
      process.exit(1);
    }
    if (result.dryRun) {
      console.error(`Dry run: would upgrade ${result.pkg} ${result.before || ''} → ${result.after}`);
      return;
    }
    console.error(`Upgraded ${result.pkg}: ${result.before || '?'} → ${result.after}`);
    return;
  }

  if (action === 'replace') {
    const oldPkg = args[2];
    const newPkg = args[3];
    if (!oldPkg || !newPkg || oldPkg.startsWith('--') || newPkg.startsWith('--')) {
      console.error('Usage: upshiftai-deps apply replace <old> <new> [path] [--version VER] [--dry-run] [--yes]');
      process.exit(1);
    }
    const opts = { config, dryRun, skipApproval };
    const result = ecosystem === 'pip'
      ? await applyPipReplace(projectRoot, oldPkg, newPkg, version, opts)
      : await applyNpmReplace(projectRoot, oldPkg, newPkg, version, opts);
    if (result.error) {
      console.error(result.error);
      process.exit(1);
    }
    if (result.dryRun) {
      console.error(`Dry run: would replace ${result.oldPkg} → ${result.newPkg} @ ${result.newVersion}`);
      return;
    }
    console.error(`Replaced ${result.oldPkg} → ${result.newPkg} @ ${result.newVersion}`);
    return;
  }

  if (action === 'fix') {
    loadCustomSuggestions(projectRoot);
    const dryRun = hasOpt('dry-run');
    const skipApproval = hasOpt('yes');
    const limit = parseNonNegativeInt(getOpt('limit', '999'), 'limit');
    const config = loadConfig(projectRoot, getOpt('config'));
    const report = await analyze(projectRoot, { fetchRegistry: true, ancientMonths: 24 });
    if (!report.ok) {
      console.error(report.error || 'Analysis failed');
      process.exit(1);
    }
    const ecosystem = report.ecosystem || 'npm';
    const direct = (report.entries || []).filter((e) => e.depth === 1 && (e.ancient || e.deprecated));
    const withSuggestion = direct.filter((e) => getReplacementSuggestions(e.name));
    const toFix = (withSuggestion.length ? withSuggestion : direct).slice(0, limit);
    if (toFix.length === 0) {
      console.error('No direct ancient/deprecated deps with suggestions to fix. Run "upshiftai-deps report" for details.');
      return;
    }
    const applyReplace = ecosystem === 'pip' ? applyPipReplace : applyNpmReplace;
    const applyUpgrade = ecosystem === 'pip' ? applyPipUpgrade : applyNpmUpgrade;
    if (dryRun) {
      for (const e of toFix) {
        const s = getReplacementSuggestions(e.name);
        console.error(`Would fix: ${e.name} → ${s ? s.replacement : 'upgrade to latest'}`);
      }
      return;
    }
    const cp = createCheckpoint(projectRoot, { reason: 'apply-fix', ecosystem });
    if (cp.error) {
      console.error(cp.error);
      process.exit(1);
    }
    for (const e of toFix) {
      const s = getReplacementSuggestions(e.name);
      const result = s?.targetPackage
        ? await applyReplace(projectRoot, e.name, s.targetPackage, 'latest', { config, skipApproval, skipCheckpoint: true })
        : await applyUpgrade(projectRoot, e.name, 'latest', { config, skipApproval, skipCheckpoint: true });
      if (result.error) {
        console.error(`Failed: ${e.name} — ${result.error}`);
        doRollback(projectRoot);
        process.exit(1);
      }
      console.error(`Fixed: ${e.name}${result.after ? ` → ${result.after}` : result.newPkg ? ` → ${result.newPkg}` : ''}`);
    }
    console.error(`Applied ${toFix.length} fix(es).`);
    return;
  }

  console.error('Usage: upshiftai-deps apply upgrade|replace|fix ...');
  process.exit(1);
}

async function runHealth() {
  loadCustomSuggestions(projectRoot);
  const wantJson = hasOpt('json');
  const exitCode = hasOpt('exit-code');
  const report = await analyze(projectRoot, { fetchRegistry: true, ancientMonths: 24, runAudit: true });
  if (!report.ok) {
    console.error(report.error || 'Analysis failed');
    process.exit(1);
  }
  const s = report.summary || {};
  const ancient = s.ancient ?? 0;
  const deprecated = s.deprecated ?? 0;
  const audit = report.audit || {};
  const critical = audit.critical ?? 0;
  const high = audit.high ?? 0;
  const vulns = critical + high;
  const total = s.total ?? 0;
  let status = 'OK';
  let message = `${total} packages, no major issues`;
  if (vulns > 0 || ancient >= 5 || deprecated >= 2) {
    status = 'FAIL';
    const parts = [];
    if (vulns > 0) parts.push(`${vulns} high/critical vuln${vulns !== 1 ? 's' : ''}`);
    if (ancient >= 5) parts.push(`${ancient} ancient`);
    if (deprecated >= 2) parts.push(`${deprecated} deprecated`);
    message = parts.join(', ');
  } else if (ancient > 0 || deprecated > 0 || (audit.moderate ?? 0) + (audit.low ?? 0) > 0) {
    status = 'WARN';
    const parts = [];
    if (ancient > 0) parts.push(`${ancient} ancient`);
    if (deprecated > 0) parts.push(`${deprecated} deprecated`);
    if ((audit.moderate ?? 0) + (audit.low ?? 0) > 0) parts.push('moderate/low vulns');
    message = parts.join(', ');
  }
  if (wantJson) {
    console.log(JSON.stringify({ status, message, summary: s, audit: report.audit || null }, null, 2));
  } else {
    const useColor = hasOpt('color') || (process.stdout?.isTTY && !hasOpt('no-color'));
    const C = useColor ? { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', reset: '\x1b[0m' } : { green: '', red: '', yellow: '', reset: '' };
    const line = status === 'OK'
      ? `${C.green}✓ ${message}${C.reset}`
      : status === 'WARN'
        ? `${C.yellow}${status}: ${message}${C.reset}`
        : `${C.red}${status}: ${message}${C.reset}`;
    console.log(line);
  }
  if (exitCode && status !== 'OK') process.exit(1);
}

function normalizePkgName(name) {
  return String(name || '').toLowerCase().trim().replace(/_/g, '-');
}

async function runFix() {
  const pkg = args[1];
  if (!pkg || pkg.startsWith('--')) {
    console.error('Usage: upshiftai-deps fix <pkg> [path] [--dry-run] [--yes]');
    process.exit(1);
  }
  loadCustomSuggestions(projectRoot);
  const dryRun = hasOpt('dry-run');
  const skipApproval = hasOpt('yes');
  const config = loadConfig(projectRoot, getOpt('config'));
  const report = await analyze(projectRoot, { fetchRegistry: true, ancientMonths: 24 });
  if (!report.ok) {
    console.error(report.error || 'Analysis failed');
    process.exit(1);
  }
  const pkgNorm = normalizePkgName(pkg);
  const entry = (report.entries || []).find((e) => normalizePkgName(e.name) === pkgNorm);
  if (!entry) {
    console.error(`Package ${pkg} not found in dependency tree.`);
    process.exit(1);
  }
  const ecosystem = report.ecosystem || 'npm';
  const suggestion = getReplacementSuggestions(entry.name);
  const applyReplace = ecosystem === 'pip' ? applyPipReplace : applyNpmReplace;
  const applyUpgrade = ecosystem === 'pip' ? applyPipUpgrade : applyNpmUpgrade;
  const result = suggestion?.targetPackage
    ? await applyReplace(projectRoot, entry.name, suggestion.targetPackage, 'latest', { config, dryRun, skipApproval })
    : await applyUpgrade(projectRoot, entry.name, 'latest', { config, dryRun, skipApproval });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.dryRun) {
    console.error(`Dry run: would ${suggestion?.targetPackage ? 'replace' : 'upgrade'} ${entry.name}${result.after ? ` → ${result.after}` : result.newPkg ? ` → ${result.newPkg}` : ''}`);
    return;
  }
  console.error(`${suggestion?.targetPackage ? 'Replaced' : 'Upgraded'} ${entry.name}${result.after ? ` → ${result.after}` : result.newPkg ? ` → ${result.newPkg}` : ''}`);
}

function runCheckpoint() {
  if (hasOpt('list')) {
    const list = listCheckpoints(projectRoot);
    if (list.length === 0) {
      console.error('No checkpoints. Run "upshiftai-deps checkpoint" first.');
      return;
    }
    for (const cp of list) {
      console.log(`${cp.timestamp}\t${cp.reason}\t${cp.path}`);
    }
    return;
  }
  const reason = getOpt('reason', 'manual');
  const result = createCheckpoint(projectRoot, { reason });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  console.error(`Checkpoint saved: ${result.path}`);
  console.error(`  Files: ${result.files.join(', ')}`);
}

function runRollback() {
  const dryRun = hasOpt('dry-run');
  const checkpointTs = getOpt('checkpoint');
  const result = doRollback(projectRoot, { dryRun, checkpoint: checkpointTs || undefined });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.dryRun) {
    console.error(`Would restore from: ${result.checkpoint}`);
    console.error(`  Files: ${result.restored.join(', ')}`);
    return;
  }
  console.error(`Rolled back from: ${result.checkpoint}`);
  console.error(`  Restored: ${result.restored.join(', ')}`);
}

async function runAnalyze() {
  loadCustomSuggestions(projectRoot);
  const wantMarkdown = hasOpt('markdown');
  const wantCsv = hasOpt('csv');
  const wantSummary = hasOpt('summary');
  const exitCode = hasOpt('exit-code');
  const maxAncient = parseNonNegativeInt(getOpt('max-ancient', '999'), 'max-ancient');
  const maxDeprecated = parseNonNegativeInt(getOpt('max-deprecated', '999'), 'max-deprecated');
  const noRegistry = hasOpt('no-registry');
  const noAudit = hasOpt('no-audit');
  const ecosystem = getOpt('ecosystem');

  const options = { fetchRegistry: !noRegistry, ancientMonths: 24, runAudit: !noAudit };
  if (ecosystem) options.ecosystem = ecosystem;

  const { report, markdown } = await analyzeWithMarkdown(projectRoot, options);

  if (exitCode && report.ok) {
    const summary = report.summary || {};
    const ancient = summary.ancient ?? 0;
    const deprecated = summary.deprecated ?? 0;
    if (ancient > maxAncient || deprecated > maxDeprecated) {
      console.error(`Exit code: ancient=${ancient} (max ${maxAncient}), deprecated=${deprecated} (max ${maxDeprecated})`);
      process.exit(1);
    }
  }

  if (wantSummary) {
    console.log(buildOnePager(report, {}));
    return;
  }
  if (!wantCsv && report.ok && (hasOpt('color') || process.stderr?.isTTY)) {
    const s = report.summary || {};
    const a = report.audit || {};
    const vuln = (a.critical ?? 0) + (a.high ?? 0);
    const line = `${s.total ?? 0} packages, ${s.ancient ?? 0} ancient, ${s.deprecated ?? 0} deprecated${vuln ? `, ${vuln} high/critical vulns` : ''}`;
    console.error(line);
  }
  if (wantCsv) {
    console.log(reportToCsv(report, { includeSuggestions: true }));
    return;
  }
  console.log(JSON.stringify(report, null, 2));
  if (wantMarkdown) {
    console.log('\n---\n');
    console.log(markdown);
  }
}

async function runReport() {
  loadCustomSuggestions(projectRoot);
  const outFile = getOpt('output');
  const wantSummary = hasOpt('summary');
  const wantJson = hasOpt('json');
  const wantPdf = hasOpt('pdf');
  const wantDiff = hasOpt('diff');
  const wantLicenses = hasOpt('licenses');
  const pipTreeFile = getOpt('pip-tree');
  const noFullTree = hasOpt('no-full-tree');
  const fullTree = hasOpt('full-tree') || (!noFullTree && !pipTreeFile); // for pip we try full-tree by default below
  const projectName = getOpt('project-name');
  const projectUrl = getOpt('project-url');
  const ecosystem = getOpt('ecosystem', 'auto');

  const analyzeOptions = { fetchRegistry: true, ancientMonths: 24 };
  if (ecosystem && ecosystem !== 'auto') analyzeOptions.ecosystem = ecosystem;

  const directReport = await analyze(projectRoot, analyzeOptions);
  if (!directReport.ok) {
    console.error(directReport.error || 'Analysis failed');
    process.exit(1);
  }

  // For pip projects, default to attempting full transitive tree (full deep-throat report)
  const tryFullTree = directReport.ecosystem === 'pip' && !pipTreeFile && (hasOpt('full-tree') || !noFullTree);

  let somethingOldChains = [];
  let pipTreeText = '';
  let pipTreeJsonPath = pipTreeFile;

  if (tryFullTree) {
    const result = tryRunPipdeptree(projectRoot);
    if (result && result.jsonPath) pipTreeJsonPath = result.jsonPath;
    if (result && result.textPath && existsSync(result.textPath)) {
      pipTreeText = readFileSync(result.textPath, 'utf8');
    }
  }

  if (pipTreeJsonPath && existsSync(resolve(pipTreeJsonPath))) {
    const treePath = resolve(pipTreeJsonPath);
    const { packages, rootPackages } = loadPipdeptreeFromFile(treePath);
    const enriched = await enrichTreeWithPyPI(packages, { ancientMonths: 24 });
    somethingOldChains = buildSomethingOldChains(packages, enriched);
    if (!pipTreeText) pipTreeText = pipTreeToText(packages, rootPackages);
  }

  const pyprojectMeta = directReport.ecosystem === 'pip' ? loadPyProjectMeta(projectRoot) : null;
  const reportOptions = {
    projectName: projectName || pyprojectMeta?.name,
    projectUrl: projectUrl || pyprojectMeta?.url,
    projectDescription: pyprojectMeta?.description,
    somethingOldChains,
    pipTreeText: pipTreeText || undefined,
    ecosystem: directReport.ecosystem,
    hadPipTree: !!pipTreeJsonPath && existsSync(resolve(pipTreeJsonPath)),
    includeLicenses: wantLicenses,
  };

  if (wantSummary) {
    console.log(buildOnePager(directReport, reportOptions));
    return;
  }

  const fullMarkdown = buildFullReport(directReport, reportOptions);

  if (wantJson) {
    const jsonPayload = {
      projectName: reportOptions.projectName,
      projectUrl: reportOptions.projectUrl,
      ecosystem: directReport.ecosystem,
      generatedAt: new Date().toISOString(),
      summary: directReport.summary || {},
      somethingOldChains: reportOptions.somethingOldChains || [],
      entries: directReport.entries || [],
    };
    if (wantDiff) {
      const lastPath = join(projectRoot, '.upshiftai-tmp', 'last-report.json');
      if (existsSync(lastPath)) {
        try {
          const raw = readFileSync(lastPath, 'utf8');
          if (raw && raw.trim()) {
            const last = JSON.parse(raw);
            if (last && typeof last === 'object') jsonPayload.diff = diffReport(last, jsonPayload);
          }
        } catch (_) {
          // ignore malformed last-report.json
        }
      }
    }
    const jsonStr = JSON.stringify(jsonPayload, null, 2);
    if (outFile && outFile.endsWith('.json')) {
      writeFileSync(resolve(outFile), jsonStr, 'utf8');
      console.error(`Wrote ${outFile}`);
    } else {
      console.log(jsonStr);
    }
    if (!outFile || outFile.endsWith('.json')) {
      const savePath = join(projectRoot, '.upshiftai-tmp');
      if (!existsSync(savePath)) mkdirSync(savePath, { recursive: true });
      writeFileSync(join(savePath, 'last-report.json'), jsonStr, 'utf8');
    }
    return;
  }

  const mdPath = outFile ? resolve(outFile) : null;
  if (mdPath) {
    writeFileSync(mdPath, fullMarkdown, 'utf8');
    console.error(`Wrote ${mdPath}`);
  } else {
    console.log(fullMarkdown);
  }

  if (hasOpt('upload')) {
    const config = loadConfig(projectRoot, getOpt('config'));
    const baseUrl = (config.platformUrl || PLATFORM_URL).replace(/\/$/, '');
    const apiKey = config.apiKey || process.env.UPSHIFTAI_API_KEY;
    if (!baseUrl || !apiKey) {
      console.error('--upload requires platformUrl and apiKey in .upshiftai.json or UPSHIFTAI_PLATFORM_URL and UPSHIFTAI_API_KEY');
      process.exit(1);
    }
    const payload = {
      projectName: reportOptions.projectName || 'project',
      ecosystem: directReport.ecosystem || 'npm',
      summary: directReport.summary || {},
      markdown: fullMarkdown,
      payload: directReport,
    };
    try {
      const res = await fetch(`${baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-UpshiftAI-Key': apiKey },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('Upload failed:', res.status, err);
        process.exit(1);
      }
      const data = await res.json();
      console.error('Uploaded report:', data.id);
    } catch (e) {
      console.error('Upload failed:', e.message);
      process.exit(1);
    }
  }

  if (wantPdf) {
    const mdToConvert = mdPath || resolve(projectRoot, 'dependency-report.md');
    if (!mdPath) writeFileSync(mdToConvert, fullMarkdown, 'utf8');
    const r = spawnSync('npx', ['--yes', 'md-to-pdf', mdToConvert], {
      stdio: 'inherit',
      cwd: resolve(projectRoot),
    });
    if (r.status !== 0) {
      console.error('md-to-pdf failed; install with: npx md-to-pdf --version');
      process.exit(1);
    }
    const outPdf = mdToConvert.replace(/\.md$/i, '.pdf');
    console.error(`Wrote ${outPdf}`);
  }
}

function tryRunPipdeptree(projectRoot) {
  const pythons = ['python3.12', 'python3.11', 'python3.10', 'python3'];
  let py = null;
  for (const p of pythons) {
    const r = spawnSync(p, ['-c', 'import sys; sys.exit(0 if (3, 10) <= sys.version_info < (3, 13) else 1)'], { encoding: 'utf8' });
    if (r.status === 0) { py = p; break; }
  }
  if (!py) {
    console.error('No Python 3.10–3.12 found. Generate pipdeptree yourself and pass --pip-tree=tree.json:');
    console.error('  cd <project> && python3 -m venv .venv && .venv/bin/pip install pipdeptree ".[dev]" && .venv/bin/pipdeptree -o json > tree.json');
    return null;
  }
  const tmpDir = join(projectRoot, '.upshiftai-tmp');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  const venvPath = join(tmpDir, 'venv');
  const jsonPath = join(tmpDir, 'pipdeptree.json');
  const textPath = join(tmpDir, 'pipdeptree.txt');
  if (!existsSync(venvPath)) {
    const r1 = spawnSync(py, ['-m', 'venv', venvPath], { cwd: projectRoot, stdio: 'pipe' });
    if (r1.status !== 0) {
      console.error('venv creation failed:', r1.stderr?.toString());
      return null;
    }
  }
  const pip = join(venvPath, 'bin', 'pip');
  const pipdeptree = join(venvPath, 'bin', 'pipdeptree');
  spawnSync(pip, ['install', '-q', 'pipdeptree'], { cwd: projectRoot, stdio: 'pipe' });
  spawnSync(pip, ['install', '-q', '-e', '.[dev]'], { cwd: projectRoot, stdio: 'pipe' });
  if (!existsSync(pipdeptree)) {
    console.error('pipdeptree not installed in venv');
    return null;
  }
  const j = spawnSync(pipdeptree, ['-o', 'json'], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (j.status === 0 && j.stdout) writeFileSync(jsonPath, j.stdout, 'utf8');
  const t = spawnSync(pipdeptree, [], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (t.status === 0 && t.stdout) writeFileSync(textPath, t.stdout, 'utf8');
  return { jsonPath: existsSync(jsonPath) ? jsonPath : null, textPath: existsSync(textPath) ? textPath : null };
}

main().catch((err) => {
  const msg = err?.message || String(err);
  if (msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT')) {
    console.error('Error: network failure. Try --no-registry or --no-audit, or check connectivity.');
  } else if (msg.includes('ENOENT') || msg.includes('no such file')) {
    console.error('Error: path or file not found.', msg);
  } else {
    console.error('Error:', msg);
  }
  process.exit(1);
});
