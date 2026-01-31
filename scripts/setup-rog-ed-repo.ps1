# Setup JARVIS ROG Ed. repo with GitHub CLI
# Run from repo root: powershell -ExecutionPolicy Bypass -File scripts\setup-rog-ed-repo.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $repoRoot ".git"))) { $repoRoot = (Get-Location).Path }
Set-Location $repoRoot

Write-Host "Repo root: $repoRoot" -ForegroundColor Gray

# 1. Login if needed
$ErrorActionPreferenceSave = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
gh auth status 2>$null | Out-Null
$needLogin = ($LASTEXITCODE -ne 0)
$ErrorActionPreference = $ErrorActionPreferenceSave
if ($needLogin) {
    Write-Host "`nGitHub CLI is not logged in. You'll get a one-time code and a URL." -ForegroundColor Yellow
    Write-Host "1. Copy the code shown" -ForegroundColor Cyan
    Write-Host "2. Open the URL in your browser" -ForegroundColor Cyan
    Write-Host "3. Enter the code and authorize" -ForegroundColor Cyan
    Write-Host "4. Wait until you see 'Logged in as ...'`n" -ForegroundColor Cyan
    gh auth login --web --git-protocol https --hostname github.com
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

# 2. Remove rog-ed remote if it exists (so gh can add it)
git remote remove rog-ed 2>$null

# 3. Create repo and push (--source=. uses current dir, sets remote, pushes)
Write-Host "`nCreating repo repairman29/jarvis-rog-ed and pushing main..." -ForegroundColor Green
gh repo create jarvis-rog-ed --public --description "JARVIS ROG Ed. - AI assistant for ASUS ROG Ally (Windows 11)" --source=. --remote=rog-ed --push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDone. Repo: https://github.com/repairman29/jarvis-rog-ed" -ForegroundColor Green
    Write-Host "To use this repo as your default remote:" -ForegroundColor Gray
    Write-Host "  git remote rename origin mac-origin" -ForegroundColor Gray
    Write-Host "  git remote rename rog-ed origin" -ForegroundColor Gray
} else {
    exit 1
}
