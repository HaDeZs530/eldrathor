# Register (or refresh) the "Eldrathor dev keep-alive" scheduled task on this PC: runs keep-alive.ps1 at
# logon (once), hidden, as the current user. Idempotent - re-running replaces the task.
#   powershell -ExecutionPolicy Bypass -File app/scripts/register-keep-alive.ps1
#   npm run host:register   (from app/)      |  npm run host:unregister to remove it
param([switch]$Unregister)
$name = 'Eldrathor dev keep-alive'
if ($Unregister) { Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue; Write-Host "removed task '$name'"; exit 0 }
$script = Join-Path $PSScriptRoot 'keep-alive.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
# ONE trigger: at logon only. (The every-2-minute repetition was removed 2026-09-17 - the task's console
# window flashed on every run and got in Anthony's way. Merged PRs are pulled by the coding session instead.)
$atLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName $name -Action $action -Trigger $atLogon -Settings $settings -RunLevel Limited -Force | Out-Null
Start-ScheduledTask -TaskName $name
Write-Host "registered '$name' (at logon only) and started it once. Log: $env:TEMP\eldrathor-keepalive.log"
