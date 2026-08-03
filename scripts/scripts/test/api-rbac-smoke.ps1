# Smoke RBAC servidor (@RequiresFuncionalidades + portal externo /me).
# Uso:
#   .\scripts\test\api-rbac-smoke.ps1
#   .\scripts\test\api-rbac-smoke.ps1 -ProvisionDemoIfMissing

param(
    [switch]$ProvisionDemoIfMissing
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite - RBAC smoke' -ForegroundColor Cyan

if ($ProvisionDemoIfMissing) {
    & (Join-Path $here 'provision-tenant-demo.ps1')
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# Sem JWT
$r = Invoke-AerosuiteApi -Method GET -Path '/api/usuarios-externos?page=0&size=1' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'usuarios-externos sem JWT (401)' -Passed ($r.StatusCode -in 400, 401) -Detail "status=$($r.StatusCode)"))

$r = Invoke-AerosuiteApi -Method GET -Path '/api/auth-externo/me/1' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'auth-externo/me sem JWT (401)' -Passed ($r.StatusCode -in 400, 401) -Detail "status=$($r.StatusCode)"))

# Admin plataforma
$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body (New-AerosuiteLoginBody -Email $cfg.Email -Password $cfg.Password -TenantCodigo $cfg.TenantCodigo)
$adminToken = $null
if ($login.Ok -and $login.Body.token) { $adminToken = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login admin plataforma' -Passed ([bool]$adminToken)))

if ($adminToken) {
    $r = Invoke-AerosuiteApi -Method GET -Path '/api/usuarios-externos?page=0&size=1' -ApiBaseUrl $cfg.ApiBaseUrl -Token $adminToken
    $results.Add((New-AerosuiteTestResult -Name 'usuarios-externos com admin (2xx)' -Passed ($r.Ok) -Detail "status=$($r.StatusCode)"))
}

# Token EXT do utilizador 1 não pode aceder /me/2
$extToken = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('EXT:1:rbac-smoke@local:1'))
$r = Invoke-AerosuiteApi -Method GET -Path '/api/auth-externo/me/2' -ApiBaseUrl $cfg.ApiBaseUrl -Token $extToken
$results.Add((New-AerosuiteTestResult -Name 'auth-externo/me outro id com token EXT (403)' -Passed ($r.StatusCode -eq 403) -Detail "status=$($r.StatusCode)"))

$demoEmail = $env:AEROSUITE_DEMO_EMAIL
$demoPass = $env:AEROSUITE_DEMO_PASSWORD
$demoTenant = $(if ($env:AEROSUITE_DEMO_TENANT) { $env:AEROSUITE_DEMO_TENANT } else { 'demo' })
if ($demoEmail -and $demoPass) {
    $demoLogin = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        email = $demoEmail; password = $demoPass; tenantCodigo = $demoTenant
    }
    $demoToken = $null
    if ($demoLogin.Ok -and $demoLogin.Body.token) { $demoToken = [string]$demoLogin.Body.token }
    if ($demoToken) {
        $r = Invoke-AerosuiteApi -Method POST -Path '/api/tenants' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken -Body @{
            codigo = 'rbac-test-deny'; nome = 'X'; adminEmail = 'x@y.local'; sendWelcomeEmail = $false
        }
        $results.Add((New-AerosuiteTestResult -Name 'POST /api/tenants com JWT demo (403)' -Passed ($r.StatusCode -eq 403) -Detail "status=$($r.StatusCode)"))
    } else {
        Write-Host 'Login demo falhou — testes demo ignorados.' -ForegroundColor DarkYellow
    }
} else {
    Write-Host 'Sem AEROSUITE_DEMO_* — testes 403 demo ignorados (use provision-tenant-demo.ps1).' -ForegroundColor DarkYellow
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
