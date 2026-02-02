#!/usr/bin/env node
/**
 * Call JARVIS from the command line (or from Cursor). Uses .env at repo root.
 * Usage:  node scripts/call-jarvis.js <task> [json params]
 * Example:  node scripts/call-jarvis.js track_usage '{"feature":"analyze_dependencies"}'
 *           node scripts/call-jarvis.js add_blog_media '{"post":"when-it-breaks-guardrails-hitl.html","instructions":"Add a GIF"}'
 */

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const VAULT_FILE = path.join(ROOT, 'vault', 'jarvis.json');
const ENV_PATH = path.join(ROOT, '.env');

function loadVault() {
  if (!fs.existsSync(VAULT_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function loadEnv() {
  const env = {};
  if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    });
  }
  return env;
}

function getConfig() {
  const vault = loadVault();
  const env = loadEnv();
  return {
    JARVIS_EDGE_URL: vault.JARVIS_EDGE_URL || env.JARVIS_EDGE_URL || process.env.JARVIS_EDGE_URL,
    UPSHIFTAI_API_KEY: vault.UPSHIFTAI_API_KEY || env.UPSHIFTAI_API_KEY || process.env.UPSHIFTAI_API_KEY,
  };
}

async function main() {
  const task = process.argv[2];
  const paramsJson = process.argv[3] || '{}';

  if (!task) {
    console.log('Usage:  node scripts/call-jarvis.js <task> [json params]');
    console.log('Example:  node scripts/call-jarvis.js track_usage \'{"feature":"analyze_dependencies"}\'');
    process.exit(1);
  }

  const config = getConfig();
  const url = config.JARVIS_EDGE_URL;
  const apiKey = config.UPSHIFTAI_API_KEY;

  if (!url || url.includes('YOUR_REF')) {
    console.error('Set JARVIS_EDGE_URL in vault/jarvis.json or .env (see vault/jarvis.json.example).');
    process.exit(1);
  }
  if (!apiKey || apiKey.includes('xxx')) {
    console.error('Set UPSHIFTAI_API_KEY. Run:  cd upshiftai/platform && node ../../scripts/create-upshift-api-key.cjs');
    process.exit(1);
  }

  let params = {};
  try {
    params = JSON.parse(paramsJson);
  } catch (e) {
    console.error('Invalid JSON params:', paramsJson);
    process.exit(1);
  }

  const body = { task, apiKey, ...params };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error('Error', res.status, data);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
