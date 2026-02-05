# What to anticipate and test before/after upgrades

Upgrades can introduce breaking API changes, type errors, or runtime failures. This doc helps you **anticipate** risk, **test** effectively, and **recover** with fewer rollbacks.

## Before you upgrade

### 1. Check risk and breaking changes

- **Risk level:** `upshift explain <package> --risk` — shows low/medium/high and reasons (e.g. major bump, known vulns).
- **AI breakdown:** `upshift explain <package> --ai` (1 credit) — summarizes breaking changes and what to watch for.
- **Changelog:** `upshift explain <package> --changelog` — raw changelog from the registry/GitHub.

Use this to decide whether to upgrade now or in a dedicated PR.

### 2. Use suggest and plan

- **Suggest:** `upshift suggest` — recommends low-risk, high-value upgrades. Prefer these when you want fewer surprises.
- **Plan:** `upshift plan` — ordered list (dependency order + risk). Upgrade in that order so dependency breaks surface first.

### 3. Block risky upgrades (optional)

In `.upshiftrc.json`:

```json
{
  "upgradePolicy": { "blockRisk": ["high"] }
}
```

High-risk upgrades are then blocked unless you pass `-y`. Use this to avoid accidental major upgrades without review.

### 4. Ensure you have a test script

**Upshift runs your tests after every upgrade and rolls back if they fail.** If there is no test script, we cannot roll back automatically.

- **Node:** `package.json` must have a `scripts.test` (e.g. `"test": "npm run test:unit && npm run test:e2e"`).
- **Python:** `testCommand` in `.upshiftrc.json` or we use `pytest` / `poetry run pytest` when detectable.

**Recommendation:** Include at least:

- Unit tests (and/or integration tests that touch the upgraded dependency).
- Optionally: typecheck (`tsc --noEmit`), lint, or a quick smoke script. Add them to the same script we run (e.g. `npm test` runs unit + typecheck).

The stronger your test suite, the more reliably we can roll back when an upgrade breaks something.

## What to test (checklist)

When you add or extend your test script, consider:

| Area | Examples |
|------|----------|
| **Unit / integration** | Tests that import or use the upgraded package. |
| **Types** | `tsc --noEmit` (TypeScript). Catches type API breaks. |
| **Build** | `npm run build` or `vite build` so bundler/runtime issues show up. |
| **Lint** | `eslint` / `biome` if you rely on rule behavior. |
| **Smoke** | One critical path (e.g. start server, one request). |

You don’t need all of these, but the more you cover, the fewer “it worked then broke later” cases you’ll see.

## After an upgrade

### If tests pass

You’re done. Consider committing the lockfile and running CI so the rest of the team gets the same guardrail.

### If tests fail (we roll back)

1. **Rollback is automatic** — We restore `package.json` and the lockfile and reinstall. Your repo is back to the pre-upgrade state.
2. **Next steps:**
   - **Understand:** `upshift explain <package> --ai` to see what broke and why.
   - **Fix code:** `upshift fix <package> --dry-run` to preview AI-suggested code changes, then `upshift fix <package>` to apply (or edit manually).
   - **Retry:** After applying fixes, run `upshift upgrade <package>` again; tests will run again and we’ll roll back again if they still fail.

### If you don’t have a test script

We **do not** roll back when there’s no test script (we can’t know if the upgrade broke anything). You may see breaks later. To avoid that:

- Add a `test` script (or Python `testCommand`) and re-run the upgrade so future runs get rollback protection.
- Use `upshift rollback` manually if you notice breakage and want to restore the previous backup.

## Summary

| Goal | Action |
|------|--------|
| Anticipate risk | `upshift explain <pkg> --risk` or `--ai`; use `upshift suggest` / `upshift plan`. |
| Reduce surprises | Add `upgradePolicy.blockRisk: ["high"]`; prefer `--all-minor` for batch. |
| Enable rollback | Add a `test` script (and optionally typecheck/build) so we run it after every upgrade. |
| Recover from failure | We roll back automatically; then use `upshift fix <pkg>` or `explain --ai` and re-upgrade after fixing. |

See also: [When it breaks & guardrails](when-it-breaks-and-guardrails.md), [User guide](user-guide.md), [Configuration](configuration.md).
