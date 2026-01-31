#!/usr/bin/env node
/**
 * Run OAuth for Microsoft (live.com/Outlook) or Google (gmail.com) from repo root.
 * Usage:
 *   node scripts/auth-office-email.js microsoft   # live.com / outlook.com
 *   node scripts/auth-office-email.js google      # gmail.com
 *   node scripts/auth-office-email.js            # prompt which one
 *
 * Prereq: Add MICROSOFT_CLIENT_ID + MICROSOFT_CLIENT_SECRET or GOOGLE_* to %USERPROFILE%\.clawdbot\.env
 * See scripts/AUTH_OFFICE_EMAIL.md for Azure/Google setup.
 */

const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const microsoftHelper = path.join(repoRoot, 'skills', 'microsoft-365', 'oauth-helper.js');
const googleHelper = path.join(repoRoot, 'skills', 'google-workspace', 'oauth-helper.js');

const arg = (process.argv[2] || '').toLowerCase();
const choice = arg === 'microsoft' || arg === 'ms' || arg === 'outlook' || arg === 'live' ? 'microsoft'
  : arg === 'google' || arg === 'gmail' ? 'google'
  : null;

if (!choice) {
  console.log('');
  console.log('Auth for Office / Email (live.com, gmail.com)');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/auth-office-email.js microsoft   # live.com / outlook.com');
  console.log('  node scripts/auth-office-email.js google      # gmail.com');
  console.log('');
  console.log('Before running:');
  console.log('  Microsoft: Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to %USERPROFILE%\\.clawdbot\\.env');
  console.log('  Google:    Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to %USERPROFILE%\\.clawdbot\\.env');
  console.log('');
  console.log('See scripts/AUTH_OFFICE_EMAIL.md for Azure/Google Cloud setup.');
  console.log('');
  process.exit(0);
}

const script = choice === 'microsoft' ? microsoftHelper : googleHelper;
const name = choice === 'microsoft' ? 'Microsoft (live.com / Outlook)' : 'Google (gmail.com)';

console.log('');
console.log('Running OAuth for ' + name + '...');
console.log('A browser window will open — sign in and approve access.');
console.log('');

const child = spawn(process.execPath, [script], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
