#!/usr/bin/env node
/**
 * Set up JARVIS: Vault access, elevated exec, bootstrap size, and checklist for secrets.
 * - Ensures ~/.clawdbot exists and has clawdbot.json with tools.elevated + bootstrapMaxChars.
 * - Discord user ID for elevated: from env JARVIS_DISCORD_USER_ID or Vault env/clawdbot/JARVIS_DISCORD_USER_ID.
 * - Runs vault-healthcheck. Tells you which secrets to add to Vault for gateway + POV/shipping.
 *
 * Prereqs: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in ~/.clawdbot/.env (so we can read Vault).
 * Run from repo root: node scripts/setup-jarvis-vault-and-access.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadEnvFile, resolveEnv } = require('./vault.js');

const HOME = os.homedir();
const CLAWDBOT_DIR = path.join(HOME, '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');

function log(msg, color = '') {
  const c = color === 'green' ? '\x1b[32m' : color === 'yellow' ? '\x1b[33m' : color === 'cyan' ? '\x1b[36m' : '';
  console.log(`${c}${msg}\x1b[0m`);
}

async function main() {
  log('JARVIS setup: Vault + access', 'cyan');
  log('=============================', 'cyan');

  const env = loadEnvFile();
  if (!env.SUPABASE_URL || (!env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_KEY)) {
    log('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ~/.clawdbot/.env', 'yellow');
    log('Add them so this script can verify Vault and read JARVIS_DISCORD_USER_ID from Vault.', 'yellow');
    log('Then run: node scripts/setup-jarvis-vault-and-access.js', 'yellow');
    process.exit(1);
  }

  // Vault healthcheck (optional: if no secrets in Vault yet, we still merge clawdbot.json)
  try {
    const { execSync } = require('child_process');
    execSync('node scripts/vault-healthcheck.js', { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
    log('Vault access OK', 'green');
  } catch (e) {
    log('Vault healthcheck failed or no secrets in Vault yet. Continuing to update clawdbot.json.', 'yellow');
    log('Ensure docs/sql/001_app_secrets.sql and 002_vault_helpers.sql are run in Supabase; add SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY to ~/.clawdbot/.env.', 'yellow');
  }

  // Discord user ID: env then Vault
  let discordUserId = process.env.JARVIS_DISCORD_USER_ID || env.JARVIS_DISCORD_USER_ID;
  if (!discordUserId) {
    const fromVault = await resolveEnv('JARVIS_DISCORD_USER_ID', env);
    if (fromVault) discordUserId = fromVault;
  }
  if (!discordUserId) {
    log('JARVIS_DISCORD_USER_ID not set.', 'yellow');
    log('Set it in ~/.clawdbot/.env or add to Vault: node scripts/vault-set-secret.js JARVIS_DISCORD_USER_ID YOUR_DISCORD_ID "Discord user ID for elevated allowlist"', 'yellow');
    log('Then re-run this script so clawdbot.json gets tools.elevated.allowFrom.discord.', 'yellow');
  }

  // Ensure .clawdbot dir
  if (!fs.existsSync(CLAWDBOT_DIR)) {
    fs.mkdirSync(CLAWDBOT_DIR, { recursive: true });
    log('Created ~/.clawdbot', 'green');
  }

  // Read or create clawdbot.json
  let config = {};
  if (fs.existsSync(CLAWDBOT_JSON)) {
    try {
      config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
    } catch (e) {
      log('Could not parse clawdbot.json; will merge into a fresh object.', 'yellow');
    }
  }

  // Merge tools.elevated
  if (!config.tools) config.tools = {};
  if (!config.tools.elevated) config.tools.elevated = { enabled: false, allowFrom: {} };
  config.tools.elevated.enabled = true;
  if (!config.tools.elevated.allowFrom) config.tools.elevated.allowFrom = {};
  if (!config.tools.elevated.allowFrom.discord) config.tools.elevated.allowFrom.discord = [];
  if (discordUserId && !config.tools.elevated.allowFrom.discord.includes(discordUserId)) {
    config.tools.elevated.allowFrom.discord.push(discordUserId);
    log('Added your Discord user ID to tools.elevated.allowFrom.discord', 'green');
  }

  // Merge agents.defaults.bootstrapMaxChars (reduce context overflow)
  if (!config.agents) config.agents = {};
  if (!config.agents.defaults) config.agents.defaults = {};
  if (config.agents.defaults.bootstrapMaxChars == null) {
    config.agents.defaults.bootstrapMaxChars = 5000;
    log('Set agents.defaults.bootstrapMaxChars to 5000', 'green');
  }

  fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
  log('Wrote ~/.clawdbot/clawdbot.json', 'green');

  // Checklist: secrets for gateway + POV/shipping
  log('', '');
  log('Secrets for gateway + POV/shipping (add to Vault so start-gateway-with-vault.js can use them):', 'cyan');
  log('  GITHUB_TOKEN       — repo read/write; needed for push, issues, PRs, workflow_dispatch.', '');
  log('  DISCORD_BOT_TOKEN  — Discord bot (if not already in Vault).', '');
  log('  GROQ_API_KEY      — Groq chat (if not already).', '');
  log('  (Optional) VERCEL_TOKEN, RAILWAY_API_KEY — if POV deploys to Vercel/Railway.', '');
  log('', '');
  log('Add a secret to Vault:', 'cyan');
  log('  node scripts/vault-set-secret.js GITHUB_TOKEN <your_github_pat> "GitHub PAT for repo push"', '');
  log('  node scripts/vault-set-secret.js JARVIS_DISCORD_USER_ID <your_discord_id> "Discord user for elevated"', '');
  log('', '');
  log('Start the gateway with Vault (loads secrets into ~/.clawdbot/.env and runs gateway):', 'green');
  log('  node scripts/start-gateway-with-vault.js', 'green');
  log('', '');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
