# Start the Eldrathor dev server for phone playtests as a DETACHED process (survives closing the terminal
# or the Claude Code session that launched it). Idempotent: if 5173 already answers, it does nothing.
#   powershell -ExecutionPolicy Bypass -File app/scripts/dev-detached.ps1
#   npm run dev:phone:bg   (same thing, from app/)
$app = Split-Path -Parent $PSScriptRoot
$log = Join-Path $env:TEMP 'eldrathor-dev-5173.log'
try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 http://localhost:5173/; if ($r.StatusCode -eq 200) { Write-Host "dev server already up on 5173 (log: $log)"; exit 0 } } catch { }
Start-Process -FilePath 'cmd.exe' -ArgumentList "/c cd /d `"$app`" && npx vite --host --port 5173 --strictPort > `"$log`" 2>&1" -WindowStyle Hidden
for ($i = 0; $i -lt 20; $i++) { Start-Sleep -Milliseconds 500; try { if ((Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:5173/).StatusCode -eq 200) { break } } catch { } }
Get-Content $log -Tail 5
Write-Host "Phone: use the Network URL above (Tailscale 100.x or LAN 192.168.x). Stop: taskkill the node process listening on 5173."
