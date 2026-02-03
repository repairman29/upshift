#!/usr/bin/env node
/**
 * GitHub App setup checklist for Upshift scan-on-PR workflow.
 * Run: node scripts/github-app-checklist.mjs
 * Or: npm run github-app-checklist (if added to package.json)
 */
console.log(`
Upshift GitHub App — Setup Checklist
====================================

1. Create a GitHub App
   • GitHub → Your profile/org → Settings → Developer settings → GitHub Apps → New GitHub App
   • Name: e.g. "Upshift Scan" or your org name
   • Homepage URL: https://upshiftai.dev (or your docs URL)
   • Webhook: Active — URL: https://rbfzlqmkwhbvrrfdcain.supabase.co/functions/v1/github-app-webhook
   • Webhook secret: generate one, then run:
     npx supabase secrets set GITHUB_WEBHOOK_SECRET=<that-secret> --project-ref rbfzlqmkwhbvrrfdcain
   • Permissions:
     - Contents: Read-only
     - Pull requests: Read and write (for comments)
     - Metadata: Read-only
   • Subscribe to events: Installation, Installation repositories (for webhook backend); or none if only using workflow
   • Where can this App be installed? Your choice (this account only / any account)
   • Create GitHub App

2. Generate a private key
   • In the App settings → Private keys → Generate a private key
   • Save the .pem file securely

3. Note your App ID
   • App settings → About → App ID (e.g. 123456)

4. Install the App
   • App settings → Install App → Select org or repo
   • Install

5. Add repository secrets
   In each repo that will use the workflow (or in the org):
   • APP_ID = your App ID (e.g. 123456)
   • APP_PRIVATE_KEY = contents of the .pem file (entire file, including -----BEGIN/END-----)

6. Add the workflow
   • Copy .github/workflows/upshift-app-scan.yml into your repo's .github/workflows/
   • Commit and push. On the next PR (opened/synchronize), the workflow will run.

Env / secrets summary
---------------------
  APP_ID          (number, e.g. 123456)
  APP_PRIVATE_KEY (full PEM string)

Workflow file
-------------
  .github/workflows/upshift-app-scan.yml

Docs
----
  docs/github-app.md
`);
