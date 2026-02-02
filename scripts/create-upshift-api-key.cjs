#!/usr/bin/env node
/**
 * Create an UpshiftAI API key and store it (and optionally JARVIS_EDGE_URL) in vault.
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from platform .env or root .env).
 * Run from repo root: node scripts/create-upshift-api-key.cjs
 * Or from platform (so Supabase resolves): cd upshiftai/platform && node ../../scripts/create-upshift-api-key.cjs
 *
 * Usage:
 *   node scripts/create-upshift-api-key.cjs
 *   node scripts/create-upshift-api-key.cjs --edge-url https://YOUR_REF.supabase.co/functions/v1/jarvis
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PLATFORM_ENV = path.join(ROOT, 'upshiftai', 'platform', '.env');
const VAULT_DIR = path.join(ROOT, 'vault');
const VAULT_FILE = path.join(VAULT_DIR, 'jarvis.json');
const VAULT_EXAMPLE = path.join(VAULT_DIR, 'jarvis.json.example');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  });
  return env;
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function parseArgv() {
  const args = process.argv.slice(2);
  let edgeUrl = process.env.JARVIS_EDGE_URL || '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--edge-url' && args[i + 1]) {
      edgeUrl = args[i + 1];
      break;
    }
  }
  return { edgeUrl };
}

async function main() {
  const { edgeUrl } = parseArgv();

  const env = { ...loadEnv(path.join(ROOT, '.env')), ...loadEnv(PLATFORM_ENV), ...process.env };
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    console.error('Set them in .env at repo root or in upshiftai/platform/.env');
    process.exit(1);
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get or create a user (users.id is UUID in Supabase)
  let userId = env.CURSOR_USER_ID;
  if (!userId) {
    const { data: existing } = await supabase.from('users').select('id').eq('email', 'cursor@local').limit(1).maybeSingle();
    if (existing) {
      userId = existing.id;
    } else {
      const { data: newUser, error: createErr } = await supabase.from('users').insert([{ email: 'cursor@local' }]).select('id').single();
      if (createErr || !newUser) {
        console.error('Could not get or create user. Set CURSOR_USER_ID to an existing user id (UUID), or create user in DB:', createErr?.message);
        process.exit(1);
      }
      userId = newUser.id;
    }
  }

  // Ensure Pro subscription for this user (so quota works)
  await supabase.from('subscriptions').upsert(
    { user_id: userId, status: 'active', updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  const key = `uai_pro_${Date.now()}_${crypto.randomBytes(12).toString('base64url')}`;
  const keyHash = hashKey(key);
  const createdAt = new Date().toISOString();
  // Support both schemas: key_hash only (repo schema) or api_key_value (live DB)
  const insertRow = {
    user_id: userId,
    created_at: createdAt,
    key_hash: keyHash,
    api_key_value: key,
    name: 'Cursor / JARVIS',
  };
  const { error: keyError } = await supabase.from('api_keys').insert(insertRow);

  if (keyError) {
    console.error('Failed to create API key:', keyError.message);
    process.exit(1);
  }

  if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
  let vault = {};
  if (fs.existsSync(VAULT_FILE)) {
    try {
      vault = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
    } catch (e) {}
  } else if (fs.existsSync(VAULT_EXAMPLE)) {
    try {
      vault = JSON.parse(fs.readFileSync(VAULT_EXAMPLE, 'utf8'));
    } catch (e) {}
  }
  vault.JARVIS_EDGE_URL = edgeUrl || vault.JARVIS_EDGE_URL || '';
  vault.UPSHIFTAI_API_KEY = key;
  fs.writeFileSync(VAULT_FILE, JSON.stringify(vault, null, 2), 'utf8');

  console.log('API key created and stored in vault.');
  console.log('vault/jarvis.json');
  console.log('UPSHIFTAI_API_KEY:', key);
  if (vault.JARVIS_EDGE_URL) {
    console.log('JARVIS_EDGE_URL:', vault.JARVIS_EDGE_URL);
  } else {
    console.log('Add JARVIS_EDGE_URL to vault/jarvis.json after deploying the Edge function.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
