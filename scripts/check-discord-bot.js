#!/usr/bin/env node
/**
 * Check Discord bot token via Discord API: verify token and list guilds.
 * Scopes (bot, applications.commands) and intents (Message Content Intent) are set
 * in the Developer Portal and are not returned by the API.
 *
 * Run: node scripts/check-discord-bot.js
 * Reads DISCORD_BOT_TOKEN from Supabase Vault (env/clawdbot/DISCORD_BOT_TOKEN),
 * then %USERPROFILE%\.clawdbot\.env, then DISCORD_BOT_TOKEN env.
 */

const https = require('https');
const { loadEnvFile, resolveEnv } = require('./vault.js');

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: { Authorization: `Bot ${token}` },
    };
    https.get(opts, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`${res.statusCode} ${body}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const env = loadEnvFile();
  const token = (await resolveEnv('DISCORD_BOT_TOKEN', env)) || process.env.DISCORD_BOT_TOKEN || env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('DISCORD_BOT_TOKEN not set. Add it to Vault (env/clawdbot/DISCORD_BOT_TOKEN) or %USERPROFILE%\\.clawdbot\\.env');
    process.exit(1);
  }

  console.log('Checking Discord bot token via API...\n');

  try {
    const me = await get('https://discord.com/api/v10/users/@me', token);
    console.log('Bot user (token valid):');
    console.log('  ID:', me.id);
    console.log('  Username:', me.username);
    if (me.global_name) console.log('  Global name:', me.global_name);
    console.log('');

    const guilds = await get('https://discord.com/api/v10/users/@me/guilds', token);
    console.log('Guilds (servers) the bot is in:', guilds.length);
    guilds.slice(0, 10).forEach((g) => console.log('  -', g.name, `(id: ${g.id})`));
    if (guilds.length > 10) console.log('  ... and', guilds.length - 10, 'more');
    console.log('');
    console.log('Scopes (bot, applications.commands) and intents (Message Content Intent)');
    console.log('are set in the Developer Portal, not returned by the API.');
    console.log('Portal: https://discord.com/developers/applications → your app → Bot');
  } catch (e) {
    console.error('Discord API error:', e.message);
    if (e.message.includes('401')) console.error('Token invalid or expired. Reset in Developer Portal → Bot → Token.');
    process.exit(1);
  }
}

main();
