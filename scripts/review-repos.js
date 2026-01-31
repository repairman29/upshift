#!/usr/bin/env node
/**
 * Review repairman29 repos using gh API.
 * Produces a lightweight quality report without cloning.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OWNER = 'repairman29';
const REPORT_PATH = path.join(process.cwd(), 'reports', 'repairman29-review.md');

function ghApiJson(endpoint, allowFailure = false) {
  const cmd = `gh api "${endpoint}"`;
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(output);
  } catch (error) {
    if (allowFailure) return null;
    throw error;
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

function hasReadme(owner, repo) {
  const readme = ghApiJson(`repos/${owner}/${repo}/readme`, true);
  return Boolean(readme && readme.name);
}

function listRootEntries(owner, repo) {
  const entries = ghApiJson(`repos/${owner}/${repo}/contents`, true);
  return Array.isArray(entries) ? entries.map((e) => e.name.toLowerCase()) : [];
}

function listWorkflows(owner, repo) {
  const entries = ghApiJson(`repos/${owner}/${repo}/contents/.github/workflows`, true);
  if (!Array.isArray(entries)) return [];
  return entries
    .map((e) => e.name.toLowerCase())
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'));
}

function buildFindings(repo, signals) {
  const findings = [];
  if (repo.archived) findings.push('archived');
  if (!signals.hasReadme) findings.push('missing README');
  if (!signals.hasLicense) findings.push('missing LICENSE');
  if (signals.hasCode && !signals.hasWorkflow) findings.push('no CI workflow');
  if (signals.hasPackageJson && !signals.hasTests) findings.push('no tests folder');
  if (signals.hasCargo && !signals.hasTests) findings.push('no tests folder');
  if (signals.hasPython && !signals.hasTests) findings.push('no tests folder');
  return findings;
}

function reviewRepo(repo) {
  const name = repo.name;
  const owner = repo.owner && repo.owner.login ? repo.owner.login : OWNER;

  const rootEntries = listRootEntries(owner, name);
  const workflows = listWorkflows(owner, name);
  const readme = hasReadme(owner, name);

  const signals = {
    hasReadme: readme,
    hasLicense: rootEntries.includes('license') || rootEntries.includes('license.md'),
    hasWorkflow: workflows.length > 0,
    hasPackageJson: rootEntries.includes('package.json'),
    hasCargo: rootEntries.includes('cargo.toml'),
    hasPython: rootEntries.includes('pyproject.toml') || rootEntries.includes('requirements.txt'),
    hasGo: rootEntries.includes('go.mod'),
    hasTests: rootEntries.includes('tests') || rootEntries.includes('test') || rootEntries.includes('__tests__'),
    hasCode: rootEntries.includes('src') || rootEntries.includes('lib') || rootEntries.includes('app')
  };

  const findings = buildFindings(repo, signals);
  return { signals, findings, workflows };
}

function formatRepoLine(repo, findings) {
  const visibility = repo.private ? 'private' : 'public';
  const updated = repo.updated_at || repo.pushed_at || 'unknown';
  const language = repo.language || 'unknown';
  const issues = findings.length ? findings.join('; ') : 'no obvious issues';
  return `- ${repo.name} (${visibility}, ${language}, updated ${updated}) — ${issues}`;
}

function buildReport(repos, reviews) {
  const totals = {
    repos: repos.length,
    missingReadme: 0,
    missingLicense: 0,
    noCi: 0,
    noTests: 0,
    archived: 0
  };

  const lines = [];
  for (const repo of repos) {
    const review = reviews.get(repo.name);
    const findings = review ? review.findings : ['review failed'];
    if (findings.includes('missing README')) totals.missingReadme += 1;
    if (findings.includes('missing LICENSE')) totals.missingLicense += 1;
    if (findings.includes('no CI workflow')) totals.noCi += 1;
    if (findings.includes('no tests folder')) totals.noTests += 1;
    if (findings.includes('archived')) totals.archived += 1;
    lines.push(formatRepoLine(repo, findings));
  }

  return [
    '# repairman29 Repo Review',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    `- Repos reviewed: ${totals.repos}`,
    `- Missing README: ${totals.missingReadme}`,
    `- Missing LICENSE: ${totals.missingLicense}`,
    `- No CI workflow: ${totals.noCi}`,
    `- No tests folder: ${totals.noTests}`,
    `- Archived: ${totals.archived}`,
    '',
    '## Findings',
    ...lines,
    ''
  ].join('\n');
}

function main() {
  const repos = listRepos().sort((a, b) => {
    const aTime = new Date(a.updated_at || 0).getTime();
    const bTime = new Date(b.updated_at || 0).getTime();
    return bTime - aTime;
  });

  const reviews = new Map();
  for (const repo of repos) {
    try {
      const review = reviewRepo(repo);
      reviews.set(repo.name, review);
    } catch (error) {
      reviews.set(repo.name, { findings: ['review failed'], workflows: [] });
    }
  }

  const report = buildReport(repos, reviews);
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  console.log(`Report written to ${REPORT_PATH}`);
}

main();
