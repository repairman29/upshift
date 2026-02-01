/**
 * UpshiftAI dependency analysis skill for JARVIS/CLAWDBOT.
 * Runs upshiftai-deps analyze/report and returns a short summary or one-pager.
 * 
 * AI FEATURES GATED: Requires UpshiftAI Pro subscription and API key.
 */

const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');
const https = require('https');

const UPSHIFTAI_API_BASE = process.env.UPSHIFTAI_API_BASE || 'https://api.upshiftai.dev';
const FREE_TIER_LIMIT = 10; // Free AI queries per month

const CLAWDBOT_ROOT = process.env.JARVIS_CLAWDBOT_ROOT || path.resolve(__dirname, '../..');
const UPSHIFTAI_CLI = process.env.UPSHIFTAI_CLI_PATH || path.join(CLAWDBOT_ROOT, 'upshiftai', 'bin', 'upshiftai-deps.js');

function ensureCli() {
  if (!fs.existsSync(UPSHIFTAI_CLI)) {
    return { error: `UpshiftAI CLI not found at ${UPSHIFTAI_CLI}. Set UPSHIFTAI_CLI_PATH or run from CLAWDBOT.` };
  }
  return { cli: UPSHIFTAI_CLI };
}

/**
 * Check AI quota and track usage
 * @param {string} feature - 'analyze_dependencies' | 'dependency_health'
 * @returns {Promise<{ ok: boolean, error?: string, remaining?: number }>}
 */
async function checkAndTrackAIUsage(feature) {
  const apiKey = process.env.UPSHIFTAI_API_KEY;
  
  if (!apiKey) {
    return {
      ok: false,
      error: `🤖 AI features require UpshiftAI Pro subscription. Get your API key at ${UPSHIFTAI_API_BASE}/pricing

Free tier: ${FREE_TIER_LIMIT} AI queries/month
Pro tier ($19/mo): 1,000 AI queries/month
Team tier ($99/mo): 10,000 AI queries/month

Set UPSHIFTAI_API_KEY=your_key to enable AI features.`
    };
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({ feature, apiKey });
    const options = {
      hostname: new URL(UPSHIFTAI_API_BASE).hostname,
      port: 443,
      path: '/api/ai/track-usage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(responseData);
            resolve({ ok: true, remaining: result.remaining });
          } else if (res.statusCode === 429) {
            const result = JSON.parse(responseData);
            resolve({ 
              ok: false, 
              error: `🚫 AI quota exceeded. ${result.message}

Upgrade at ${UPSHIFTAI_API_BASE}/pricing for higher limits:
Pro: 1,000 queries/month ($19/mo)
Team: 10,000 queries/month ($99/mo)` 
            });
          } else if (res.statusCode === 401) {
            resolve({ 
              ok: false, 
              error: `🔑 Invalid API key. Get a valid key at ${UPSHIFTAI_API_BASE}/dashboard` 
            });
          } else {
            resolve({ 
              ok: false, 
              error: `API error (${res.statusCode}). Contact support@upshiftai.dev` 
            });
          }
        } catch (e) {
          // Fallback: allow usage but warn
          console.warn('UpshiftAI API unavailable, allowing usage');
          resolve({ ok: true, remaining: null });
        }
      });
    });

    req.on('error', () => {
      // Fallback: allow usage if API is down
      console.warn('UpshiftAI API unavailable, allowing usage');
      resolve({ ok: true, remaining: null });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ ok: true, remaining: null });
    });

    req.write(data);
    req.end();
  });
}

function runCli(args, projectPath, timeout = 60000) {
  const { error, cli } = ensureCli();
  if (error) return { error, stdout: '', stderr: '' };
  const r = spawnSync('node', [cli, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout,
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    error: r.error ? r.error.message : null,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    status: r.status,
  };
}

/**
 * analyze_dependencies(projectPath?, summaryOnly?, includeFullReport?)
 * 🤖 AI-POWERED: Requires UpshiftAI Pro subscription
 */
async function analyze_dependencies({ projectPath = '.', summaryOnly = true, includeFullReport = false }) {
  // Check AI quota first
  const usageCheck = await checkAndTrackAIUsage('analyze_dependencies');
  if (!usageCheck.ok) {
    return {
      ok: false,
      error: usageCheck.error,
      summary: null,
      onePager: null,
      report: null,
    };
  }

  const resolved = path.resolve(process.cwd(), projectPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return {
      ok: false,
      error: `Path does not exist or is not a directory: ${resolved}`,
      summary: null,
      onePager: null,
      report: null,
    };
  }

  if (includeFullReport) {
    const out = runCli(['analyze', resolved, '--json'], resolved);
    if (out.error) {
      return { ok: false, error: out.error, summary: null, onePager: null, report: null };
    }
    let report = null;
    try {
      report = JSON.parse(out.stdout.trim());
    } catch (_) {
      return { ok: false, error: 'Failed to parse analyze JSON', summary: null, onePager: null, report: null };
    }
    const oneOut = runCli(['report', resolved, '--summary'], resolved);
    const onePager = oneOut.stdout.trim() || null;
    const s = report.summary || {};
    return {
      ok: report.ok === true,
      error: report.error || null,
      summary: {
        total: s.total ?? 0,
        ancient: s.ancient ?? 0,
        deprecated: s.deprecated ?? 0,
        direct: s.direct ?? 0,
        transitive: s.transitive ?? 0,
        ecosystem: report.ecosystem || 'npm',
        vulns: (report.audit && (report.audit.critical + report.audit.high)) || 0,
      },
      onePager,
      report: includeFullReport ? report : null,
    };
  }

  if (summaryOnly) {
    const out = runCli(['report', resolved, '--summary'], resolved);
    if (out.error) {
      return { ok: false, error: out.error, onePager: null, summary: null };
    }
    const onePager = out.stdout.trim();
    const jsonOut = runCli(['analyze', resolved, '--json'], resolved);
    let summary = null;
    if (!jsonOut.error && jsonOut.stdout) {
      try {
        const data = JSON.parse(jsonOut.stdout.trim());
        const s = data.summary || {};
        summary = {
          total: s.total ?? 0,
          ancient: s.ancient ?? 0,
          deprecated: s.deprecated ?? 0,
          direct: s.direct ?? 0,
          transitive: s.transitive ?? 0,
          ecosystem: data.ecosystem || 'npm',
          vulns: (data.audit && (data.audit.critical + data.audit.high)) || 0,
        };
      } catch (_) {}
    }
    return {
      ok: true,
      onePager: onePager || null,
      summary,
    };
  }

  const out = runCli(['analyze', resolved, '--json'], resolved);
  if (out.error) {
    return { ok: false, error: out.error, summary: null, problematic: null };
  }
  let report = null;
  try {
    report = JSON.parse(out.stdout.trim());
  } catch (_) {
    return { ok: false, error: 'Failed to parse analyze JSON', summary: null, problematic: null };
  }
  const s = report.summary || {};
  const problematic = (report.entries || [])
    .filter((e) => e.ancient || e.deprecated || e.forkHint)
    .slice(0, 15)
    .map((e) => ({ name: e.name, version: e.version, reasons: e.reasons || [] }));
  return {
    ok: report.ok === true,
    error: report.error || null,
    summary: {
      total: s.total ?? 0,
      ancient: s.ancient ?? 0,
      deprecated: s.deprecated ?? 0,
      direct: s.direct ?? 0,
      transitive: s.transitive ?? 0,
      ecosystem: report.ecosystem || 'npm',
      vulns: (report.audit && (report.audit.critical + report.audit.high)) || 0,
    },
    problematic,
  };
}

/**
 * dependency_health(projectPath?)
 * 🤖 AI-POWERED: Requires UpshiftAI Pro subscription
 */
async function dependency_health({ projectPath = '.' }) {
  // Check AI quota first
  const usageCheck = await checkAndTrackAIUsage('dependency_health');
  if (!usageCheck.ok) {
    return {
      ok: false,
      error: usageCheck.error,
      status: null,
      message: null,
    };
  }

  const resolved = path.resolve(process.cwd(), projectPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return {
      ok: false,
      error: `Path does not exist or is not a directory: ${resolved}`,
      status: null,
      message: null,
    };
  }
  const out = runCli(['health', resolved, '--json'], resolved, 30000);
  if (out.error) {
    return { ok: false, error: out.error, status: null, message: null };
  }
  try {
    const data = JSON.parse(out.stdout.trim());
    return {
      ok: data.status === 'OK',
      status: data.status,
      message: data.message,
      summary: data.summary || null,
      audit: data.audit || null,
    };
  } catch (_) {
    return { ok: false, error: 'Failed to parse health JSON', status: null, message: null };
  }
}

module.exports = {
  analyze_dependencies,
  dependency_health,
};
