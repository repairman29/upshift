# GitHub App (scaffold)

Upshift can run in CI via the **GitHub Action** today. A **GitHub App** would add repo-level integration: scan on PR or schedule, post summary comments, and (with App install) access to private repos and org-wide visibility.

## What we have today

- **GitHub Action** — [.github/workflows/example-scan.yml](../.github/workflows/example-scan.yml): run `upshift scan` on pull requests; optional PR comment with results. No App required; uses `actions/checkout` and repo token.
- **Usage:** Add the workflow to your repo or use `repairman29/upshift@main` in your own workflow.

## What a GitHub App would add

- **Install once per org/repo** — App can run on private repos and access (with permissions) dependency metadata.
- **Trigger on PR or schedule** — Run scan when a PR is opened/updated, or on a cron (e.g. weekly).
- **Post summary comment** — Comment on the PR with outdated count, vulnerability count, and link to Radar or upgrade commands.
- **Optional: Radar Pro upload** — With Radar Pro, App could push scan results to your dashboard (future).

## Scaffold: how to build it

1. **Create a GitHub App** (GitHub → Settings → Developer settings → GitHub Apps → New):
   - Name, description, homepage (e.g. upshiftai.dev).
   - Permissions: **Contents** (read), **Pull requests** (read/write for comments), **Metadata** (read).
   - Subscribe to: **Pull request** (opened, synchronize).

2. **Host the App logic** — Options:
   - **Probots / Octokit webhooks** — Receive `pull_request` events; run `upshift scan --json` in a container or serverless; post comment via Octokit.
   - **GitHub Actions with App token** — Use `tibdex/github-app-token` to get an installation token; run `upshift scan --report report.json`; use `github-script` to comment. No separate server; App only for auth to private repos.

3. **Minimal flow:**
   - On `pull_request` (opened/synchronize): checkout repo → `npm install -g upshift-cli` (or use action) → `upshift scan --json` → parse output → comment on PR with summary (outdated count, vuln count, suggest `upshift upgrade` or link to Radar).

4. **Example (Actions + App token):**
   ```yaml
   # .github/workflows/upshift-scan.yml (in a repo that installs the App)
   on:
     pull_request:
       branches: [main]
   jobs:
     scan:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
         - run: npm install -g upshift-cli
         - id: scan
           run: |
             upshift scan --json > report.json || true
             echo 'report<<EOF' >> $GITHUB_OUTPUT
             cat report.json >> $GITHUB_OUTPUT
             echo 'EOF' >> $GITHUB_OUTPUT
         - uses: actions/github-script@v7
           with:
             script: |
               const report = JSON.parse('${{ steps.scan.outputs.report }}');
               const outdated = report.outdated?.length ?? 0;
               const vulns = report.vulnerabilities?.items?.length ?? 0;
               github.rest.issues.createComment({
                 owner: context.repo.owner,
                 repo: context.repo.repo,
                 issue_number: context.issue.number,
                 body: `## Upshift Scan\n\nOutdated: ${outdated}\nVulnerabilities: ${vulns}\n\nRun \`upshift upgrade --all-minor\` for safe upgrades.`
               });
   ```

5. **For private repos / org-wide:** Install the GitHub App on the org; use `tibdex/github-app-token` with the App’s private key and app ID to get an installation access token; pass that token to `actions/checkout` so the workflow can clone the repo.

## Status

- **Scaffold / docs:** This document.
- **Beta:** A published “Upshift” GitHub App (installable, runs scan on PR and comments) is planned; not yet available.
- **Radar Pro:** Future App could optionally upload scan results to Radar Pro when the user has a subscription.

If you want to build your own App using this scaffold, see [GitHub Apps](https://docs.github.com/en/apps) and the [Upshift Action](../.github/workflows/example-scan.yml) for the scan step.
