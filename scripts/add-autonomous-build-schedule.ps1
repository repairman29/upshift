# Add JARVIS Autonomous Build to Windows Task Scheduler
# Run this script once. To remove: Task Scheduler → JARVIS Autonomous Build → Delete

$taskName = "JARVIS Autonomous Build"
$batPath = Join-Path $PSScriptRoot "run-autonomous-build.bat"
$batPath = (Resolve-Path $batPath).Path

if (-not (Test-Path $batPath)) {
    Write-Host "Error: $batPath not found." -ForegroundColor Red
    exit 1
}

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batPath`"" -WorkingDirectory (Split-Path (Split-Path $batPath))
$trigger = New-ScheduledTaskTrigger -Daily -At 4am
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
    Write-Host "Done. JARVIS Autonomous Build will run daily at 4 AM." -ForegroundColor Green
    Write-Host "To remove: Task Scheduler → Task Scheduler Library → '$taskName' → Delete" -ForegroundColor Gray
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
