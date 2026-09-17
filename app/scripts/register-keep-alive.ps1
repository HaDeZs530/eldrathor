# Register (or refresh) the "Eldrathor dev keep-alive" scheduled task on this PC: runs keep-alive.ps1 at
# logon and every 2 minutes after, hidden, as the current user. Idempotent - re-running replaces the task.
#   powershell -ExecutionPolicy Bypass -File app/scripts/register-keep-alive.ps1
#   npm run host:register   (from app/)      |  npm run host:unregister to remove it
param([switch]$Unregister)
$name = 'Eldrathor dev keep-alive'
if ($Unregister) { Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue; Write-Host "removed task '$name'"; exit 0 }
$script = Join-Path $PSScriptRoot 'keep-alive.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
# two triggers: once at logon, and every 2 minutes indefinitely (an omitted RepetitionDuration = forever)
$atLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$every2 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 2)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName $name -Action $action -Trigger @($atLogon, $every2) -Settings $settings -RunLevel Limited -Force | Out-Null
Start-ScheduledTask -TaskName $name
Write-Host "registered '$name' (at logon + every 2 min) and started it once. Log: $env:TEMP\eldrathor-keepalive.log"
