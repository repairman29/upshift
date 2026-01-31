@echo off
REM Start JARVIS gateway on ROG Ally (no global clawdbot required)
REM To use secrets from Supabase Vault instead of .env: node scripts/start-gateway-with-vault.js
cd /d "%~dp0.."
echo Starting JARVIS gateway...
npx clawdbot gateway run
pause
