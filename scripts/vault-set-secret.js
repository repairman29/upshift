#!/usr/bin/env node
/**
 * Add a single secret to Supabase Vault (app_secrets + vault.create_secret).
 * Usage: node scripts/vault-set-secret.js <KEY> <VALUE> [notes]
 * Example: node scripts/vault-set-secret.js DISCORD_ALLOWED_USER_ID 377601792764018698 "Discord user ID for elevated allowlist"
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in ~/.clawdbot/.env. Requires exec_sql RPC in Supabase.
 */
const path = require('path');
const os = require('os');
const { loadEnvFile } = require('./vault.js');

function dollarQuote(value) {
  const base = 'vault';
  let tag = base;
  while (value.includes(`$${tag}$`)) {
    tag = `${base}${Math.floor(Math.random() * 1e6)}`;
  }
  return `$${tag}$${value}$${tag}$`;
}

async function execSql(sqlQuery) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set in ~/.clawdbot/.env');
  }
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql_query: sqlQuery })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`exec_sql failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function restSelect(table, select, filter) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set('select', select);
  Object.entries(filter || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    method: 'GET',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
  });
  if (!res.ok) throw new Error(`GET ${table} failed (${res.status})`);
  return res.json();
}

async function main() {
  const key = process.argv[2];
  const value = process.argv[3];
  const notes = process.argv[4] || 'Set via vault-set-secret.js';
  if (!key || value === undefined) {
    console.error('Usage: node scripts/vault-set-secret.js <KEY> <VALUE> [notes]');
    process.exit(1);
  }
  loadEnvFile();
  const name = `env/clawdbot/${key}`;
  const rows = await restSelect('app_secrets', 'name', { name: `eq.${name}` });
  if (Array.isArray(rows) && rows.length > 0) {
    console.log(JSON.stringify({ name, updated: false, message: 'already exists' }, null, 2));
    return;
  }
  const nameSql = dollarQuote(name);
  const valueSql = dollarQuote(String(value));
  const notesSql = dollarQuote(notes);
  const sql = `
with s as (
  select vault.create_secret(${valueSql}, ${nameSql}, ${notesSql}) as id
)
insert into public.app_secrets (name, secret_id, source, notes)
select ${nameSql}, s.id, 'env', ${notesSql}
from s;
`;
  await execSql(sql);
  console.log(JSON.stringify({ name, created: true }, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
