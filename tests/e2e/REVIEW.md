# E2E and review summary (v0.4.0)

## E2E tests

- **Location:** `tests/e2e/cli.e2e.mjs`
- **Fixture:** `tests/fixtures/minimal/` — minimal `package.json` with one dependency (chalk). E2E installs deps if `node_modules` is missing.
- **Run:** `npm run e2e` (builds then runs CLI e2e).

### Commands covered

| Command | What we assert |
|--------|----------------|
| `upshift --version` | Exit 0, semver in stdout |
| `upshift scan` | Exit 0, output mentions scan/deps |
| `upshift scan --report <path>` | Exit 0, file exists, valid JSON with `status: "ok"` and `outdated` array |
| `upshift scan --json` | Exit 0, valid JSON (status or outdated) |
| `upshift suggest --limit 3` | Exit 0 |
| `upshift plan --mode patch` | Exit 0 |
| `upshift migrate react --list` | Exit 0, output lists react templates (run from repo root so `migrations/` is found) |
| `upshift radar --no-open` | Exit 0, stdout contains radar URL |

All checks **passed** on last run.

### Not covered (future)

- `upshift explain <pkg>` (needs API key or mock)
- `upshift upgrade` (mutating, needs isolated env)
- `upshift migrate <pkg> --dry-run` (apply template in fixture)
- Python/Ruby/Go scan from fixture (optional fixtures with pyproject.toml / Gemfile / go.mod)
- Browser e2e for `web/` and Radar (manual: open `web/index.html` and `web/radar/index.html` via local server)

---

## Review findings

### CLI

- **Behavior:** Commands register and run; scan/suggest/plan use fixture; migrate --list uses repo `migrations/` (fallback from `process.cwd()` when `cwd/migrations` missing).
- **Docs:** `docs/cli-reference.md` and `docs/user-guide.md` align with current options (scan --licenses/--report, suggest, plan, migrate, radar).

### Web (Indistractable design)

- **Main site (`web/index.html`):** Hero, trust list, demo grid (full workflow + Scan, AI Explain, Safe Upgrade, Code Fix, Interactive), compare (Dependabot vs Upshift), problem/solution, “What you get today,” Radar CTA, pricing (Free / Pro / Team), FAQ, footer. Uses `styles.css` (soft dark, blue accent, Inter). Links: /start, /radar/, /blog/index.html, GitHub, docs.
- **Radar (`web/radar/index.html`):** Same header/footer and design tokens. Free vs Pro tiers, paste/upload JSON, summary cards + table. **Fix applied:** single-JSON paste no longer duplicates the report (parse whole blob only when no NDJSON lines succeeded).
- **Blog (`web/blog/when-it-breaks-guardrails-hitl.html`):** Uses `../styles.css` but loads **DM Sans** instead of Inter — minor font inconsistency with main site.

### Docs

- **Index (`docs/README.md`):** Links to user-guide, cli-reference, configuration, radar, when-it-breaks-and-guardrails, opt-in-insights, endpoint, development, github-app, ROADMAP, RELEASE-v0.4.0, blog-when-it-breaks-guardrails-hitl, blog-post. All target files exist.
- **Content:** User guide and CLI reference match current commands and options.

### Recommendations

1. **Blog font:** Switch blog page to Inter (or document that blog uses DM Sans) for consistency with main site.
2. **Browser e2e (optional):** Add Playwright or similar to open `/` and `/radar/`, assert visible headings and no console errors.
3. **Explain e2e:** Add test with mocked API or `OPENAI_API_KEY` in env for `upshift explain chalk` in fixture.

---

*Last run: after adding `tests/e2e/cli.e2e.mjs`, `tests/fixtures/minimal/package.json`, and Radar parseInput fix.*
