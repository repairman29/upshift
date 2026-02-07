# Rollback and tests — where they run, what triggers them

This doc clarifies how rollback is wired and what kinds of tests trigger it, so you can see whether "we're well enough connected" for rollback and what should "fallback."

---

## Where rollback runs

| Context | Runs upgrade? | Runs tests? | Rollback on test failure? |
|--------|----------------|-------------|----------------------------|
| **Local:** `upshift upgrade <pkg>` | Yes | Yes (if `scripts.test` exists) | **Yes** — restore package.json + lockfile from `.upshift/backups`, then reinstall |
| **Local:** `upshift upgrade --all` (batch) | Yes | Yes per upgrade (if test script) | **Per-package:** single-package upgrade flow does rollback; batch suggests `upshift rollback` manually |
| **CI:** workflow that runs `upshift upgrade` | Yes (if you add that step) | Yes (same as local) | **Yes** (same code path) |
| **GitHub App workflow** (Upshift Scan) | **No** | **No** | **N/A** — scan-only, no upgrade, no rollback |

So: **rollback is only in the upgrade flow.** The GitHub App workflow we added only runs **scan** (outdated + vulnerabilities). It does not run `upshift upgrade`, so it never creates backups or rolls back. Nothing in the App is "supposed to rollback" — that promise applies when someone runs **upgrade** (locally or in a CI job that you add).

---

## What tests trigger rollback

When you run **`upshift upgrade <pkg>`** (single package):

1. We create a backup under `.upshift/backups/<timestamp>/` (package.json + lockfile).
2. We apply the upgrade (e.g. `npm install <pkg>@latest`).
3. We look for **`scripts.test`** in `package.json` (e.g. `"test": "npm run test:unit"` or `"test": "jest"`).
4. If present, we run that command (e.g. `npm test`). If it **exits non-zero**, we **roll back**: restore the backup and reinstall deps, then throw.
5. If there is **no** `test` script, we do **not** run tests and **do not** roll back on breakage — we print a tip to add a test script.

So the "tests that should fallback" (trigger rollback) are **the project's own test script** — whatever you define as `scripts.test`. We don't run Upshift's e2e or any other test suite for rollback; we only run the one script the repo defines.

---

## Are we "well enough connected"?

- **Upgrade flow:** Yes. Single-package upgrade is wired: backup → upgrade → run `npm test` (if exists) → rollback on failure. Batch upgrade runs the same per-package flow where applicable.
- **GitHub App:** The App is **not** connected to rollback. It only scans. To get "upgrade + test + rollback" in CI, you'd add a **separate** job or workflow that runs `upshift upgrade <pkg>` (or `--all`) and has access to the repo's test script. The App workflow file we ship is intentionally scan-only so installs are low-friction; teams can add their own upgrade job if they want.

---

## Repos we "fixed" (workflow added) — do they have rollback protection?

Many of the repos we added the **scan** workflow to don't have a top-level **`scripts.test`**:

- **olive:** No `"test"` script (has `test:e2e`, `test:e2e:prod`, etc.). So if someone runs `upshift upgrade <pkg>` in olive, we would **not** run tests and **not** roll back.
- **mythseeker2:** No `"test"` script (has `test:all` = type-check + lint + performance). Same — no automatic rollback on upgrade.
- **upshift:** Has `"test": "npm run e2e:all"`. So **upshift itself** is protected: upgrade → runs e2e:all → on failure we roll back.

**Recommendation:** If you want rollback when upgrading in a repo, add a **`"test"** script in package.json (even if it just runs `npm run test:unit` or `npm run type-check`). Then `upshift upgrade` will run it and roll back on failure.

---

## E2E tests (Upshift product)

- **CLI e2e** (`npm run e2e`): Covers version, scan, suggest, plan, migrate, radar, status, upgrade --dry-run. **Does not** run a real upgrade + test failure + rollback (mutating; would need an isolated fixture).
- **Browser e2e** (`npm run e2e:browser`): Homepage, Radar, docs, mobile nav, 404. One test was failing on mobile (Sign in link not found until hamburger opened); fixed by opening nav toggle before asserting.
- **Rollback** is not covered by e2e today; it would require a fixture with a test script that fails after an upgrade, then assert backup restored.
