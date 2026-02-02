#!/usr/bin/env bash
# One-time setup: JARVIS in Cursor. Run from repo root:  scripts/setup-jarvis-cursor.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example."
else
  echo ".env already exists."
fi

echo ""
echo "Next: edit .env and set:"
echo "  1. JARVIS_EDGE_URL = https://YOUR_REF.supabase.co/functions/v1/jarvis"
echo "     (Get YOUR_REF from Supabase Dashboard → project URL)"
echo "  2. UPSHIFTAI_API_KEY = your key from https://upshiftai.dev/pricing or platform dashboard"
echo ""
echo "Then in Cursor: add these vars to Cursor Settings → Features → Environment (optional if .env is loaded),"
echo "or leave them in .env so scripts/call-jarvis.js can use them."
echo ""
echo "Deploy Edge (if not done):  supabase functions deploy jarvis"
echo "See:  docs/JARVIS_IN_CURSOR.md"
