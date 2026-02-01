# Who Benefits, Suggestions, Automations & Rollbacks

## Who would benefit from this reporting?

### Personas

| Who | Why they care | How they find value |
|-----|----------------|---------------------|
| **Maintainers of one repo** | “Everything depends on something old” — security, compliance, Python 2/old Node EOL. | One `report` run: see direct + transitive “something old” chains; decide what to upgrade or replace. |
| **Platform / DevOps** | Standardize “dependency hygiene” across many repos. | `analyze` in CI; fail or warn when ancient/deprecated count exceeds threshold; track over time. |
| **Security / compliance** | Evidence of legacy deps, SBOM-style lineage. | JSON + CSV for pipelines; “something old” table for auditors; PDF report for stakeholders. |
| **Developers doing upgrades** | Need a list of what’s risky and what to do next. | Suggestions (replace X with Y); report as input to JARVIS or upshiftai for “fix this” flows. |

### How we “know” who would benefit

- **Signal: ecosystem + age**  
  Any project with npm/pip/go that has **ancient** or **deprecated** counts &gt; 0 in the report is a candidate. The report itself is the proof.

- **Signal: transitive “something old”**  
  Pip projects that run `report` with full tree and get **non‑empty “something old” chains** are exactly the ones that benefit from the “deep throat” view (e.g. “citrascope → python-dateutil → six”).

- **Outreach**  
  - Docs and landing (upshiftai.dev): “Run one command; get a full dependency report and replacement suggestions.”  
  - JARVIS skill: “Run dependency report and summarize; suggest next steps.”  
  - CI template: “Add `upshiftai-deps analyze` and gate on ancient count.”

So “who benefits” is **anyone with ancient/deprecated/transitive-old deps**; the tool both **identifies** them (report) and **guides** them (suggestions + future automations).

---

## Suggestions (current + extended)

### Current

- **npm**: Built‑in replacement map in `suggestions.js` (e.g. `request`→axios, `moment`→date-fns). Exposed in CSV as `replacement` / `note` and in report entries as `suggestion`.
- **Action shape**: Today it’s advisory only (no `action` type).

### Extended design

- **pip replacements**  
  Same pattern: map package name → `{ replacement, note, action? }`.  
  Examples: `six`→stdlib (Python 3), `python-dateutil`→`zoneinfo` (3.9+), `ntplib`→alternatives or “pin and document”.

- **Action types** (for future automations)  
  - `replace` — swap package A for B (manifest + lockfile).  
  - `upgrade` — bump to latest (or next major) within semver; may need lockfile regen.  
  - `pin` — pin to a specific “safe” version and document why.  

  Suggestions can carry `action: 'replace' | 'upgrade' | 'pin'` and optional `targetVersion` or `targetPackage`.

- **Data source**  
  Keep a single map (npm + pip) keyed by ecosystem or by name; pip names are distinct from npm. Optionally later: load from JSON/YAML so teams can add custom suggestions.

---

## Automations (what we can do)

### Safe principle: checkpoint before change, rollback on failure or request

- Before any automation that edits manifests or lockfiles, create a **checkpoint** (copy of relevant files).
- After a change, optionally run a **verify** step (e.g. `npm ls` / `pip check`); if it fails, **rollback** automatically.
- User can always run **rollback** manually to restore the last checkpoint.

### Concrete automations (candidates)

| Action | npm | pip | Rollback |
|--------|-----|-----|----------|
| **Upgrade one package** | `npm install pkg@latest` (or target version) | Edit pyproject/requirements + `pip install pkg==x.y` | Restore manifest + lockfile from checkpoint |
| **Replace package** | Remove old, add new in package.json; `npm install` | Remove old, add new in pyproject/requirements; `pip install` | Same |
| **Pin to safe version** | Set exact version in package.json; `npm install` | Set exact version in pyproject/requirements | Same |
| **Apply all “upgrade” suggestions** | For each ancient/deprecated, try latest; checkpoint once, then apply in sequence; rollback on first failure | Same idea | One checkpoint for whole run |

### Scope for v1

- **Checkpoint**: Save `package.json` + `package-lock.json` (npm) or `pyproject.toml` + `requirements*.txt` (pip) into `.upshiftai-tmp/checkpoints/<timestamp>/`.
- **Rollback**: Restore from latest checkpoint; optional `--dry-run`.
- **Apply**: Single action only, e.g. `apply upgrade <pkg>` or `apply replace <pkg> <newPkg>`, with checkpoint before and rollback on verify failure.

---

## HITL (Human-in-the-Loop), Listeners & Webhooks

### Principle

- **Hand-holding** (replace package, major upgrade, first-time apply) → **require approval** before executing.
- **Everything else** (patch/minor upgrade, pin) → **execute automatically** with listeners and rollback; customers get webhooks so they can observe or trigger their own revert.

### HITL layer

- **Approval policy** (config or CLI):
  - `requireApprovalFor`: `['replace', 'major']` — replace always needs approval; upgrade that crosses major needs approval.
  - `approval.mode`: `prompt` | `webhook` | `none`.
    - **prompt**: CLI asks "Apply? (y/n)" (default for interactive).
    - **webhook**: POST to `approval.webhookUrl` with `{ event: 'approval.required', action, pkg, targetVersion?, dryRun }`; wait for 200 + body `{ approved: true }` or `{ approved: false }`; timeout after `approval.timeoutMs` (default 60s) → treat as denied.
    - **none**: no approval (use at your own risk; CI or scripted).
- When an action needs approval we emit `approval.required`; after approval we proceed or exit.

### Listeners & webhooks

- **Config**: `.upshiftai.json` in project root (or `--config path` or env `UPSHIFTAI_CONFIG`). JSON only (no YAML dependency):
  - `webhooks`: `["https://customer.com/hooks/upshiftai"]` — we POST every event to these URLs (fire-and-forget except approval).
  - `approval`: `{ mode, requireFor, webhookUrl?, timeoutMs? }`.
- **Events** we emit (and POST as JSON body):
  - `checkpoint.created` — after saving checkpoint (path, files).
  - `apply.started` — action type, pkg, target.
  - `apply.completed` — action, pkg, before, after.
  - `apply.failed` — action, pkg, error.
  - `approval.required` — action, pkg, target; recipient can respond (webhook mode) with approved/denied.
  - `rollback.triggered` — reason, checkpoint path; **customer can use this to run their own revert** (e.g. revert Git commit, redeploy).
  - `rollback.completed` — restored files.
- **Rollback mechanisms**:
  - **Automatic**: after apply, we run verify (e.g. `npm ls` / `pip check`); on failure we restore from checkpoint and emit `rollback.triggered` + `rollback.completed`.
  - **Manual**: `upshiftai-deps rollback` restores latest checkpoint.
  - **Customer revert**: customer’s webhook receives `rollback.triggered` (or `apply.failed`) and can call our CLI rollback or their own revert logic (e.g. `git revert`, redeploy previous image).

### Summary

| Need | Mechanism |
|------|-----------|
| Approve risky actions | HITL: prompt or approval webhook; requireApprovalFor replace/major. |
| Observe everything | Webhooks get all events (checkpoint, apply started/completed/failed, rollback). |
| Auto rollback | Verify fails → we restore checkpoint and emit rollback events. |
| Customer revert | Customer webhook on `rollback.triggered` / `apply.failed` → they run `upshiftai-deps rollback` or their own revert. |

---

## Rollbacks

### Checkpoint layout

- Directory: `<project>/.upshiftai-tmp/checkpoints/`.
- Each checkpoint: subfolder `<ISO-timestamp>` (or `latest` symlink/copy).
- Files copied:  
  - **npm**: `package.json`, `package-lock.json`.  
  - **pip**: `pyproject.toml`, `requirements.txt`, `requirements/*.txt` if present.  
- Metadata: small `meta.json` with `{ timestamp, ecosystem, reason }` so we know what was captured.

### Rollback behavior

- **Restore** from the latest checkpoint (by timestamp or `latest`) into project root.
- **Optional** `--dry-run`: list what would be restored, don’t write.
- After restore, user can re-run install (e.g. `npm install` / `pip install -e .`) if we only restore manifests.

### Integration with automations

- Every automation that mutates manifest/lockfile must call checkpoint first.
- If verify fails after change, automatically rollback (or prompt “Rollback? Y/n”).
- Explicit `upshiftai-deps rollback` for manual “undo last automation.”

---

## Summary

| Question | Answer |
|----------|--------|
| **Who benefits?** | Maintainers, platform/DevOps, security/compliance, developers doing upgrades; anyone with ancient/deprecated or transitive-old deps. |
| **How do we know?** | Report contents (ancient/deprecated counts, non‑empty “something old” chains); CI gates; JARVIS/upshiftai integration. |
| **Suggestions** | Extend to pip; add action types (replace / upgrade / pin) and optional target version/package for automations. |
| **Automations** | Upgrade one, replace one, pin one; always checkpoint first; verify after; rollback on failure or on demand. |
| **Rollbacks** | Checkpoint = copy manifest + lockfile to `.upshiftai-tmp/checkpoints/<ts>/`; rollback = restore from latest. |
