# Smoke P1: LGPD público, signup trial (opcional), billing/LGPD autenticados.
param([switch]$SkipSignup)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite - P1 smoke' -ForegroundColor Cyan

$r = Invoke-AerosuiteApi -Method GET -Path '/api/public/lgpd/termos' -ApiBaseUrl $cfg.ApiBaseUrl
$ok = $r.Ok -and $r.Body -and $r.Body.versao
$results.Add((New-AerosuiteTestResult -Name 'GET /api/public/lgpd/termos' -Passed $ok -Detail "status=$($r.StatusCode)"))

$r = Invoke-AerosuiteApi -Method GET -Path '/api/public/lgpd/privacidade' -ApiBaseUrl $cfg.ApiBaseUrl
$ok = $r.Ok -and $r.Body -and $r.Body.versao
$results.Add((New-AerosuiteTestResult -Name 'GET /api/public/lgpd/privacidade' -Passed $ok -Detail "status=$($r.StatusCode)"))

$tenantQ = $(if ($env:AEROSUITE_DEMO_TENANT) { $env:AEROSUITE_DEMO_TENANT } else { 'default' })
$r = Invoke-AerosuiteApi -Method GET -Path "/api/public/lgpd/termos?tenant=$tenantQ" -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET /api/public/lgpd/termos?tenant' -Passed ($r.Ok -and $r.Body.versao) -Detail "tenant=$tenantQ"))

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
}
$token = $null
if ($login.Ok -and $login.Body.token) { $token = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma' -Passed ([bool]$token)))

if ($token) {
    $r = Invoke-AerosuiteApi -Method GET -Path '/api/lgpd/status' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/lgpd/status' -Passed $r.Ok -Detail "status=$($r.StatusCode)"))

    $r = Invoke-AerosuiteApi -Method GET -Path '/api/billing/status' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/billing/status' -Passed $r.Ok -Detail "status=$($r.StatusCode) plancode=$($r.Body.planoCodigo)"))

    if ($login.Body.user -and $login.Body.user.lgpdAceitePendente -eq $true) {
        $aceite = @{
            aceito = $true
            versaoTermos = '2026-05-1'
            versaoPrivacidade = '2026-05-1'
        }
        $r = Invoke-AerosuiteApi -Method POST -Path '/api/lgpd/aceite' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body $aceite
        $results.Add((New-AerosuiteTestResult -Name 'POST /api/lgpd/aceite' -Passed ($r.StatusCode -eq 200 -or $r.Ok) -Detail "status=$($r.StatusCode)"))
    } else {
        $results.Add((New-AerosuiteTestResult -Name 'POST /api/lgpd/aceite (skip)' -Passed $true -Detail 'ja aceite'))
    }
}

if (-not $SkipSignup) {
    $codigo = "p1-smoke-$([guid]::NewGuid().ToString('N').Substring(0,8))"
    $signup = Invoke-AerosuiteApi -Method POST -Path '/api/public/signup/trial' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        codigo = $codigo
        nome = 'Org P1 Smoke'
        adminEmail = "$codigo@smoke.local"
        adminNome = 'Admin Smoke'
        adminSenha = 'SmokeTest123!'
        modulosHabilitados = @('MRO', 'ESTOQUE')
        aceitoTermos = $true
        versaoTermos = '2026-05-1'
        versaoPrivacidade = '2026-05-1'
    }
    $results.Add((New-AerosuiteTestResult -Name 'POST /api/public/signup/trial' -Passed ($signup.StatusCode -eq 201) -Detail "status=$($signup.StatusCode) codigo=$codigo"))
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
