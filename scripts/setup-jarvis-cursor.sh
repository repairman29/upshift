#!/usr/bin/env bash
# One-time setup: JARVIS in Cursor. Run from repo root:  scripts/setup-jarvis-cursor.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p vault
if [ ! -f vault/jarvis.json ]; then
  if [ -f vault/jarvis.json.example ]; then
    cp vault/jarvis.json.example vault/jarvis.json
    echo "Created vault/jarvis.json from vault/jarvis.json.example."
  else
    echo '{"JARVIS_EDGE_URL":"","UPSHIFTAI_API_KEY":""}' > vault/jarvis.json
    echo "Created vault/jarvis.json."
  fi
else
  echo "vault/jarvis.json already exists."
fi

echo ""
echo "1) Create UpshiftAI API key and store it in vault:"
echo "   cd upshiftai/platform && node ../../scripts/create-upshift-api-key.cjs"
echo "   (Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or upshiftai/platform/.env)"
echo ""
echo "2) Put JARVIS Edge URL in vault: edit vault/jarvis.json and set JARVIS_EDGE_URL to:"
echo "   https://YOUR_REF.supabase.co/functions/v1/jarvis"
echo "   Or run:  cd upshiftai/platform && node ../../scripts/create-upshift-api-key.cjs --edge-url https://YOUR_REF.supabase.co/functions/v1/jarvis"
echo ""
echo "3) Deploy Edge (if not done):  supabase functions deploy jarvis"
echo "See:  docs/JARVIS_IN_CURSOR.md"
