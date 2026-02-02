# Radar — Central view of dependency health

**Radar** is Upshift’s central view of dependency health across all your repos. It’s a core, revenue-generating product: one dashboard for your whole stack.

## What Radar is

- **One place** to see outdated counts, vulnerabilities, and ecosystems per repo
- **Free tier:** Paste or upload scan reports in-browser; no account required; data stays in your session
- **Radar Pro (paid):** Persisted dashboard, report history, alerts when thresholds are exceeded, export, org-wide visibility (included with Pro and Team)

## How to use Radar (free)

1. In each repo, run:
   ```bash
   upshift scan --report report.json
   ```
2. Open Radar: [https://upshiftai.dev/radar/](https://upshiftai.dev/radar/) or run:
   ```bash
   upshift radar
   ```
3. Paste the contents of `report.json` (or concatenate multiple reports, one per line) into the text area, or use **Upload file**.
4. Click **Load report(s)**. You’ll see a summary (repos, total outdated, total vulns) and a table per repo.

Reports are not stored; they exist only in your browser session.

## Radar Pro (revenue)

Radar Pro is included with **Pro** ($9/mo) and **Team** ($29/mo):

- **Persisted dashboard** — Reports are stored and associated with your account
- **Report history** — See how dependency health changes over time
- **Alerts** — Notify when outdated or vulnerability counts exceed thresholds
- **Upload from CLI/CI** — `upshift scan --report --upload` (when available) sends reports to your Radar Pro dashboard
- **Export** — Download or share reports
- **Org-wide** — Team plan: visibility across all repos in your org

See [Pricing](https://upshiftai.dev/#pricing) on the site.

## Report format

The JSON report produced by `upshift scan --report path.json` includes:

- `status`, `packageManager` or `ecosystem`
- `outdated`: array of `{ name, current, wanted, latest }`
- `vulnerabilities`: optional `{ counts, items }`
- `cwd`: project path (used as repo label in Radar)
- `timestamp`: ISO string

Radar accepts one JSON object or NDJSON (one report per line).

## Summary

- **Radar Free:** Try it at [upshiftai.dev/radar](https://upshiftai.dev/radar/); paste/upload reports; no account.
- **Radar Pro:** Persisted dashboard, history, alerts, upload from CLI/CI; Pro and Team plans.
