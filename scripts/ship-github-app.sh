#!/usr/bin/env bash
# Ship the Upshift GitHub App: generate webhook secret, deploy Edge Function, set Supabase secret, print summary.
# Run from repo root. Prereqs: supabase CLI, migrations applied (github_app_installations table).
#
# Usage:
#   ./scripts/ship-github-app.sh
#   SUPABASE_PROJECT_REF=abcdef ./scripts/ship-github-app.sh
#   GITHUB_APP_ID=2811888 GITHUB_APP_SLUG=upshift-ai ./scripts/ship-github-app.sh  # optional, for summary
#
# You must still:
#   1. In GitHub App settings: set Webhook URL to the printed URL, set Webhook secret to the printed secret.
#   2. In each repo: add secrets APP_ID and APP_PRIVATE_KEY, add .github/workflows/upshift-app-scan.yml

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Project ref: env, then supabase status (needs Docker), then supabase projects list (linked row)
if [ -n "$SUPABASE_PROJECT_REF" ]; then
  PROJECT_REF="$SUPABASE_PROJECT_REF"
else
  if ! command -v supabase &>/dev/null; then
    echo "Error: supabase CLI not found. Install it or set SUPABASE_PROJECT_REF." >&2
    exit 1
  fi
  PROJECT_REF=$(supabase status --json 2>/dev/null | grep -o '"project_id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$PROJECT_REF" ]; then
    # Fallback: get linked project from "supabase projects list" (row with ●, ref is 3rd column)
    PROJECT_REF=$(supabase projects list 2>/dev/null | awk -F'|' '/●/ {gsub(/^ *| *$/,"",$3); print $3; exit}')
  fi
  if [ -z "$PROJECT_REF" ]; then
    echo "Error: Could not get Supabase project ref. Run 'supabase link' from the repo or set SUPABASE_PROJECT_REF." >&2
    exit 1
  fi
fi

WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/github-app-webhook"

# Generate webhook secret (high-entropy)
if [ -n "$GITHUB_WEBHOOK_SECRET" ]; then
  WEBHOOK_SECRET="$GITHUB_WEBHOOK_SECRET"
  echo "Using webhook secret from GITHUB_WEBHOOK_SECRET env."
else
  if command -v openssl &>/dev/null; then
    WEBHOOK_SECRET=$(openssl rand -hex 32)
  else
    echo "Error: openssl not found. Set GITHUB_WEBHOOK_SECRET env or install openssl." >&2
    exit 1
  fi
  echo "Generated new webhook secret."
fi

echo ""
echo "1. Deploying Edge Function github-app-webhook..."
supabase functions deploy github-app-webhook --project-ref "$PROJECT_REF"

echo ""
echo "2. Setting GITHUB_WEBHOOK_SECRET in Supabase..."
supabase secrets set "GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET" --project-ref "$PROJECT_REF"

echo ""
echo "=============================================="
echo "  GitHub App — next steps (do these manually)"
echo "=============================================="
echo ""
echo "A. In your GitHub App settings (Webhook section):"
echo "   • Webhook URL:  $WEBHOOK_URL"
echo "   • Webhook secret:  (paste the secret below, then save)"
echo ""
echo "   --- COPY THIS SECRET (do not commit) ---"
echo "$WEBHOOK_SECRET"
echo "   ---------------------------------------"
echo ""
echo "B. Install App URL (for your site CTA):"
if [ -n "$GITHUB_APP_SLUG" ]; then
  echo "   https://github.com/apps/${GITHUB_APP_SLUG}/installations/new"
else
  echo "   https://github.com/apps/<your-app-slug>/installations/new"
  echo "   (Replace <your-app-slug> with your App's URL slug from GitHub App settings.)"
fi
echo ""
echo "C. In each repo that uses the App, add GitHub Actions secrets:"
if [ -n "$GITHUB_APP_ID" ]; then
  echo "   • APP_ID = $GITHUB_APP_ID"
else
  echo "   • APP_ID = <your App ID>"
fi
echo "   • APP_PRIVATE_KEY = contents of your .pem file (full file including BEGIN/END lines)"
echo ""
echo "D. Copy the workflow into each repo:"
echo "   .github/workflows/upshift-app-scan.yml"
echo ""
echo "Docs: docs/GITHUB_APP_SHIP_CHECKLIST.md"
echo ""
