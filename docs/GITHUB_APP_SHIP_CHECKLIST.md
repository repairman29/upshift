# GitHub App — ship checklist (P0)

Use this to ship the **published Upshift GitHub App** (one-click install, scan on PR, comment). Primary paid entry for teams per [STRATEGY_AND_FEEDBACK.md](STRATEGY_AND_FEEDBACK.md).

Reference: [github-app.md](github-app.md) for full scaffold and webhook details. **Testing (local vs CI):** [GITHUB_APP_TESTING.md](GITHUB_APP_TESTING.md).

---

## Pre-requisites

- [ ] Supabase project linked (`supabase link` or `--project-ref`)
- [ ] Supabase migrations applied (`supabase db push` or `npm run supabase:push`) so `github_app_installations` exists

---

## 1. Create the GitHub App

- [ ] GitHub → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**
- [ ] **Name:** Upshift (or Upshift – Dependency upgrades)
- [ ] **Homepage URL:** https://upshiftai.dev
- [ ] **Callback URL:** Leave blank for now. (Only needed if you add **user authorization** later—e.g. "Sign in with GitHub" to link a user to an installation. Our flow uses installation tokens in Actions, not user OAuth.)
- [ ] **Setup URL (optional but recommended):** Where users land **after installing** the App. Use **`https://upshiftai.dev/github-app-installed`** so they see "Next: add the workflow and secrets" in order.
- [ ] **Webhook:** Active
- [ ] **Webhook URL:** This is the URL where GitHub sends events (install, PR, etc.). It must be your **deployed** Supabase Edge Function:
  - **Format:** `https://<project-ref>.supabase.co/functions/v1/github-app-webhook`
  - **Get &lt;project-ref&gt;:** From [Supabase Dashboard](https://supabase.com/dashboard) → your project → URL is `https://supabase.com/dashboard/project/<project-ref>`, or run `supabase projects list`.
  - You can create the App with a placeholder (e.g. `https://placeholder.supabase.co/functions/v1/github-app-webhook`), then **deploy the function** (step 2) and come back to App settings to paste the real URL.
- [ ] **Webhook secret:** A shared secret used to **verify that deliveries are from GitHub** and not tampered with. GitHub sends a hash in the `X-Hub-Signature-256` header (HMAC-SHA256 of the payload); your server recomputes it with this secret and rejects the request if they don’t match. See [Validating webhook deliveries](https://docs.github.com/webhooks/securing/).
  - **Create it:** Generate a high-entropy random string (e.g. `openssl rand -hex 32`). **Use the exact same value in two places:** (1) GitHub App → Webhook → Secret, and (2) Supabase secret `GITHUB_WEBHOOK_SECRET` in step 2. Never commit it or put it in repo code.
- [ ] **Permissions:** Contents (Read), Pull requests (Read & write), Metadata (Read)
- [ ] **Subscribe to events:** Installation, Installation repositories, Pull request (opened, synchronize)
- [ ] **Where can this App be installed?** "Any account" (or "Only on this account" for testing)
- [ ] Create the App; note **App ID** and generate **Private key** (download .pem)

---

## 2. Deploy webhook and set secret

**Optional — run the script** (from repo root; generates secret, deploys function, sets Supabase secret, prints next steps):

```bash
./scripts/ship-github-app.sh
# Or with project ref: SUPABASE_PROJECT_REF=<ref> ./scripts/ship-github-app.sh
# To include App ID/slug in summary: GITHUB_APP_ID=… GITHUB_APP_SLUG=… ./scripts/ship-github-app.sh
```

Then in GitHub App settings, set **Webhook URL** and **Webhook secret** to the values the script prints.

**Or do it manually:**

- [ ] Deploy Edge Function:  
  `supabase functions deploy github-app-webhook --project-ref <ref>`
- [ ] Set secret in Supabase — **must match** the Webhook secret you set in the GitHub App (same string in both places for signature validation):  
  `supabase secrets set GITHUB_WEBHOOK_SECRET=<your_webhook_secret> --project-ref <ref>`
- [ ] In GitHub App settings, set **Webhook URL** to your deployed function URL (see step 1)
- [ ] Optionally send a test delivery from GitHub to confirm 200

---

## 3. Public install flow

- [ ] **Setup URL (in App settings):** Set to **`https://upshiftai.dev/github-app-installed`** so after someone installs the App they land on the "Next: add the workflow" page.
- [ ] **Install App URL:** Use GitHub’s install URL:  
  `https://github.com/apps/<app-slug>/installations/new`  
  (App slug is the URL-friendly name from App settings; for Upshift it's `upshift-ai`.)
- [ ] Add a **"Install Upshift"** or **"Add to GitHub"** CTA on [upshiftai.dev](https://upshiftai.dev) (e.g. Pricing or Docs) that links to this URL — **done** (homepage, start page, docs).
- [ ] After install, installations are stored in `github_app_installations` (for future dashboard/billing)

---

## 4. Repos: run scan on PR

- [ ] Document for users: **After installing the App**, add the workflow to each repo:
  - Copy [.github/workflows/upshift-app-scan.yml](../.github/workflows/upshift-app-scan.yml) into the repo
  - Add secrets: **APP_ID** (App ID from step 1), **APP_PRIVATE_KEY** (contents of the .pem file)
- [ ] Optional: Build a "one-click add workflow" that creates the file and prompts for secrets (or use GitHub’s “Add to repo” flow if you have an OAuth App)

---

## 5. Optional: Marketplace

- [ ] If listing on GitHub Marketplace: complete [Marketplace listing requirements](https://docs.github.com/en/apps/publishing-apps-to-github-marketplace/listing-an-app-on-github-marketplace)
- [ ] Otherwise, the **Install App** link from step 3 is enough for "published" one-click install

---

## Done when

- Users can click a link on upshiftai.dev → install the App on an org/repo → add workflow + secrets → get scan comments on PRs.
- Installations are recorded in `github_app_installations` for future use (billing, dashboard).

---

## Next (after ship)

- Link App install to Pro/Team (e.g. require subscription for private repos or higher limits).
- Optional: App auto-adds workflow via API (advanced).
