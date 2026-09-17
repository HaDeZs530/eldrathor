# Eldrathor host keep-alive - runs every 2 min from the "Eldrathor dev keep-alive" scheduled task
# (app/scripts/register-keep-alive.ps1). Keeps the phone-playtest server serving CURRENT main:
#   1. if the checkout is on `main` and clean -> fetch; fast-forward pull when origin/main moved
#      (a feature branch or local edits are left alone - the session working there owns the tree)
#   2. if package-lock.json changed in that pull -> npm ci
#   3. if nothing answers on 5173 -> start the dev server detached (dev-detached.ps1)
# Vite hot-reloads on file changes, so a pulled PR is live on the phone within seconds; no restart needed.
# Log: %TEMP%\eldrathor-keepalive.log (last 400 lines kept).
$ErrorActionPreference = 'Continue'
$app = Split-Path -Parent $PSScriptRoot
$repo = Split-Path -Parent $app
$log = Join-Path $env:TEMP 'eldrathor-keepalive.log'
function Log($m) { $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $m"; Add-Content -Path $log -Value $line; Write-Host $line }

Set-Location $repo
$branch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
$dirty = (git status --porcelain 2>$null | Where-Object { $_ -notmatch 'playtest-traces' }) -ne $null
if ($branch -eq 'main' -and -not $dirty) {
  git fetch -q origin main 2>$null
  $local = (git rev-parse HEAD).Trim(); $remote = (git rev-parse origin/main).Trim()
  if ($local -ne $remote) {
    $lockBefore = (git rev-parse HEAD:app/package-lock.json 2>$null)
    $out = git pull -q --ff-only origin main 2>&1
    $now = (git rev-parse --short HEAD).Trim()
    Log "pulled main $($local.Substring(0,7)) -> $now"
    $lockAfter = (git rev-parse HEAD:app/package-lock.json 2>$null)
    if ($lockBefore -ne $lockAfter) { Log 'package-lock changed -> npm ci'; Push-Location $app; npm ci --no-audit --no-fund 2>&1 | Select-Object -Last 2 | ForEach-Object { Log "  $_" }; Pop-Location }
  }
} elseif ($branch -ne 'main') {
  Log "on branch $branch - not pulling (a session owns this tree)"
} else {
  Log 'main has local changes - not pulling'
}

$up = $false
try { $up = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 http://localhost:5173/).StatusCode -eq 200 } catch { }
if (-not $up) {
  Log 'dev server down on 5173 -> starting detached'
  & (Join-Path $PSScriptRoot 'dev-detached.ps1') | Out-Null
  try { $up = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 http://localhost:5173/).StatusCode -eq 200 } catch { }
  Log ("dev server " + ($(if ($up) { 'up' } else { 'STILL DOWN - see %TEMP%\eldrathor-dev-5173.log' })))
}

# keep the log bounded
if ((Get-Content $log -ErrorAction SilentlyContinue | Measure-Object -Line).Lines -gt 600) { Get-Content $log -Tail 400 | Set-Content $log }
