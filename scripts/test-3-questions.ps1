# Test JARVIS with 3 questions: quick answer, medium, and "full response later" offer.
# Run from repo root. Gateway must be running (e.g. npx clawdbot gateway run).
# Usage: powershell -ExecutionPolicy Bypass -File scripts\test-3-questions.ps1
#
# For smoothest results, run the same 3 questions in a Discord DM with the bot (see scripts/DISCORD_ROG_ED.md).
# If CLI hits "Context overflow", ensure clawdbot.json has models.providers.groq with contextWindow: 131072.

$sessionId = "test-3q-" + (Get-Date -Format "yyyyMMdd-HHmm")
$questions = @(
    "What is 15% of 80?",
    "In one sentence: what is quantum computing?",
    "Summarize how photosynthesis works in 2–3 sentences. If you can do a fuller pass and deliver it here in a few minutes, say so and I'll say yes."
)

Write-Host "Session: $sessionId"
Write-Host ""

for ($i = 0; $i -lt $questions.Count; $i++) {
    $n = $i + 1
    Write-Host "=== Question $n ===" -ForegroundColor Cyan
    Write-Host $questions[$i]
    Write-Host ""
    Write-Host "Sending to JARVIS (timeout 90s)..."
    $result = npx clawdbot agent --session-id $sessionId --message $questions[$i] --local 2>&1
    Write-Host $result
    Write-Host ""
    Write-Host "---"
    Write-Host ""
    if ($i -lt $questions.Count - 1) { Start-Sleep -Seconds 2 }
}

Write-Host "Done. Check: (1) quick math answer, (2) one-sentence answer, (3) short summary + offer of fuller pass."
