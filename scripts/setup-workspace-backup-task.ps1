# Setup Windows Task Scheduler for JARVIS workspace auto-backup
# Run this script once (as admin) to create the scheduled task

$taskName = "JARVIS-Workspace-Backup"
$scriptPath = "$PSScriptRoot\backup-workspaces.ps1"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Task '$taskName' already exists. Updating..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create task action
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

# Create triggers: every 2 hours during active hours (8am-10pm)
$triggers = @()
for ($hour = 8; $hour -le 22; $hour += 2) {
    $trigger = New-ScheduledTaskTrigger -Daily -At "$($hour):00"
    $triggers += $trigger
}

# Settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Principal (current user)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

# Register task
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $triggers[0] -Settings $settings -Principal $principal -Description "JARVIS automatic workspace backup every 2 hours"

Write-Host ""
Write-Host "Task '$taskName' created successfully!"
Write-Host "Runs every 2 hours from 8am-10pm"
Write-Host ""
Write-Host "Manual run: schtasks /run /tn '$taskName'"
Write-Host "View task: taskschd.msc"
