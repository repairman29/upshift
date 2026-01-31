# JARVIS Workspace Auto-Backup
# Backs up current window state to a timestamped workspace file
# Schedule with Task Scheduler for daily backups

$workspaceDir = "$env:USERPROFILE\.jarvis\workspaces"
$backupDir = "$env:USERPROFILE\.jarvis\workspace-backups"

# Ensure directories exist
if (-not (Test-Path $workspaceDir)) { New-Item -ItemType Directory -Path $workspaceDir -Force | Out-Null }
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }

# Get current visible windows
$windows = Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object ProcessName, MainWindowTitle, Id

# Create backup data
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$dayOfWeek = (Get-Date).DayOfWeek

$backup = @{
    name = "auto-backup-$timestamp"
    description = "Automatic backup - $dayOfWeek"
    created = (Get-Date).ToString("o")
    windows = @($windows | ForEach-Object {
        @{
            app = $_.ProcessName
            title = $_.MainWindowTitle
            pid = $_.Id
        }
    })
    platform = "windows"
}

# Save backup
$backupPath = Join-Path $backupDir "backup-$timestamp.json"
$backup | ConvertTo-Json -Depth 3 | Set-Content -Path $backupPath -Encoding UTF8

# Also save as "latest" for quick restore
$latestPath = Join-Path $workspaceDir "auto-latest.json"
$backup.name = "auto-latest"
$backup.description = "Most recent auto-backup ($timestamp)"
$backup | ConvertTo-Json -Depth 3 | Set-Content -Path $latestPath -Encoding UTF8

# Cleanup old backups (keep last 30)
$oldBackups = Get-ChildItem $backupDir -Filter "backup-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30
foreach ($old in $oldBackups) {
    Remove-Item $old.FullName -Force
}

Write-Host "Workspace backed up: $backupPath"
Write-Host "Apps: $($windows.Count)"
