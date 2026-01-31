/**
 * Send a Discord notification when a scheduled job runs.
 * Uses JARVIS_ALERT_WEBHOOK_URL or DISCORD_WEBHOOK_URL from ~/.clawdbot/.env (or Vault).
 *
 * Usage:
 *   node scripts/notify-job.js "Job Name" started
 *   node scripts/notify-job.js "Job Name" finished
 *   node scripts/notify-job.js "Job Name" failed "optional detail"
 */

const path = require('path');

function loadEnv() {
  const vaultPath = path.join(__dirname, 'vault.js');
  const vault = require(vaultPath);
  vault.loadEnvFile();
  return process.env;
}

function getWebhookUrl(env) {
  return env.JARVIS_ALERT_WEBHOOK_URL || env.DISCORD_WEBHOOK_URL || '';
}

function postWebhook(url, body) {
  const { URL } = require('url');
  const u = new URL(url);
  const isHttps = u.protocol === 'https:';
  const http = require(isHttps ? 'https' : 'http');
  const bodyStr = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr, 'utf8')
        }
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode));
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function main() {
  const jobName = process.argv[2] || 'Job';
  const status = (process.argv[3] || 'finished').toLowerCase();
  const detail = process.argv[4] || '';

  const env = loadEnv();
  const webhookUrl = getWebhookUrl(env);

  if (!webhookUrl) {
    process.exit(0);
  }

  const statusEmoji = { started: '▶️', finished: '✅', failed: '❌' }[status] || '📌';
  let content = `JARVIS: **${jobName}** ${statusEmoji} ${status}`;
  if (detail) content += ` — ${detail}`;

  postWebhook(webhookUrl, { content })
    .then(() => process.exit(0))
    .catch(() => process.exit(0));
}

main();
