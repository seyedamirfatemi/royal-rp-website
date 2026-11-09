# =====================================================================
#  ROYAL RP - run the domain's nameservers on this server
#
#  Makes this machine the authoritative DNS for the domain, so no
#  external DNS provider is needed.
#
#  Run in PowerShell as Administrator:
#
#      .\tools\setup-dns.ps1 -Domain royal-rp.ir -ServerIp 5.57.34.36
#
#  Safe to re-run: every step checks before it changes anything.
#
#  AFTERWARDS, at nic.ir, register the two nameservers WITH their IP
#  (the glue record), because they live inside the domain itself:
#
#      ns1.<domain>   <server ip>
#      ns2.<domain>   <server ip>
#
#  TRADE-OFF worth knowing: with the nameservers on this one machine,
#  if the server or its network goes down the whole domain stops
#  resolving, not just the website.
# =====================================================================
param(
  [Parameter(Mandatory = $true)] [string] $Domain,
  [Parameter(Mandatory = $true)] [string] $ServerIp,
  [string] $AdminEmail = "admin"
)

$ErrorActionPreference = "Stop"

function Step($text) { Write-Host "`n  $text" -ForegroundColor Cyan }
function Ok($text)   { Write-Host "  [ok]   $text" -ForegroundColor Green }
function Warn($text) { Write-Host "  [warn] $text" -ForegroundColor Yellow }

Write-Host "`n  Royal RP - authoritative DNS for $Domain" -ForegroundColor White
Write-Host "  ---------------------------------------------"

# --- must be elevated: installing a role and opening a port both need it
$admin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
         ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
  Write-Host "`n  Run this in PowerShell started with 'Run as Administrator'.`n" -ForegroundColor Red
  exit 1
}

# ---------------------------------------------------------------
Step "1. DNS Server role"
# ---------------------------------------------------------------
$feature = Get-WindowsFeature -Name DNS
if ($feature.Installed) {
  Ok "already installed"
} else {
  Install-WindowsFeature -Name DNS -IncludeManagementTools | Out-Null
  Ok "installed"
}
Import-Module DnsServer -ErrorAction SilentlyContinue

# ---------------------------------------------------------------
Step "2. zone for $Domain"
# ---------------------------------------------------------------
$zone = Get-DnsServerZone -Name $Domain -ErrorAction SilentlyContinue
if ($zone) {
  Ok "zone already exists"
} else {
  Add-DnsServerPrimaryZone -Name $Domain -ZoneFile "$Domain.dns" | Out-Null
  Ok "zone created"
}

# ---------------------------------------------------------------
Step "3. A records"
# ---------------------------------------------------------------
foreach ($name in @("@", "www", "ns1", "ns2")) {
  $existing = Get-DnsServerResourceRecord -ZoneName $Domain -Name $name -RRType A -ErrorAction SilentlyContinue
  $label = if ($name -eq "@") { $Domain } else { "$name.$Domain" }

  if ($existing) {
    $current = $existing.RecordData.IPv4Address.IPAddressToString
    if ($current -contains $ServerIp -or $current -eq $ServerIp) {
      Ok "$label -> $ServerIp"
      continue
    }
    Remove-DnsServerResourceRecord -ZoneName $Domain -Name $name -RRType A -Force
    Warn "$label pointed at $current, replacing"
  }
  Add-DnsServerResourceRecordA -ZoneName $Domain -Name $name -IPv4Address $ServerIp | Out-Null
  Ok "$label -> $ServerIp"
}

# ---------------------------------------------------------------
Step "4. NS records"
# ---------------------------------------------------------------
# Creating a zone gives it one NS record naming this machine, which is
# not a name the outside world can resolve. Ours replace it.
$wanted = @("ns1.$Domain.", "ns2.$Domain.")
$nsRecords = Get-DnsServerResourceRecord -ZoneName $Domain -RRType NS -ErrorAction SilentlyContinue

foreach ($want in $wanted) {
  $have = $nsRecords | Where-Object { $_.RecordData.NameServer -eq $want }
  if ($have) { Ok "$want present" }
  else {
    Add-DnsServerResourceRecord -ZoneName $Domain -NS -Name "@" -NameServer $want | Out-Null
    Ok "$want added"
  }
}

$nsRecords = Get-DnsServerResourceRecord -ZoneName $Domain -RRType NS
foreach ($rec in $nsRecords) {
  $ns = $rec.RecordData.NameServer
  if ($wanted -notcontains $ns) {
    Remove-DnsServerResourceRecord -ZoneName $Domain -RRType NS -Name "@" `
      -RecordData $ns -Force -ErrorAction SilentlyContinue
    Warn "removed stray nameserver $ns"
  }
}

# ---------------------------------------------------------------
Step "5. SOA points at ns1"
# ---------------------------------------------------------------
$soa = Get-DnsServerResourceRecord -ZoneName $Domain -RRType SOA
$newSoa = $soa.Clone()
$newSoa.RecordData.PrimaryServer     = "ns1.$Domain."
$newSoa.RecordData.ResponsiblePerson = "$AdminEmail.$Domain."
if ($soa.RecordData.PrimaryServer -ne $newSoa.RecordData.PrimaryServer) {
  Set-DnsServerResourceRecord -ZoneName $Domain -OldInputObject $soa -NewInputObject $newSoa
  Ok "SOA primary server set to ns1.$Domain"
} else {
  Ok "SOA already correct"
}

# ---------------------------------------------------------------
Step "6. recursion off"
# ---------------------------------------------------------------
# A nameserver open to the internet WITH recursion on is an open
# resolver, and gets abused to amplify DDoS traffic - which usually
# ends in the data centre suspending the server. This machine answers
# only for its own zone, so recursion has no purpose here.
Set-DnsServerRecursion -Enable $false
Ok "recursion disabled (this is an authoritative server, not a resolver)"

# ---------------------------------------------------------------
Step "7. firewall, port 53"
# ---------------------------------------------------------------
foreach ($proto in @("UDP", "TCP")) {
  $ruleName = "DNS $proto (Royal RP)"
  if (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue) {
    Ok "$proto 53 already allowed"
  } else {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound `
      -Protocol $proto -LocalPort 53 -Action Allow | Out-Null
    Ok "$proto 53 allowed"
  }
}

Restart-Service DNS
Ok "DNS service restarted"

# ---------------------------------------------------------------
Step "8. check"
# ---------------------------------------------------------------
Start-Sleep -Seconds 2
$answer = Resolve-DnsName -Name $Domain -Server 127.0.0.1 -Type A -ErrorAction SilentlyContinue
if ($answer -and ($answer.IPAddress -contains $ServerIp)) {
  Ok "$Domain resolves to $ServerIp locally"
} else {
  Warn "local lookup did not return $ServerIp - check DNS Manager"
}

Write-Host "`n  ---------------------------------------------"
Write-Host "  Records now served for $Domain :" -ForegroundColor White
Get-DnsServerResourceRecord -ZoneName $Domain |
  Where-Object { $_.RecordType -in @("A", "NS") } |
  ForEach-Object {
    $data = if ($_.RecordType -eq "A") { $_.RecordData.IPv4Address } else { $_.RecordData.NameServer }
    "    {0,-6} {1,-8} {2}" -f $_.RecordType, $_.HostName, $data
  }

Write-Host @"

  ---------------------------------------------
  NEXT, at nic.ir -> DNS settings for $Domain

      NS 1   ns1.$Domain     $ServerIp
      NS 2   ns2.$Domain     $ServerIp

  The IP column is required here, unlike with an external DNS
  provider: the nameservers live inside the domain they serve, so
  the registry has to publish their addresses itself. That is the
  glue record the yellow notice on that page describes.

  Delegation for .ir usually appears within a few hours. Check from
  outside with the registry's own tool at dig.nic.ir:

      royal-rp.ir   type NS                  -> expect ns1 and ns2
      royal-rp.ir   type A, 'specify myself' = $ServerIp
                                             -> expect $ServerIp

  The second one proves port 53 is reachable from the internet,
  which a local lookup cannot tell you.

"@ -ForegroundColor Gray
