#!/usr/bin/env bash
# Ship the platform audit endpoint: ensure migration, deploy Edge Function, print URL.
# Run from repo root. Prereqs: supabase CLI. No extra secrets (function uses auto-injected SUPABASE_*).
#
# Usage:
#   ./scripts/ship-audit.sh
#   SUPABASE_PROJECT_REF=abcdef ./scripts/ship-audit.sh
#
# Customers then set UPSHIFT_AUDIT_URL to the printed URL for compliance-ready audit logs.

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
    PROJECT_REF=$(supabase projects list 2>/dev/null | awk -F'|' '/●/ {gsub(/^ *| *$/,"",$3); print $3; exit}')
  fi
  if [ -z "$PROJECT_REF" ]; then
    echo "Error: Could not get Supabase project ref. Run 'supabase link' from the repo or set SUPABASE_PROJECT_REF." >&2
    exit 1
  fi
fi

AUDIT_URL="https://${PROJECT_REF}.supabase.co/functions/v1/audit-events"

echo "Project ref: $PROJECT_REF"
echo ""
echo "1. Ensuring audit_logs table exists (supabase db push)..."
if ! supabase db push; then
  echo "   (db push failed — migration history may differ from remote. Deploying function anyway; ensure audit_logs table exists.)"
fi

echo ""
echo "2. Deploying Edge Function audit-events..."
supabase functions deploy audit-events --project-ref "$PROJECT_REF"

echo ""
echo "=============================================="
echo "  Audit endpoint — go live"
echo "=============================================="
echo ""
echo "Audit URL (give this to Team customers):"
echo "  $AUDIT_URL"
echo ""
echo "They set:  UPSHIFT_AUDIT_URL=$AUDIT_URL"
echo "Optional:  UPSHIFT_ORG, UPSHIFT_API_TOKEN (see docs/configuration.md)"
echo ""
echo "Docs: docs/AUDIT_GO_LIVE.md"
echo ""
