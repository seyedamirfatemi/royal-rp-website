# =====================================================================
#  ROYAL RP - install Caddy in front of the website
#
#  Puts a reverse proxy on 80/443 so the site is reached at
#  https://<domain> instead of http://<ip>:4000, with a certificate
#  Caddy gets and renews by itself.
#
#  Run in PowerShell as Administrator:
#
#      .\tools\setup-caddy.ps1 -Domain royal-rp.ir
#
#  It will not start Caddy until the domain actually resolves to this
#  server. Starting earlier makes Caddy ask Let's Encrypt for a
#  certificate it cannot prove it owns, and repeated failures count
#  against a rate limit. Re-run it once DNS is live, or pass -Force.
#
#  Safe to re-run.
# =====================================================================
param(
  [Parameter(Mandatory = $true)] [string] $Domain,
  [string] $InstallDir = "C:\caddy",
  [string] $AppPort = "4000",
  [switch] $Force
)

$ErrorActionPreference = "Stop"

function Step($t) { Write-Host "`n  $t" -ForegroundColor Cyan }
function Ok($t)   { Write-Host "  [ok]   $t" -ForegroundColor Green }
function Warn($t) { Write-Host "  [warn] $t" -ForegroundColor Yellow }
function Bad($t)  { Write-Host "  [fail] $t" -ForegroundColor Red }

Write-Host "`n  Royal RP - Caddy for $Domain" -ForegroundColor White
Write-Host "  ---------------------------------------------"

$admin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
         ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
  Bad "Run this in PowerShell started with 'Run as Administrator'."
  exit 1
}

$here    = Split-Path -Parent $PSScriptRoot
$caddy   = Join-Path $InstallDir "caddy.exe"
$cfgFile = Join-Path $InstallDir "Caddyfile"

# ---------------------------------------------------------------
Step "1. caddy.exe"
# ---------------------------------------------------------------
New-Item -ItemType Directory -Force $InstallDir | Out-Null
if (Test-Path $caddy) {
  Ok "already at $caddy"
} else {
  $url = "https://caddyserver.com/api/download?os=windows&arch=amd64"
  Write-Host "         downloading from caddyserver.com ..."
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $caddy -UseBasicParsing
    Ok "downloaded"
  } catch {
    Bad "could not download Caddy: $($_.Exception.Message)"
    Write-Host "`n  Download it by hand from https://caddyserver.com/download"
    Write-Host "  (Windows / amd64), save it as $caddy, and run this again.`n"
    exit 1
  }
}
& $caddy version | ForEach-Object { Ok "version $_" }

# ---------------------------------------------------------------
Step "2. Caddyfile"
# ---------------------------------------------------------------
$template = Join-Path $PSScriptRoot "Caddyfile"
if (-not (Test-Path $template)) { Bad "tools\Caddyfile is missing"; exit 1 }

(Get-Content $template -Raw).Replace("__DOMAIN__", $Domain).Replace("127.0.0.1:4000", "127.0.0.1:$AppPort") |
  Set-Content -Path $cfgFile -Encoding utf8
Ok "wrote $cfgFile"

& $caddy validate --config $cfgFile 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Bad "Caddy rejected the config:"
  & $caddy validate --config $cfgFile
  exit 1
}
Ok "config is valid"

# ---------------------------------------------------------------
Step "3. ports 80 and 443"
# ---------------------------------------------------------------
foreach ($p in @(80, 443)) {
  $busy = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  if ($busy) {
    $owner = (Get-Process -Id $busy[0].OwningProcess -ErrorAction SilentlyContinue).ProcessName
    Warn "port $p is already used by '$owner' - stop it or Caddy cannot bind"
  }
  $rule = "Caddy $p (Royal RP)"
  if (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue) {
    Ok "$p already allowed through the firewall"
  } else {
    New-NetFirewallRule -DisplayName $rule -Direction Inbound -Protocol TCP -LocalPort $p -Action Allow | Out-Null
    Ok "$p allowed through the firewall"
  }
}

# ---------------------------------------------------------------
Step "4. is the website up behind it?"
# ---------------------------------------------------------------
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:$AppPort/api/health" -UseBasicParsing -TimeoutSec 8
  if ($r.StatusCode -eq 200) { Ok "the site answers on 127.0.0.1:$AppPort" }
} catch {
  Warn "nothing answering on 127.0.0.1:$AppPort - start it with: pm2 start royal-site"
}

# ---------------------------------------------------------------
Step "5. does the domain point here yet?"
# ---------------------------------------------------------------
$myIp = $null
try { $myIp = (Invoke-RestMethod -Uri "https://api.ipify.org?format=json" -TimeoutSec 8).ip } catch { }

$resolved = $null
try { $resolved = (Resolve-DnsName -Name $Domain -Type A -Server 8.8.8.8 -ErrorAction Stop |
                   Where-Object { $_.Type -eq "A" }).IPAddress } catch { }

$dnsReady = $false
if ($resolved) {
  Ok "$Domain resolves to $($resolved -join ', ')"
  if (-not $myIp -or ($resolved -contains $myIp)) { $dnsReady = $true }
  else { Warn "this server's public IP looks like $myIp - the domain points elsewhere" }
} else {
  Warn "$Domain does not resolve yet (the .ir delegation has not published)"
}

# ---------------------------------------------------------------
Step "6. run it"
# ---------------------------------------------------------------
if (-not $dnsReady -and -not $Force) {
  Write-Host @"

  Everything is in place, but Caddy is not started.

  It asks Let's Encrypt for a certificate the moment it starts, and
  that only succeeds once $Domain resolves to this server. Failed
  attempts count against a rate limit, so there is nothing to gain
  by starting early.

  Run this again when the domain resolves:

      .\tools\setup-caddy.ps1 -Domain $Domain

  or start it anyway with -Force.

"@ -ForegroundColor Gray
  exit 0
}

# pm2 already runs the website and is already set to start on boot,
# so Caddy goes under the same manager rather than adding a second one.
$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2) {
  Warn "pm2 not found - starting Caddy in this window instead"
  Write-Host "         (close it and Caddy stops)`n"
  & $caddy run --config $cfgFile
  exit 0
}

pm2 delete caddy 2>$null | Out-Null
pm2 start $caddy --name caddy --interpreter none -- run --config $cfgFile | Out-Null
pm2 save | Out-Null
Ok "Caddy started under pm2 and saved to the boot list"

Start-Sleep -Seconds 6
Write-Host @"

  ---------------------------------------------
  Check it:

      pm2 logs caddy --lines 30
      curl.exe -I https://$Domain

  The first request may take a few seconds while the certificate is
  issued. 'pm2 logs caddy' shows that happening.

  LAST STEP, once https works - tell the site it lives there now:

      node tools\set-domain.js $Domain
      pm2 restart royal-site

  That sets PUBLIC_URL, CORS_ORIGINS, the payment return URLs, and
  turns on COOKIE_SECURE and TRUST_PROXY. Do not run it before https
  works: a Secure cookie is never sent over plain http, so sign-in
  would stop working for everyone.

"@ -ForegroundColor Gray
