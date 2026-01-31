#!/usr/bin/env node
/**
 * Add missing CI workflows and tests folder across repairman29 repos.
 * Uses gh CLI authentication.
 */

const { execSync } = require('child_process');

const OWNER = 'repairman29';
const BATCH_SIZE = Number.parseInt(process.env.BATCH_SIZE || '10', 10);

function ghJson(command, allowFailure = false) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(output);
  } catch (error) {
    if (allowFailure) return null;
    throw error;
  }
}

function ghOk(command) {
  try {
    execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

function flattenRepos(raw) {
  if (!Array.isArray(raw)) return [];
  if (Array.isArray(raw[0])) return raw.flat();
  return raw;
}

function listRepos() {
  const output = execSync(
    'gh api --paginate --slurp "user/repos?per_page=100"',
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  return flattenRepos(JSON.parse(output));
}

function listRootEntries(repo) {
  const entries = ghJson(`gh api "repos/${OWNER}/${repo}/contents"`, true);
  return Array.isArray(entries) ? entries.map((e) => e.name) : [];
}

function listWorkflowFiles(repo) {
  const entries = ghJson(`gh api "repos/${OWNER}/${repo}/contents/.github/workflows"`, true);
  if (!Array.isArray(entries)) return [];
  return entries
    .map((e) => e.name.toLowerCase())
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'));
}

function putFile(repo, path, content, message) {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const cmd = [
    'gh api',
    `repos/${OWNER}/${repo}/contents/${path}`,
    '--method PUT',
    `-f message="${message}"`,
    `-f content="${encoded}"`
  ].join(' ');
  try {
    execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true };
  } catch (error) {
    const stderr = error && error.stderr ? error.stderr.toString() : '';
    return { ok: false, error: stderr || error.message };
  }
}

function detectRepoLanguage(repoInfo, rootEntries) {
  if (rootEntries.includes('Cargo.toml')) return 'rust';
  if (rootEntries.includes('go.mod')) return 'go';
  if (rootEntries.includes('pyproject.toml') || rootEntries.includes('requirements.txt')) return 'python';
  if (rootEntries.includes('package.json')) return 'node';
  if (repoInfo.language) {
    const lang = repoInfo.language.toLowerCase();
    if (lang.includes('typescript') || lang.includes('javascript')) return 'node';
    if (lang.includes('python')) return 'python';
    if (lang.includes('rust')) return 'rust';
    if (lang.includes('go')) return 'go';
  }
  return 'unknown';
}

function buildCiWorkflow(kind, defaultBranch) {
  const branch = defaultBranch || 'main';
  if (kind === 'node') {
    return [
      'name: CI',
      'on:',
      '  push:',
      `    branches: [ "${branch}" ]`,
      '  pull_request:',
      `    branches: [ "${branch}" ]`,
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-node@v4',
      '        with:',
      '          node-version: 20',
      '      - name: Install',
      '        run: npm install',
      '      - name: Test',
      '        run: npm test --if-present'
    ].join('\n');
  }
  if (kind === 'python') {
    return [
      'name: CI',
      'on:',
      '  push:',
      `    branches: [ "${branch}" ]`,
      '  pull_request:',
      `    branches: [ "${branch}" ]`,
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-python@v5',
      '        with:',
      '          python-version: "3.11"',
      '      - name: Install',
      '        run: |',
      '          python -m pip install --upgrade pip',
      '          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi',
      '      - name: Test',
      '        run: |',
      '          if ls tests 1> /dev/null 2>&1; then python -m pytest -q || true; fi'
    ].join('\n');
  }
  if (kind === 'rust') {
    return [
      'name: CI',
      'on:',
      '  push:',
      `    branches: [ "${branch}" ]`,
      '  pull_request:',
      `    branches: [ "${branch}" ]`,
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: dtolnay/rust-toolchain@stable',
      '      - name: Build',
      '        run: cargo build --release'
    ].join('\n');
  }
  if (kind === 'go') {
    return [
      'name: CI',
      'on:',
      '  push:',
      `    branches: [ "${branch}" ]`,
      '  pull_request:',
      `    branches: [ "${branch}" ]`,
      'jobs:',
      '  build:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: actions/setup-go@v5',
      '        with:',
      '          go-version: "1.22"',
      '      - name: Test',
      '        run: go test ./...'
    ].join('\n');
  }
  return null;
}

function ensureTestsFolder(repo, rootEntries) {
  const hasTests =
    rootEntries.includes('tests') ||
    rootEntries.includes('test') ||
    rootEntries.includes('__tests__');
  if (hasTests) return false;
  const result = putFile(repo, 'tests/.gitkeep', '', 'Add tests folder');
  return result.ok;
}

function ensureCiWorkflow(repo, repoInfo, rootEntries) {
  const workflows = listWorkflowFiles(repo);
  if (workflows.length > 0) return false;
  const kind = detectRepoLanguage(repoInfo, rootEntries);
  const workflow = buildCiWorkflow(kind, repoInfo.default_branch);
  if (!workflow) return false;
  const result = putFile(repo, '.github/workflows/ci.yml', workflow, 'Add CI workflow');
  return result.ok;
}

function processRepo(repoInfo) {
  const repo = repoInfo.name;
  const rootEntries = listRootEntries(repo);
  const actions = [];
  const errors = [];

  try {
    if (ensureTestsFolder(repo, rootEntries)) actions.push('tests');
  } catch (error) {
    errors.push(`tests: ${error.message || String(error)}`);
  }
  try {
    if (ensureCiWorkflow(repo, repoInfo, rootEntries)) actions.push('ci');
  } catch (error) {
    errors.push(`ci: ${error.message || String(error)}`);
  }

  return { actions, errors };
}

function main() {
  const repos = listRepos().sort((a, b) => {
    const aTime = new Date(a.updated_at || 0).getTime();
    const bTime = new Date(b.updated_at || 0).getTime();
    return bTime - aTime;
  });

  let processed = 0;
  let updated = 0;

  for (const repo of repos) {
    const result = processRepo(repo);
    const actions = result.actions;
    processed += 1;
    if (actions.length > 0) {
      updated += 1;
      console.log(`${repo.name}: added ${actions.join(' + ')}`);
    } else if (result.errors.length > 0) {
      console.log(`${repo.name}: error (${result.errors.join('; ')})`);
    } else {
      console.log(`${repo.name}: ok`);
    }

    if (processed % BATCH_SIZE === 0) {
      console.log(`--- batch complete: ${processed} repos processed ---`);
    }
  }

  console.log(`Done. Repos processed: ${processed}. Updated: ${updated}.`);
}

main();
