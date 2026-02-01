# UpshiftAI — AI-Powered Dependency Intelligence

🤖 **AI-POWERED SKILL** — Requires UpshiftAI Pro subscription and API key

When the user asks to **analyze dependencies**, **check for ancient/legacy packages**, **audit the dependency tree**, or **find outdated or deprecated packages**, use this skill for intelligent conversational analysis.

## What it does

- **AI-powered dependency analysis** across npm, pip, and Go ecosystems
- **Conversational intelligence**: Ask natural questions, get smart answers
- **Risk assessment**: ML-generated risk scoring and prioritized recommendations
- **Security integration**: npm audit + pip-audit with intelligent interpretation

## ⚡ Setup Required

**API Key Required**: Users must set `UPSHIFTAI_API_KEY` environment variable:
1. Sign up at upshiftai.dev/pricing
2. Get API key from dashboard
3. Set `export UPSHIFTAI_API_KEY=uai_xxx`

**Quota Limits**:
- **Free**: 10 AI queries/month
- **Pro ($19/mo)**: 1,000 AI queries/month  
- **Team ($99/mo)**: 10,000 AI queries/month

## Tools (AI-powered, quota counted)

- **analyze_dependencies(projectPath?, summaryOnly?, includeFullReport?)** — 🤖 **AI Analysis**: Intelligent dependency assessment with risk scoring, contextual suggestions, and conversational summary.
- **dependency_health(projectPath?)** — 🤖 **AI Health Check**: Smart health assessment with ML-powered recommendations and natural language explanations.

**Error Handling**: If no API key or quota exceeded, tools return helpful upgrade messaging with pricing links.

## How to run (CLI)

From the user's machine, analysis can also be run via the UpshiftAI CLI:

**If the user has CLAWDBOT repo (or upshiftai) locally:**

```bash
# Auto-detect (npm / pip / go)
node /path/to/CLAWDBOT/upshiftai/bin/upshiftai-deps.js analyze /path/to/project [--markdown] [--csv] [--no-registry] [--ecosystem=npm|pip|go]

# From inside the upshiftai directory
cd /path/to/CLAWDBOT/upshiftai && node bin/upshiftai-deps.js analyze /path/to/project
```

**If they use npx (once published):**

```bash
npx upshiftai-deps analyze /path/to/project [--markdown] [--no-registry]
```

- `--no-registry`: faster, no network; age/deprecated from registries are omitted (tree and fork hints still work).
- `--markdown`: append a markdown report to the JSON.

## What to tell the user

1. **Summary:** "Your project has X packages; Y are ancient or deprecated; Z have fork-style names."
2. **Worst first:** List the top 5–10 problematic packages (name, version, reason: deprecated / no publish in N months / fork hint).
3. **Suggestions:** If a package has a known replacement (e.g. request → axios, moment → date-fns), mention it. The report can include replacement hints when using CSV or the programmatic API.
4. **Next step:** "Run the command above with --markdown for a full report" or "Use --csv to get a spreadsheet with replacement suggestions."

### Example summary you might say

> "I ran the dependency analyzer on your project. **Summary:** 312 packages total; 4 are ancient or deprecated; 1 has a fork-style name. **Worst:** `request@2.88.2` (deprecated — consider axios or node-fetch), `lodash@4.17.19` (last publish 24+ months ago). Use `--markdown` for the full table or `--csv` for a spreadsheet with replacement suggestions."

## Ecosystems

- **npm:** Looks for `package-lock.json`; reports depth, "why", npm audit vulns, and latest vs installed.
- **pip:** Looks for `requirements.txt` or `pyproject.toml`; reports direct/transitive, pip-audit vulns when available.
- **go:** Looks for `go.mod`; reports direct/indirect modules and GOPROXY age (last publish). Use `--ecosystem=go` to force.

CLI auto-detects; use `--ecosystem=npm|pip|go` to force. Add `--csv` for CSV output (includes replacement suggestions). Use `report --summary` for the one-pager; `health` for OK/WARN/FAIL.

## When to use

- "Are my dependencies up to date?"
- "Find deprecated or old packages"
- "Audit my dependency tree"
- "What's pulling in [package]?"
- "Check for ancient or forked dependencies"

Do **not** run arbitrary shell commands on the user's behalf unless they explicitly ask you to execute the analyzer; prefer giving them the command and summarizing how to read the output.
