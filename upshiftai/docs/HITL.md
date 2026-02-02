# Human-in-the-Loop (HITL) — Approval and Oversight

**Why HITL for LLM-generated fixes?** Self-healing by applying AI-generated code changes without review is risky. Upshift can suggest and apply code fixes (`upshift fix`); we recommend reviewing them (e.g. `--dry-run`, PR, or approval webhooks) before merging. Approval gates below apply to dependency upgrades and, in automation, can be combined with a policy that LLM fixes are never applied without human or automated approval.

UpshiftAI supports **approval gates** so devs and teams can intervene before risky changes (major upgrades, package replaces) are applied. You choose: CLI prompt, webhook (your server decides), or none (full auto).

## Config: `.upshiftai.json`

```json
{
  "approval": {
    "mode": "prompt",
    "requireFor": ["replace", "major"],
    "webhookUrl": "https://your-server.com/approve",
    "timeoutMs": 60000
  },
  "webhooks": ["https://your-server.com/hooks/upshiftai"]
}
```

| Field | Values | Meaning |
|-------|--------|---------|
| `approval.mode` | `"prompt"` \| `"webhook"` \| `"none"` | How to get approval: CLI y/n, HTTP POST to you, or skip. |
| `approval.requireFor` | `["replace", "major", "pin"]` | Which actions need approval. Default `["replace", "major"]`: replace and major upgrades require approval; patch/minor do not. |
| `approval.webhookUrl` | URL | Required when `mode === "webhook"`. We POST here and wait for `{ "approved": true }` or `false`. |
| `approval.timeoutMs` | number | Max wait for webhook response (default 60000). Timeout → treated as denied. |
| `webhooks` | URL[] | Event listeners. We POST every event (fire-and-forget). Use for observability, logging, or triggering your own rollback. |

## Approval webhook: request and response

When an action needs approval and `approval.mode === "webhook"`, we **POST** to `approval.webhookUrl` with:

**Request body (JSON):**
```json
{
  "event": "approval.required",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "action": "upgrade",
  "pkg": "react",
  "targetVersion": "19.0.0",
  "targetPackage": null,
  "isMajor": true,
  "projectRoot": "/path/to/project"
}
```

For `action === "replace"`, you’ll also get `targetPackage` (the new package name).

**Expected response:** HTTP 200 with JSON body:
```json
{ "approved": true }
```
or
```json
{ "approved": false }
```

Any other status or body (or timeout) is treated as **not approved**; we do not apply the change.

## Event webhooks (observability)

When `webhooks` is set, we POST each event to every URL (fire-and-forget). No response required.

**Envelope (every event):**
```json
{
  "event": "apply.started",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "action": "upgrade",
  "pkg": "react",
  "targetVersion": "19.0.0"
}
```

| Event | When |
|-------|------|
| `checkpoint.created` | Before apply; includes `path`, `files`. |
| `apply.started` | We’re about to change manifest/lockfile. |
| `apply.completed` | Apply and verify succeeded. |
| `apply.failed` | Apply or verify failed; we will roll back if checkpoint exists. |
| `rollback.triggered` | Rolling back to last checkpoint. |
| `rollback.completed` | Rollback finished. |

Your endpoint can log, notify, or run `upshiftai-deps rollback` when it receives `apply.failed` or `rollback.triggered`.

## Sample approval server (Node)

Minimal HTTP server that approves all requests (replace with your own logic):

```js
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/approve') {
    res.writeHead(404);
    res.end();
    return;
  }
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    const payload = JSON.parse(body);
    // Your logic: e.g. check payload.action, payload.isMajor, ask a human, etc.
    const approved = payload.action === 'upgrade' && !payload.isMajor;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ approved }));
  });
});
server.listen(3333, () => console.log('Approval server on http://localhost:3333/approve'));
```

Set in `.upshiftai.json`: `"approval": { "mode": "webhook", "webhookUrl": "http://localhost:3333/approve" }`.

## CLI override

- **`--yes`** — Skip approval for this run (apply without prompting or calling webhook).
- Omit **`--yes`** — Respect config: prompt or webhook when the action is in `approval.requireFor`.

So: **default config + no `--yes`** = you get prompts for major/replace. **`--yes`** = full auto for that run.
