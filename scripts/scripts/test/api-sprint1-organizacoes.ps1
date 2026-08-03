# Smoke API do Centro de Organizações (/organizacoes -> /api/tenants). Sprint 1 / A1.
# Uso: .\scripts\test\api-sprint1-organizacoes.ps1
#      .\scripts\test\api-sprint1-organizacoes.ps1 -ProvisionDemoIfMissing

param(
    [switch]$ProvisionDemoIfMissing
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite - Sprint 1 Centro de Organizacoes (API)' -ForegroundColor Cyan

$r = Invoke-AerosuiteApi -Method GET -Path '/api/tenants' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET /api/tenants sem JWT (401)' -Passed ($r.StatusCode -eq 401) -Detail "status=$($r.StatusCode)"))

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
}
$adminToken = $null
if ($login.Ok -and $login.Body.token) { $adminToken = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma (admin)' -Passed ([bool]$adminToken)))

if ($adminToken) {
    $r = Invoke-AerosuiteApi -Method GET -Path '/api/tenants' -ApiBaseUrl $cfg.ApiBaseUrl -Token $adminToken
    $count = 0
    if ($r.Ok -and $r.Body) {
        if ($r.Body.items) { $count = @($r.Body.items).Count }
        elseif ($r.Body -is [System.Array]) { $count = $r.Body.Count }
    }
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/tenants com admin (2xx + lista)' -Passed ($r.Ok -and $count -ge 1) -Detail "orgs=$count status=$($r.StatusCode)"))

    $r = Invoke-AerosuiteApi -Method GET -Path '/api/tenants/check-codigo?codigo=default' -ApiBaseUrl $cfg.ApiBaseUrl -Token $adminToken
    $avail = $null
    if ($r.Ok -and $r.Body -and $null -ne $r.Body.available) { $avail = [bool]$r.Body.available }
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/tenants/check-codigo (default indisponivel)' -Passed ($r.Ok -and $avail -eq $false) -Detail "available=$avail status=$($r.StatusCode)"))

    $probeCodigo = "s1-probe-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $r = Invoke-AerosuiteApi -Method GET -Path "/api/tenants/check-codigo?codigo=$probeCodigo" -ApiBaseUrl $cfg.ApiBaseUrl -Token $adminToken
    $availNew = $null
    if ($r.Ok -and $r.Body -and $null -ne $r.Body.available) { $availNew = [bool]$r.Body.available }
    $results.Add((New-AerosuiteTestResult -Name 'GET check-codigo codigo livre (available=true)' -Passed ($r.Ok -and $availNew -eq $true) -Detail "codigo=$probeCodigo"))
}

if ($ProvisionDemoIfMissing) {
    & (Join-Path $here 'provision-tenant-demo.ps1')
    if ($LASTEXITCODE -ne 0) {
        Write-AerosuiteTestSummary -Results $results | Out-Null
        exit 1
    }
}

$demoEmail = $env:AEROSUITE_DEMO_EMAIL
$demoPass = $env:AEROSUITE_DEMO_PASSWORD
$demoTenant = $(if ($env:AEROSUITE_DEMO_TENANT) { $env:AEROSUITE_DEMO_TENANT } else { 'demo' })
if ($demoEmail -and $demoPass) {
    $demoLogin = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        email = $demoEmail; password = $demoPass; tenantCodigo = $demoTenant
    }
    if ($demoLogin.Ok -and $demoLogin.Body.token) {
        $demoToken = [string]$demoLogin.Body.token
        $r = Invoke-AerosuiteApi -Method GET -Path '/api/tenants' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken
        $results.Add((New-AerosuiteTestResult -Name 'GET /api/tenants com JWT demo (403)' -Passed ($r.StatusCode -eq 403) -Detail "status=$($r.StatusCode)"))
    }
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
