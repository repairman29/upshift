/**
 * Full "deep throat" report: direct deps + transitive tree + something-old chains.
 * Leads with a one-pager so the report "lands" (headline + do this first + bottom line).
 */

import { reportToMarkdown } from './report.js';
import { getReplacementSuggestions } from './suggestions.js';

/**
 * Build only the "In one page" section (for --summary output).
 * @param {object} directReport - from analyze()
 * @param {{ somethingOldChains?: Array<{ name: string, version: string, chain: string, why: string }>, ecosystem?: string }} [options]
 * @returns {string} markdown one-pager
 */
export function buildOnePager(directReport, options = {}) {
  const somethingOldChains = options.somethingOldChains || [];
  const ecosystem = options.ecosystem || directReport.ecosystem || 'npm';
  const auditLabel = ecosystem === 'pip' ? 'pip-audit' : 'npm audit';
  const summary = directReport.summary || {};
  const ancientCount = summary.ancient ?? 0;
  const totalCount = summary.total ?? 0;
  const hasChains = somethingOldChains.length > 0;
  const problemCount = hasChains ? somethingOldChains.length : ancientCount;
  const lines = ['---', '', '## In one page (read this first)', ''];

  const audit = directReport.audit || {};
  const vulnCount = (audit.critical ?? 0) + (audit.high ?? 0);
  const tldrParts = [];
  if (problemCount > 0) tldrParts.push(`${problemCount} stale dep${problemCount !== 1 ? 's' : ''}`);
  if (vulnCount > 0) tldrParts.push(`${vulnCount} high/critical vuln${vulnCount !== 1 ? 's' : ''}`);
  const fixHint = ecosystem === 'pip' ? 'pip' : 'npm';
  const tldrLine = tldrParts.length
    ? `**TL;DR:** ${tldrParts.join(', ')}. Run \`upshiftai-deps apply fix --dry-run\` to preview fixes (${fixHint}).`
    : '**TL;DR:** No major issues. Keep running this report when you add deps.';
  lines.push(tldrLine, '');

  const auditCritical = audit.critical ?? 0;
  const auditHigh = audit.high ?? 0;
  const hasAuditIssues = auditCritical > 0 || auditHigh > 0;

  if (hasChains || ancientCount > 0 || hasAuditIssues) {
    const riskLevel = hasAuditIssues || hasChains || ancientCount >= 3 ? 'High' : ancientCount >= 1 ? 'Medium' : 'Low';
    const riskEmoji = riskLevel === 'High' ? '🔴' : riskLevel === 'Medium' ? '🟡' : '🟢';
    const auditLine = hasAuditIssues ? ` **${auditCritical + auditHigh}** security vulnerability/vulnerabilities (${auditLabel}).` : '';
    const directCount = summary.direct ?? 0;
    const transitiveCount = summary.transitive ?? 0;
    const radius = directCount > 0 || transitiveCount > 0 ? ` (${directCount} direct, ${transitiveCount} transitive)` : '';
    const mainLine = problemCount > 0
      ? `${problemCount} unmaintained or legacy ${problemCount === 1 ? 'dependency' : 'dependencies'} ${hasChains ? 'in your transitive tree' : 'among your direct deps'}${radius}.${auditLine}`
      : (hasAuditIssues ? `Security: ${auditCritical + auditHigh} vulnerability/vulnerabilities from ${auditLabel}.${auditLine}` : '');
    lines.push(`${riskEmoji} **Risk: ${riskLevel}** — ${mainLine}`, '');
    const issueLine = hasChains
      ? `**${somethingOldChains.length} package${somethingOldChains.length !== 1 ? 's' : ''}** in your dependency tree haven't been updated in 2+ years (or pin you to old Python). Security patches and compatibility fixes are unlikely to land unless you act.`
      : ancientCount > 0
        ? `**${ancientCount}** of your **${totalCount}** direct dependencies haven't had a release in 24+ months. That means no security fixes, no compatibility updates, and increasing technical debt.`
        : hasAuditIssues
          ? `**${auditLabel}** reports **${auditCritical + auditHigh}** high/critical vulnerability/vulnerabilities. Run \`${ecosystem === 'pip' ? 'pip-audit --fix' : 'npm audit fix'}\` or upgrade the affected packages.`
          : '';
    if (issueLine) lines.push('**The issue:** ' + issueLine, '');
    lines.push('', '**If you do nothing:** You stay exposed to known vulnerabilities, stuck on old Python where applicable, and blocked from upgrading the rest of your stack.', '');
    if (hasChains) {
      const first = somethingOldChains[0];
      const firstSuggestion = getReplacementSuggestions(first.name);
      const startHere = firstSuggestion
        ? `Start with **${first.name}** — ${firstSuggestion.replacement}. That often unlocks the rest of the chain.`
        : `Start with **${first.name}** (pulled in by: ${first.chain}). Upgrade or replace it, then re-run this report.`;
      lines.push('**Do this first:**', '', startHere, '', '');
      lines.push('| Package | Pulled in by | Why it matters | What to do |');
      lines.push('|---------|--------------|----------------|------------|');
      let withSuggestion = 0;
      for (const row of somethingOldChains) {
        const suggestion = getReplacementSuggestions(row.name);
        if (suggestion) withSuggestion++;
        const whatToDo = suggestion ? suggestion.replacement : 'Upgrade or pin; see details below.';
        lines.push(`| **${row.name}** | ${row.chain} | ${row.why} | ${whatToDo} |`);
      }
      if (withSuggestion > 0) lines.push('', `*Good news: we have drop-in replacements for **${withSuggestion}** of these (see "What to do" column).*`, '');
      lines.push('', '**Bottom line:** Fix the packages in the table above and you remove the main risk.', '');
      lines.push('', '**Next:** `upshiftai-deps apply fix --dry-run` (npm) or fix packages in the table.', '', '---', '', '');
    } else if (ancientCount > 0) {
      lines.push('**Do this first:** Review the ancient direct deps; upgrade or replace them. Re-run with `report --full-tree` to see transitive chains.', '', '**Bottom line:** ' + ancientCount + ' direct dep(s) are stale; upgrade or replace to reduce risk.', '');
      lines.push('', '**Next:** `upshiftai-deps apply fix --dry-run` (npm) or upgrade the packages above.', '', '---', '', '');
    } else if (hasAuditIssues) {
      const fixCmd = ecosystem === 'pip' ? 'pip-audit --fix' : 'npm audit fix';
      lines.push(`**Do this first:** Run \`${fixCmd}\` (or fix manually). See Security section below.`, '', '**Bottom line:** Address the vulnerabilities above to reduce risk.', '');
      lines.push('', `**Next:** \`${fixCmd}\` then re-run this report.`, '', '---', '', '');
    }
  } else {
    lines.push('🟢 **Risk: Low** — No unmaintained or legacy dependencies detected.', '');
    if (auditCritical + auditHigh + (audit.moderate ?? 0) + (audit.low ?? 0) > 0) {
      lines.push(`**Note:** ${auditLabel} reports ${(audit.critical ?? 0) + (audit.high ?? 0) + (audit.moderate ?? 0) + (audit.low ?? 0)} total vulnerability/vulnerabilities (see Security section).`, '');
    }
    lines.push('**Recommendation:** Keep running this report when you add or change dependencies.', '', '---', '', '');
  }
  return lines.join('\n');
}

/**
 * @param {object} directReport - from analyze()
 * @param {object} options
 * @param {string} [options.projectName] - e.g. "citrascope"
 * @param {string} [options.projectUrl] - e.g. "https://github.com/citra-space/citrascope"
 * @param {string} [options.projectDescription] - one-line from pyproject
 * @param {Array<{ name: string, version: string, chain: string, why: string }>} [options.somethingOldChains] - from buildSomethingOldChains
 * @param {string} [options.pipTreeText] - raw pipdeptree text output for <details> block
 * @param {string} [options.ecosystem] - npm | pip | go
 * @param {boolean} [options.hadPipTree] - true if transitive tree was included
 * @param {boolean} [options.includeLicenses] - add Licenses section
 * @returns {string} full markdown report
 */
export function buildFullReport(directReport, options = {}) {
  const {
    projectName = 'project',
    projectUrl = '',
    projectDescription = '',
    somethingOldChains = [],
    pipTreeText = '',
    ecosystem = directReport.ecosystem || 'npm',
    hadPipTree = false,
    includeLicenses = false,
  } = options;

  const title = projectName ? `${projectName} — Full Dependency Report` : 'Full Dependency Report';
  const lines = [
    `# ${title}`,
    '',
    `**Generated:** ${new Date().toISOString().slice(0, 10)}`,
    `**Tools:** [UpshiftAI](https://upshiftai.dev) (direct deps)${pipTreeText ? ' + **pipdeptree** (full transitive tree)' : ''}`,
    '',
  ];
  if (projectUrl) {
    lines.push(`**Project:** ${projectUrl}`);
    if (projectDescription) lines.push(`**About:** ${projectDescription}`);
    lines.push('', '');
  } else if (projectDescription) {
    lines.push(`**About:** ${projectDescription}`, '', '');
  }

  // One-pager (reuse buildOnePager)
  lines.push(buildOnePager(directReport, { somethingOldChains }), '');

  if (directReport.auditVulnerabilities && directReport.auditVulnerabilities.length > 0) {
    const auditLabel = ecosystem === 'pip' ? 'pip-audit' : 'npm audit';
    lines.push(`## Security (${auditLabel})`, '');
    lines.push('| Package | Severity | Via |');
    lines.push('|---------|----------|-----|');
    for (const v of directReport.auditVulnerabilities.slice(0, 50)) {
      lines.push(`| ${v.name} | ${v.severity} | ${(v.via || '').slice(0, 60)} |`);
    }
    if (directReport.auditVulnerabilities.length > 50) {
      lines.push('', `*… and ${directReport.auditVulnerabilities.length - 50} more. Run \`npm audit\` for full list.*`, '');
    }
    lines.push('', '---', '', '');
  }

  if (somethingOldChains.length > 0) {
    lines.push('## The "something old" chains (transitive)', '');
    lines.push('When your guy says "everything depends on something else made by someone awhile ago that runs on old Python," this is where it shows up in the **actual installed tree**:', '', '');
    lines.push('| Transitive dep | Pulled in by | Why it matters |');
    lines.push('|----------------|--------------|----------------|');
    for (const row of somethingOldChains) {
      lines.push(`| **${row.name}** | ${row.chain} | ${row.why} |`);
    }
    lines.push('', '---', '', '');
  }

  if (pipTreeText) {
    lines.push('## Full transitive tree (from pipdeptree)', '');
    lines.push('Below is the full tree from `pip install -e ".[dev]"` (or your install) then `pipdeptree`. So this is the **real** dependency graph (with versions pip chose).', '', '');
    lines.push('<details>');
    lines.push('<summary>Click to expand: full pipdeptree output</summary>');
    lines.push('');
    lines.push('```');
    lines.push(pipTreeText.trim());
    lines.push('```');
    lines.push('');
    lines.push('</details>');
    lines.push('', '---', '', '');
  }

  if (includeLicenses && directReport.entries && directReport.entries.some((e) => e.license)) {
    const byLicense = new Map();
    for (const e of directReport.entries) {
      if (e.license) {
        const L = e.license;
        if (!byLicense.has(L)) byLicense.set(L, []);
        byLicense.get(L).push(e.name);
      }
    }
    lines.push('## Licenses', '');
    lines.push('| License | Packages |');
    lines.push('|---------|----------|');
    for (const [lic, names] of [...byLicense.entries()].sort((a, b) => b[1].length - a[1].length)) {
      lines.push(`| ${lic} | ${names.length} (${names.slice(0, 5).join(', ')}${names.length > 5 ? '…' : ''}) |`);
    }
    lines.push('', '---', '', '');
  }

  lines.push('## Direct dependencies (UpshiftAI)', '');
  lines.push(reportToMarkdown(directReport));
  lines.push('');
  lines.push('---');
  lines.push('');
  if (ecosystem === 'pip' && !hadPipTree) {
    lines.push('*Full report generated by upshiftai-deps report. To include transitive "something old" chains and the full tree, re-run with `--full-tree` (or `--pip-tree tree.json` after `pipdeptree -o json > tree.json`).*');
  } else if (hadPipTree) {
    lines.push('*Full report generated by upshiftai-deps report. Transitive data was included from pipdeptree.*');
  } else {
    lines.push('*Full report generated by upshiftai-deps report.*');
  }

  return lines.join('\n');
}
