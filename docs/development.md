# Development Guide

For contributors and developers: project structure, adding features, and key implementation details.

## Project structure

```
upshift/
├── src/
│   ├── cli.ts              # Entry point; registers all commands
│   ├── server.ts           # Billing API (credits, Stripe)
│   ├── commands/           # CLI command definitions (Commander)
│   │   ├── scan.ts
│   │   ├── explain.ts
│   │   ├── upgrade.ts
│   │   ├── fix.ts
│   │   ├── migrate.ts
│   │   ├── suggest.ts
│   │   ├── plan.ts
│   │   ├── radar.ts
│   │   └── ...
│   └── lib/                # Core logic (no CLI I/O)
│       ├── config.ts       # .upshiftrc load/merge
│       ├── scan.ts         # Scan logic; runScanForSuggest for suggest/plan
│       ├── explain.ts      # Explain + risk + AI; runExplainPython for Python
│       ├── upgrade.ts      # Single upgrade + webhook + regression recording
│       ├── batch-upgrade.ts
│       ├── fix.ts
│       ├── migrate.ts      # Template discovery + apply find/replace
│       ├── ecosystem.ts    # detectEcosystem; Python/Ruby/Go scan
│       ├── package-manager.ts
│       └── ...
├── migrations/             # Migration templates (JSON)
│   ├── README.md
│   ├── react-18-19.json
│   ├── next-13-14.json
│   └── vue-2-3.json
├── docs/                   # User and dev documentation
├── web/                    # Marketing site + Radar
│   └── radar/
└── vscode-extension/       # VS Code extension
```

**Conventions:**

- **commands/** — Parse options, call `lib/` functions, handle stdout/exit. No business logic.
- **lib/** — Pure logic where possible; accept `cwd`, options, return data or throw. I/O via parameters or well-known channels (e.g. `process.stdout` only where necessary).

## Adding a new command

1. **Create `src/commands/<name>.ts`:**
   - Use Commander: `new Command("name").description("...").option(...).action(...)`.
   - Call a function from `src/lib/` (e.g. `runScan`, `runExplain`). Pass `cwd`, options.
   - Return the command.

2. **Create or reuse lib** in `src/lib/<name>.ts`:
   - Export a `runX(options: XOptions): Promise<void>` (or return value) used by the command.
   - Use `loadConfig(cwd)` if you need config; use `runCommand` from `exec.js` for subprocesses.

3. **Register in `src/cli.ts`:**
   - `import { xCommand } from "./commands/x.js";`
   - `program.addCommand(xCommand());`

4. **Document:** Add to [CLI reference](cli-reference.md) and [user guide](user-guide.md) if user-facing.

## Adding a migration template

1. **Add JSON** under `migrations/`:
   - Name: `<ecosystem>-<from>-<to>.json` (e.g. `angular-14-15.json`).
   - Schema: `name`, `description`, `from`, `to`, `package`, `steps[]`, `links[]`.
   - Each step: `id`, `description`, and either `find`/`replace` (code) or `package`/`version` (dependency bump).

2. **Steps:**
   - **find/replace** — Applied to source files (JS/TS/JSX/TSX) under cwd; first match per step per file.
   - **package/version** — Emitted as “run `upshift upgrade <package> --to <version>`”; no automatic package.json edit in current impl.

3. **Document:** Add to [migrations/README.md](../migrations/README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md#migration-templates).

See [migrations/README.md](../migrations/README.md) for the full schema.

## Config schema

Config is defined in `src/lib/config.ts`: type `UpshiftConfig`, `loadConfig(cwd)`, `createConfigTemplate()`. Adding a new option:

1. Add the field to `UpshiftConfig` and `DEFAULT_CONFIG`.
2. Update `mergeConfig` if the new field is nested (e.g. new top-level object).
3. Update `createConfigTemplate()` so `upshift init` emits it.
4. Document in [configuration.md](configuration.md).

## Key flows

- **Scan (Node):** `scan.ts` → `detectPackageManager` → `getOutdatedDependencies` / `getVulnerabilities`; optional `getLicenses`, `--report` write.
- **Scan (Python/Ruby/Go):** `scan.ts` → `detectEcosystem` → `getPythonOutdated` / `getRubyOutdated` / `getGoOutdated` in `ecosystem.ts`.
- **Explain (Node):** `explain.ts` → `getCurrentVersion` / `getLatestVersion` (npm), `assessRisk`, `fetchChangelog`, optional `getAIAnalysis`; `getUsageInCodebase` for “used in your code”.
- **Explain (Python):** `explain.ts` → `runExplainPython`: pip show / requirements/pyproject for current; PyPI API for latest; version delta + upgrade hint.
- **Upgrade:** `upgrade.ts` → `loadConfig` → policy check (`assessRisk` + `upgradePolicy.blockRisk`) → approval (prompt/webhook) → backup → npm install → tests → optional `UPSHIFT_RECORD_OUTCOMES` write.
- **Migrate:** `migrate.ts` → `listTemplates` / `findTemplate` (from `migrations/` on disk) → `applyTemplate` (find/replace over collected source files).

## Build and test

```bash
npm install
npm run build
node dist/cli.js --help
node dist/cli.js scan --json
```

Tests: `npm test` (placeholder for now; add tests under `tests/` as needed).

## VS Code extension

- **Source:** `vscode-extension/src/extension.ts`; commands and menus in `package.json`.
- **Commands:** Scan, Explain, Explain current file, Fix current file, Upgrade, Upgrade all, Audit.
- **Build:** `cd vscode-extension && npm run build` (esbuild). Package: `vsce package`.

## Docs for product vs devs

- **Product / users:** [User guide](user-guide.md), [CLI reference](cli-reference.md), [Configuration](configuration.md), [Radar](radar.md), [When it breaks & guardrails](when-it-breaks-and-guardrails.md).
- **Devs / contributors:** This file ([development.md](development.md)), [CONTRIBUTING.md](../CONTRIBUTING.md), [migrations/README.md](../migrations/README.md), [GitHub App scaffold](github-app.md).

## See also

- [CONTRIBUTING.md](../CONTRIBUTING.md) — How to contribute, PR guidelines, migration templates
- [ROADMAP.md](../ROADMAP.md) — Planned features and innovation
- [Configuration](configuration.md) — Full config reference
