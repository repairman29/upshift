#!/usr/bin/env node
/**
 * Start Clawdbot gateway with env hydrated from Supabase Vault.
 * Resolves env/clawdbot/<KEY> from app_secrets + vault, writes them to ~/.clawdbot/.env
 * and ~/.openclaw/.env (so the gateway sees them regardless of which dir it uses), then runs
 * `npx clawdbot gateway run`.
 *
 * Prereqs: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in %USERPROFILE%\.clawdbot\.env
 * (or in Vault as env/clawdbot/SUPABASE_URL and env/clawdbot/SUPABASE_SERVICE_ROLE_KEY).
 *
 * Run from repo root: node scripts/start-gateway-with-vault.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { loadEnvFile, resolveEnv } = require('./vault.js');

const GATEWAY_KEYS = [
  'CLAWDBOT_GATEWAY_TOKEN',
  'GROQ_API_KEY',
  'DISCORD_BOT_TOKEN',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENROUTER_API_KEY',
  'TOGETHER_API_KEY',
  'TOGETHER_USER_KEY',
  'GEMINI_API_KEY',
  'GITHUB_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'ELEVENLABS_API_KEY',
  'REPLICATE_API_TOKEN',
  'STABILITY_API_KEY',
  'JARVIS_ALERT_WEBHOOK_URL',
  'KROGER_CLIENT_ID',
  'KROGER_CLIENT_SECRET',
  'KROGER_LOCATION_ID',
  'KROGER_REFRESH_TOKEN',
  'NTFY_TOPIC',
  'HUE_BRIDGE_IP',
  'HUE_USERNAME',
  'VERCEL_TOKEN',
  'RAILWAY_API_KEY',
  'NETLIFY_AUTH_TOKEN',
  'JARVIS_DISCORD_USER_ID',
  'BRAVE_API_KEY',
  'BRAVE_SEARCH_API_KEY'
];

async function main() {
  const env = loadEnvFile();
  for (const key of GATEWAY_KEYS) {
    const value = await resolveEnv(key, env);
    if (value) {
      process.env[key] = value;
      env[key] = value;
    }
  }

  const allKeys = [...new Set([...Object.keys(env), ...GATEWAY_KEYS])];
  const lines = allKeys.filter((k) => env[k]).map((k) => `${k}=${String(env[k]).replace(/\n/g, ' ')}`);
  const body = lines.join('\n') + '\n';

  const home = os.homedir();
  const envDirs = [
    path.join(home, '.clawdbot'),
    path.join(home, '.openclaw')
  ];
  for (const dir of envDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '.env'), body, 'utf8');
  }

  const repoRoot = path.resolve(__dirname, '..');
  const child = spawn('npx', ['clawdbot', 'gateway', 'run'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    env: process.env
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('start-gateway-with-vault:', err.message);
  process.exit(1);
});
