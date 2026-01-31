#!/usr/bin/env node
/**
 * Repo Indexer: clones repairman29 repos, chunks content, generates embeddings,
 * and upserts into Supabase for cross-repo search.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { loadEnvFile: loadVaultEnv, resolveEnv } = require('./vault.js');

const DEFAULT_CACHE_DIR = path.join(os.homedir(), '.jarvis', 'repos-cache');
const DEFAULT_OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MAX_FILE_BYTES = 200 * 1024;
const DEFAULT_CHUNK_CHARS = 1800;
const DEFAULT_CHUNK_OVERLAP = 200;

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  purple: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function loadEnvFile() {
  const env = loadVaultEnv();
  if (Object.keys(env).length === 0) {
    log('Supabase env file not found in known locations.', 'yellow');
  } else {
    log(`Loaded env file: ~/.clawdbot/.env (${Object.keys(env).length} keys)`, 'blue');
  }
  return env;
}

function getEnv(key, fallbackEnv) {
  return process.env[key] || fallbackEnv[key];
}

function safeExec(command, options = {}) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options }).trim();
    return { ok: true, output };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function isCommandAvailable(command) {
  const checker = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
  return safeExec(checker).ok;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function listRepos() {
  const repoFile = path.join(process.cwd(), 'repos.json');
  if (fs.existsSync(repoFile)) {
    return JSON.parse(fs.readFileSync(repoFile, 'utf8'));
  }
  if (!isCommandAvailable('gh')) {
    throw new Error('gh CLI not available and repos.json not found.');
  }
  const result = safeExec('gh repo list repairman29 --json name,sshUrl,visibility,updatedAt --limit 200');
  if (!result.ok) throw new Error(result.error);
  return JSON.parse(result.output);
}

/** Convert sshUrl to clone URL; use HTTPS with token if GITHUB_TOKEN/GH_TOKEN set (avoids SSH). */
function getCloneUrl(repo) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const isPlaceholder = !token || token.startsWith('vault://') || token.startsWith('your_');
  if (!isPlaceholder && repo.sshUrl && repo.sshUrl.startsWith('git@github.com:')) {
    const pathPart = repo.sshUrl.replace(/^git@github.com:/, '').replace(/\.git$/, '');
    return `https://x-access-token:${token}@github.com/${pathPart}.git`;
  }
  return repo.sshUrl;
}

function cloneOrUpdateRepo(repo, cacheDir) {
  const repoPath = path.join(cacheDir, repo.name);
  if (!fs.existsSync(repoPath)) {
    log(`Cloning ${repo.name}...`, 'cyan');
    const cloneUrl = getCloneUrl(repo);
    const result = safeExec(`git clone --depth 1 "${cloneUrl}" "${repoPath}"`);
    if (!result.ok) throw new Error(result.error);
  } else {
    log(`Updating ${repo.name}...`, 'cyan');
    const result = safeExec(`git -C "${repoPath}" pull --ff-only`);
    if (!result.ok) {
      log(`Pull failed for ${repo.name}: ${result.error}`, 'yellow');
    }
  }
  return repoPath;
}

function isIgnoredPath(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.includes('node_modules/')) return true;
  if (normalized.startsWith('.git/')) return true;
  if (normalized.startsWith('dist/')) return true;
  if (normalized.startsWith('build/')) return true;
  if (normalized.startsWith('.next/')) return true;
  if (normalized.startsWith('coverage/')) return true;
  return false;
}

function isAllowedExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return [
    '.md',
    '.txt',
    '.js',
    '.ts',
    '.tsx',
    '.jsx',
    '.py',
    '.go',
    '.rs',
    '.java',
    '.cs',
    '.json',
    '.yml',
    '.yaml'
  ].includes(ext);
}

function walkFiles(dir, rootDir, maxBytes) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);
    if (isIgnoredPath(relativePath)) continue;
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, rootDir, maxBytes));
      continue;
    }
    if (!isAllowedExtension(fullPath)) continue;
    const stats = fs.statSync(fullPath);
    if (stats.size > maxBytes) continue;
    files.push({ fullPath, relativePath, size: stats.size });
  }
  return files;
}

function chunkText(text, maxChars, overlap) {
  const chunks = [];
  if (!text) return chunks;
  const safeMax = Math.max(200, maxChars);
  const safeOverlap = Math.max(0, Math.min(overlap, safeMax - 1));
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + safeMax);
    chunks.push(text.slice(start, end));
    const nextStart = end - safeOverlap;
    if (nextStart <= start) break;
    start = nextStart;
  }
  return chunks;
}

async function generateEmbedding(text, ollamaUrl, model) {
  const response = await fetch(`${ollamaUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama embeddings failed: ${response.status} ${body}`);
  }
  const data = await response.json();
  return data.embedding;
}

function buildSummary(repoPath, repoName) {
  const readmePath = fs.existsSync(path.join(repoPath, 'README.md'))
    ? path.join(repoPath, 'README.md')
    : null;
  const packagePath = fs.existsSync(path.join(repoPath, 'package.json'))
    ? path.join(repoPath, 'package.json')
    : null;

  const topDirs = fs
    .readdirSync(repoPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('.') && name !== 'node_modules')
    .slice(0, 12);

  let description = '';
  if (packagePath) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (pkg.description) description = pkg.description;
    } catch (error) {
      // Ignore malformed package.json
    }
  }

  let readmeSnippet = '';
  if (readmePath) {
    readmeSnippet = fs.readFileSync(readmePath, 'utf8').slice(0, 1200);
  }

  return [
    `Repo: ${repoName}`,
    description ? `Description: ${description}` : null,
    topDirs.length ? `Top directories: ${topDirs.join(', ')}` : null,
    readmeSnippet ? `README excerpt:\n${readmeSnippet}` : null
  ]
    .filter(Boolean)
    .join('\n');
}

async function supabaseRequest({ url, key }, pathSuffix, method, body, query) {
  const queryString = query ? `?${query}` : '';
  const preferUpsert = query && query.includes('on_conflict') ? 'resolution=merge-duplicates,' : '';
  const response = await fetch(`${url}/rest/v1/${pathSuffix}${queryString}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: `${preferUpsert}return=representation`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${method} ${pathSuffix} failed: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

async function upsertRepoSource(supabase, repo) {
  const rows = await supabaseRequest(
    supabase,
    'repo_sources',
    'POST',
    [
      {
        name: repo.name,
        ssh_url: repo.sshUrl,
        visibility: repo.visibility,
        updated_at: repo.updatedAt,
        last_indexed_at: new Date().toISOString()
      }
    ],
    'on_conflict=name'
  );
  return rows[0];
}

async function upsertRepoFile(supabase, repoId, file) {
  const rows = await supabaseRequest(
    supabase,
    'repo_files',
    'POST',
    [
      {
        repo_id: repoId,
        path: file.relativePath,
        sha: file.sha,
        size_bytes: file.size,
        language: file.language,
        last_indexed_at: new Date().toISOString()
      }
    ],
    'on_conflict=repo_id,path'
  );
  return rows[0];
}

async function deleteChunksForFile(supabase, fileId) {
  await supabaseRequest(supabase, `repo_chunks?file_id=eq.${fileId}`, 'DELETE');
}

async function insertChunks(supabase, chunks) {
  if (chunks.length === 0) return;
  await supabaseRequest(supabase, 'repo_chunks', 'POST', chunks);
}

async function upsertSummary(supabase, repoId, summary) {
  await supabaseRequest(
    supabase,
    'repo_summaries',
    'POST',
    [{ repo_id: repoId, summary, updated_at: new Date().toISOString() }],
    'on_conflict=repo_id'
  );
}

function inferLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  return ext || 'text';
}

async function indexRepo({
  repo,
  cacheDir,
  supabase,
  maxFileBytes,
  chunkChars,
  chunkOverlap,
  embeddingModel,
  dryRun
}) {
  const repoPath = cloneOrUpdateRepo(repo, cacheDir);
  const repoRow = await upsertRepoSource(supabase, repo);
  if (!repoRow) {
    throw new Error(`Failed to upsert repo source for ${repo.name}`);
  }

  const files = walkFiles(repoPath, repoPath, maxFileBytes);
  log(`Indexing ${repo.name}: ${files.length} files`, 'blue');

  const summary = buildSummary(repoPath, repo.name);
  if (!dryRun) {
    await upsertSummary(supabase, repoRow.id, summary);
  }

  for (const file of files) {
    try {
      const content = fs.readFileSync(file.fullPath, 'utf8');
      file.sha = sha256(content);
      file.language = inferLanguage(file.fullPath);

      if (dryRun) {
        log(`- ${file.relativePath} (${file.size} bytes)`, 'yellow');
        continue;
      }

      const fileRow = await upsertRepoFile(supabase, repoRow.id, file);
      if (!fileRow) {
        log(`Skipping ${file.relativePath}: file upsert failed`, 'yellow');
        continue;
      }

      await deleteChunksForFile(supabase, fileRow.id);

      const chunks = chunkText(content, chunkChars, chunkOverlap);
      const chunkRows = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkTextValue = chunks[i];
        const embedding = await generateEmbedding(chunkTextValue, DEFAULT_OLLAMA_URL, embeddingModel);
        chunkRows.push({
          repo_id: repoRow.id,
          file_id: fileRow.id,
          content: chunkTextValue,
          embedding,
          token_count: Math.ceil(chunkTextValue.length / 4),
          start_line: null,
          end_line: null
        });
      }
      await insertChunks(supabase, chunkRows);
    } catch (error) {
      log(`Failed to index ${file.relativePath}: ${error.message}`, 'yellow');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Jarvis Repo Indexer

Usage:
  node scripts/index-repos.js [options]

Options:
  --help, -h         Show this help message
  --repo <name>      Index a single repo
  --limit <number>   Limit repo count
  --dry-run          List files without indexing
  --cache <path>     Override cache directory
  --model <name>     Ollama embedding model (default: nomic-embed-text)
  --refresh          Force refresh (default behavior)

Clone: Uses SSH by default. If you get "Host key verification failed", either:
  1) Set GITHUB_TOKEN or GH_TOKEN in ~/.clawdbot/.env (repo read scope) to clone via HTTPS, or
  2) Fix SSH: run "ssh -T git@github.com" once to add GitHub to known_hosts and ensure your key is loaded.
`);
    return;
  }

  if (!isCommandAvailable('git')) {
    throw new Error('git CLI is required.');
  }

  const env = loadEnvFile();
  const supabaseUrl = await resolveEnv('SUPABASE_URL', env);
  const supabaseKey =
    (await resolveEnv('SUPABASE_SERVICE_ROLE_KEY', env)) ||
    (await resolveEnv('SUPABASE_ANON_KEY', env));

  const hasUrl = Boolean(supabaseUrl);
  const hasKey = Boolean(supabaseKey);
  if (!hasUrl || !hasKey) {
    const keys = Object.keys(env || {});
    const preview = keys.slice(0, 8).join(', ');
    log(`Supabase env missing: URL=${hasUrl ? 'yes' : 'no'}, KEY=${hasKey ? 'yes' : 'no'} (keys=${keys.length}${preview ? `: ${preview}` : ''})`, 'yellow');
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set. Use ~/.clawdbot/.env or Vault (app_secrets).');
  }

  const ghToken = await resolveEnv('GITHUB_TOKEN', env) || (await resolveEnv('GH_TOKEN', env));
  if (ghToken && !ghToken.startsWith('vault://')) {
    process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || ghToken;
    process.env.GH_TOKEN = process.env.GH_TOKEN || ghToken;
  }

  const embeddingModel = args.includes('--model')
    ? args[args.indexOf('--model') + 1]
    : 'nomic-embed-text';

  const repoFilter = args.includes('--repo') ? args[args.indexOf('--repo') + 1] : null;
  const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : null;
  const dryRun = args.includes('--dry-run');
  const cacheDir = args.includes('--cache') ? args[args.indexOf('--cache') + 1] : DEFAULT_CACHE_DIR;

  ensureDir(cacheDir);

  const allRepos = listRepos();
  const repos = allRepos.filter((repo) => !repoFilter || repo.name === repoFilter).slice(0, limit || allRepos.length);
  if (repos.length === 0) {
    throw new Error('No repos matched filter.');
  }

  if (!isCommandAvailable('gh')) {
    log('gh CLI not available; using repos.json only', 'yellow');
  }

  if (repos.length > 5 && !dryRun) {
    log(`Indexing ${repos.length} repos. This may take a while.`, 'purple');
  }

  if (!dryRun) {
    log(`Using Ollama at ${DEFAULT_OLLAMA_URL} with model ${embeddingModel}`, 'cyan');
  }

  const supabase = { url: supabaseUrl, key: supabaseKey };

  for (const repo of repos) {
    await indexRepo({
      repo,
      cacheDir,
      supabase,
      maxFileBytes: DEFAULT_MAX_FILE_BYTES,
      chunkChars: DEFAULT_CHUNK_CHARS,
      chunkOverlap: DEFAULT_CHUNK_OVERLAP,
      embeddingModel,
      dryRun
    });
  }

  log('Repo indexing complete.', 'green');
}

if (require.main === module) {
  main().catch((error) => {
    log(`Repo index failed: ${error.message}`, 'red');
    process.exit(1);
  });
}
