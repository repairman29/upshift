#!/usr/bin/env node
/**
 * Register JARVIS slash commands with Discord.
 * Run once after bot setup: node scripts/register-discord-commands.js
 * 
 * Commands:
 *   /jarvis <message>     - Send a message to JARVIS
 *   /brief                - Get daily brief
 *   /focus <on|off>       - Toggle focus mode
 *   /screenshot           - Take a screenshot
 *   /search <term>        - Search files
 */

const https = require('https');
const path = require('path');

// Load env
function loadEnv() {
  try {
    const vaultPath = path.join(__dirname, 'vault.js');
    const vault = require(vaultPath);
    vault.loadEnvFile();
  } catch {
    // Try dotenv fallback
    try {
      require('dotenv').config({ path: path.join(require('os').homedir(), '.clawdbot', '.env') });
    } catch {}
  }
}

loadEnv();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Missing DISCORD_BOT_TOKEN in ~/.clawdbot/.env');
  process.exit(1);
}

// Get application ID from token
async function getApplicationId() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'discord.com',
      path: '/api/v10/users/@me',
      method: 'GET',
      headers: { Authorization: `Bot ${BOT_TOKEN}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to get bot info: ${res.statusCode} ${data}`));
          return;
        }
        const info = JSON.parse(data);
        resolve(info.id);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Register global commands
async function registerCommands(appId) {
  const commands = [
    {
      name: 'jarvis',
      description: 'Send a message to JARVIS',
      options: [{
        name: 'message',
        description: 'What do you want JARVIS to do?',
        type: 3, // STRING
        required: true
      }]
    },
    {
      name: 'brief',
      description: 'Get your daily brief (time, battery, weather, top processes)'
    },
    {
      name: 'focus',
      description: 'Toggle focus mode (mute + do not disturb)',
      options: [{
        name: 'state',
        description: 'Turn focus mode on or off',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'on', value: 'on' },
          { name: 'off', value: 'off' }
        ]
      }]
    },
    {
      name: 'screenshot',
      description: 'Take a screenshot of your screen'
    },
    {
      name: 'search',
      description: 'Search for files',
      options: [{
        name: 'query',
        description: 'Search term or filename',
        type: 3, // STRING
        required: true
      }]
    },
    {
      name: 'color',
      description: 'Pick the color under your cursor'
    },
    {
      name: 'note',
      description: 'Add a quick note',
      options: [{
        name: 'text',
        description: 'Note content',
        type: 3, // STRING
        required: true
      }]
    }
  ];

  const body = JSON.stringify(commands);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'discord.com',
      path: `/api/v10/applications/${appId}/commands`,
      method: 'PUT',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          reject(new Error(`Failed to register commands: ${res.statusCode} ${data}`));
          return;
        }
        resolve(JSON.parse(data));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Registering JARVIS slash commands with Discord...\n');
  
  try {
    const appId = await getApplicationId();
    console.log(`Application ID: ${appId}`);
    
    const result = await registerCommands(appId);
    console.log(`\nRegistered ${result.length} commands:`);
    result.forEach(cmd => {
      console.log(`  /${cmd.name} - ${cmd.description}`);
    });
    
    console.log('\nCommands registered globally (may take up to 1 hour to appear everywhere).');
    console.log('For instant testing, register to a specific guild using --guild <id>');
    console.log('\nNote: Slash commands send the request to JARVIS via DM. Make sure the bot');
    console.log('can DM you and you have paired (see DISCORD_SETUP.md).');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
