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

- **Persisted dashboard** — Reports are stored and associated with your upload token
- **Report history** — Load your reports on the Radar page (Radar Pro section: API URL + token)
- **Upload from CLI/CI** — `upshift scan --report out.json --upload` sends reports to your Radar Pro backend (requires `UPSHIFT_RADAR_TOKEN` and `UPSHIFT_RADAR_UPLOAD_URL`)
- **Alerts** — (Coming) Notify when outdated or vulnerability counts exceed thresholds
- **Export** — Download or share reports
- **Org-wide** — Team plan: visibility across all repos in your org

See [Pricing](https://upshiftai.dev/#pricing) on the site.

### Radar Pro setup (MVP)

1. **Backend:** Deploy Supabase Edge Functions `radar-upload`, `radar-reports`, `radar-report` and run the migration `supabase/migrations/20250201120000_radar_reports.sql` so the `radar_reports` table exists.
2. **Upload token:** Generate a UUID (e.g. in the Radar Pro dashboard or locally) and use it as your upload token. Store it in env: `UPSHIFT_RADAR_TOKEN=<uuid>`.
3. **API URL:** Set `UPSHIFT_RADAR_UPLOAD_URL` to your Supabase functions base, e.g. `https://YOUR_REF.supabase.co/functions/v1/radar-upload`.
4. **CLI:** Run `upshift scan --report report.json --upload` in each repo; reports are stored under your token.
5. **Dashboard:** On [Radar](https://upshiftai.dev/radar/), open the **Radar Pro** section, enter the same API URL (base, e.g. `https://YOUR_REF.supabase.co/functions/v1`) and your upload token, then click **Load my reports**. Click **Open** on a report to view it.

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
