# Configuration Reference

Upshift reads configuration from `.upshiftrc.json`, `.upshiftrc`, or `upshift.config.json` in the project directory. Create a file with `upshift init`.

## File location

- **Lookup order:** `.upshiftrc.json` → `.upshiftrc` → `upshift.config.json`
- **Scope:** Project directory (where you run `upshift`). No global config file; use env vars or repeat config per project.

## Schema overview

```json
{
  "ignore": [],
  "defaultMode": "minor",
  "autoTest": true,
  "autoConfirm": false,
  "ai": { "autoEnable": false, "maxCredits": 50 },
  "scan": { "exclude": [], "minSeverity": "low" },
  "approval": { "mode": "prompt", "requireFor": ["major"], "webhookUrl": null },
  "upgradePolicy": null,
  "registry": { "url": null, "token": null }
}
```

## Top-level options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **ignore** | `string[]` | `[]` | Package names (or globs like `@types/*`) to skip when upgrading. |
| **defaultMode** | `"all"` \| `"minor"` \| `"patch"` | `"minor"` | Default mode for batch upgrade (`upshift upgrade --all`). |
| **autoTest** | `boolean` | `true` | Run tests after upgrade; roll back if tests fail. |
| **autoConfirm** | `boolean` | `false` | Skip confirmation prompts (e.g. major upgrade, batch confirm). Use with care. |
| **testCommand** | `string` \| `string[]` | *(auto)* | For Python/non-Node: command to run after upgrade (e.g. `"pytest"` or `["poetry", "run", "pytest"]`). If tests fail, upgrade is rolled back. |

## ai

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **autoEnable** | `boolean` | `false` | Automatically use AI for `explain` when available. |
| **maxCredits** | `number` | `50` | Max credits to use per session (cap). |

## scan

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **exclude** | `string[]` | `[]` | Package names to exclude from scan results. |
| **minSeverity** | `"low"` \| `"moderate"` \| `"high"` \| `"critical"` | `"low"` | Minimum severity to include in scan output. |

## approval (HITL)

Controls when Upshift asks for approval before applying an upgrade.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **mode** | `"prompt"` \| `"none"` \| `"webhook"` | `"prompt"` | **prompt** — Ask in terminal for major (or all) upgrades. **none** — Never prompt. **webhook** — POST proposed upgrade to `webhookUrl`; 200 = approve, non-200 = reject. |
| **requireFor** | `("major" \| "all")[]` | `["major"]` | When to require approval: **major** = only major version bumps; **all** = every upgrade. |
| **webhookUrl** | `string` \| `null` | `null` | URL for webhook approval. POST body: `{ event: "upgrade_proposed", packageName, currentVersion, targetVersion, cwd, timestamp }`. Respond 200 to approve. |

Example (webhook):

```json
"approval": {
  "mode": "webhook",
  "requireFor": ["major"],
  "webhookUrl": "https://your-service.com/upshift/approve"
}
```

## upgradePolicy

Block upgrades above a risk level. Risk is computed from major delta, vulnerabilities, and popularity.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **blockRisk** | `("high" \| "medium")[]` | — | Block upgrades with this risk level. E.g. `["high"]` blocks high-risk only; `["high", "medium"]` blocks both. Use `-y` on the CLI to override. |

Example:

```json
"upgradePolicy": {
  "blockRisk": ["high"]
}
```

## registry

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| **url** | `string` \| `null` | `null` | Custom npm registry URL. |
| **token** | `string` \| `null` | `null` | Auth token (or env var reference like `$NPM_TOKEN`). |

## Example: strict policy + webhook

```json
{
  "ignore": ["@types/*"],
  "defaultMode": "minor",
  "autoTest": true,
  "autoConfirm": false,
  "approval": {
    "mode": "webhook",
    "requireFor": ["major"],
    "webhookUrl": "https://api.example.com/upshift/approve"
  },
  "upgradePolicy": {
    "blockRisk": ["high"]
  }
}
```

## Override with CLI

- **-y / --yes** — Skips approval prompts and policy block (use with care).
- **--skip-tests** — Skips running tests after upgrade (overrides `autoTest` for that run).
- **--dry-run** — No file changes; policy and approval still apply unless `-y`.

## Environment variables (Team / audit)

For Team/Enterprise and audit logging, the CLI supports:

| Variable | Description |
|----------|-------------|
| **UPSHIFT_AUDIT_URL** | When set, the CLI POSTs audit events (upgrade, fix, scan_upload) to this URL after each action. Fire-and-forget; no impact on CLI flow if the request fails. |
| **UPSHIFT_ORG** | When set, included as `org_id` in audit payloads (and future credit/billing calls) so the platform can attribute usage to the org. |
| **UPSHIFT_API_TOKEN** | Optional. Sent as `Authorization: Bearer <token>` when POSTing to `UPSHIFT_AUDIT_URL`. |

See [Team features (design)](team-features.md) for platform schema and API shape.

## See also

- [User guide](user-guide.md) — Workflow and features
- [When it breaks & guardrails](when-it-breaks-and-guardrails.md) — HITL and safety
