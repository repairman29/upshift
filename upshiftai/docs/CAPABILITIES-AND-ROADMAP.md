# UpshiftAI: Current Capabilities & Doing More

## Current capabilities

### Insights (what we detect today)

| Signal | Source | Used in |
|--------|--------|--------|
| **Age** | Registry `lastPublish` / PyPI `upload_time` | ancient (24+ months), `monthsSincePublish` |
| **Deprecated** | npm `deprecated` field / PyPI classifiers | summary, report table |
| **Fork hint** | Package name (`-fork`, `-legacy`, etc.) | report table |
| **Old Python** | PyPI `requires_python` (2.7, 3.0–3.5) | pip report, "something old" chains |
| **Depth** | Tree from lockfile / pipdeptree | report sort, "pulled in by" |
| **Why / chain** | `node.why` (npm) / pipdeptree `requestedBy` | "Pulled in by" in report |
| **Replacements** | Built-in map (`suggestions.js`) | CSV, report "What to do", apply replace |

**Report outputs:** JSON (analyze), Markdown (analyze --markdown, report), CSV (analyze --csv), PDF (report --pdf). Full report adds: risk badge, one-pager, "something old" chains (pip), full pipdeptree block.

**Now also:** license (--licenses), npm audit (summary + Security section), "latest available" vs installed in report table, blast radius (direct/transitive) in one-pager, .upshiftai-suggestions.json.

---

### CLI surface

| Command | What it does |
|---------|----------------|
| `analyze [path]` | Resolve tree, fetch registry, build report. Output: JSON (default), or `--markdown` / `--csv`. `--no-registry` skips registry (faster). `--ecosystem=npm\|pip\|go`. |
| `report [path]` | Full report: one-pager + chains (pip) + direct deps. `--output FILE`, `--pdf`, `--upload`. Pip: `--full-tree` (default), `--no-full-tree`, `--pip-tree FILE.json`. `--project-name`, `--project-url`. |
| `checkpoint [path]` | Copy manifest + lockfile to `.upshiftai-tmp/checkpoints/<ts>/`. `--reason "..."`. |
| `rollback [path]` | Restore latest checkpoint. `--dry-run` to preview. |
| `apply upgrade <pkg> [path]` | Checkpoint → bump pkg to `--version` (default latest) → npm install → verify (npm ls) → rollback on failure. `--dry-run`, `--yes` (skip approval). |
| `apply replace <old> <new> [path]` | Checkpoint → remove old, add new → npm install → verify → rollback on failure. `--dry-run`, `--yes`. |

**Config:** `.upshiftai.json` (or `--config`, env): `webhooks[]`, `approval.mode` (prompt | webhook | none), `approval.requireFor` (e.g. `["replace","major"]`), `platformUrl`, `apiKey`. Events: checkpoint.created, apply.started/completed/failed, rollback.triggered/completed, approval.required.

**Apply:** npm and pip (upgrade/replace); apply fix (batch, npm and pip); fix \<pkg\> (one-shot, npm and pip).

---

## Doing more with insights

1. **“Outdated” vs “ancient”**  
   Show “latest available” next to “installed” for direct deps (we already fetch registry). Add to report: “You’re on X, latest is Y” and optionally a single “upgrade all direct to latest” hint. Enables `apply upgrade` to suggest a version.

2. **Security**  
   - **npm:** Run `npm audit --json` (or call audit API) and merge advisories into report: e.g. “High: 2, Moderate: 1” in summary; list affected packages in one-pager or table.  
   - **pip:** Optional OSV/ pip-audit style input: accept a list of known-vulnerable (name, version) and flag them in the report.  
   Keeps “one report” for both age and security.

3. **License**  
   npm/PyPI both expose license. Add optional `--licenses` to report: table or summary (e.g. “GPL-2.0: 3 packages”). No approval logic, just visibility for compliance.

4. **Suggestions from data**  
   - For packages with no built-in suggestion: if “latest” is much newer than installed, suggest “upgrade” with target version.  
   - Optional config file (e.g. `.upshiftai-suggestions.json`) so teams can add replace/upgrade/pin suggestions without changing code.

5. **Stale “why” / depth**  
   We already have depth and “why”. Add a “impact” or “blast radius” hint: “1 direct dep, 12 transitive” so prioritization is obvious.

6. **Go**  
   Go proxy (or GOPROXY) can give `lastPublish`; add fetch for go and plug into same age/deprecated report.

---

## Doing more with the CLI

1. **`apply fix` or `apply suggestions`**  
   One command: for each problematic direct dep that has a built-in (or config) suggestion, run replace/upgrade in sequence (one checkpoint for the whole run). Optional `--dry-run`, `--limit N`, `--yes`. Makes “do this first” actionable in one shot.

2. **Pip apply**  
   `apply upgrade <pkg>` / `apply replace <old> <new>` for pip: edit pyproject.toml or requirements.txt, run `pip install`, verify with `pip check`, rollback on failure. Same HITL and webhooks as npm.

3. **`report --diff`**  
   If a previous report is stored (e.g. `.upshiftai-tmp/last-report.json` or a path): compare and add a “What changed” section (new ancient, fixed, new dep, etc.). Great for CI and “are we getting better?”.

4. **`analyze --exit-code`**  
   Exit 1 if ancient count (or deprecated, or high/critical advisories) exceeds a threshold. Enables CI gates: `upshiftai-deps analyze . --exit-code --max-ancient=0`.

5. **`checkpoint --list`**  
   List checkpoints with timestamp and reason so users can restore a specific one (e.g. `rollback --checkpoint <ts>`).

6. **JSON report output for `report`**  
   `report --output report.md --json report.json` (or a separate `report --format json`) so pipelines and the platform can consume the same structured data (summary, chains, entries) without parsing markdown.

7. **One-shot “fix one thing”**  
   `upshiftai-deps fix <pkg>`: analyze → if suggestion exists, run apply replace/upgrade (with approval unless `--yes`). Wraps “suggest + apply” for the single highest-impact package.

8. **CI summary**  
   `analyze --summary` or `report --summary`: only print one-pager-style text (risk + headline + “Do this first”) to stdout so CI logs are readable without full JSON/markdown.

---

## Suggested order

- **Quick wins:** (4) `--exit-code`, (8) `--summary`, (7) `fix <pkg>`.  
- **High impact:** (1) latest vs installed, (2) security (npm audit first), (3) `apply fix` / apply suggestions.  
- **Then:** pip apply, (5) checkpoint list/restore, (6) report JSON, (9) licenses, (10) suggestions config file.

This doc can live next to `DESIGN-SUGGESTIONS-AUTOMATIONS.md` and the README; update the README roadmap with checkboxes as you implement.
