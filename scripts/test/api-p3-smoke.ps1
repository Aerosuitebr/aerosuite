# Smoke P3: Bling contatos, LGPD tenant, empresa-asset logo, billing Pagarme (contrato), sistema-empresa LGPD.
param(
    [switch]$ProvisionDemoIfMissing
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite - P3 smoke' -ForegroundColor Cyan

if ($ProvisionDemoIfMissing) {
    & (Join-Path $here 'provision-tenant-demo.ps1')
}

# LGPD público com tenant
$demoTenant = $(if ($env:AEROSUITE_DEMO_TENANT) { $env:AEROSUITE_DEMO_TENANT } else { 'demo' })
$r = Invoke-AerosuiteApi -Method GET -Path "/api/public/lgpd/termos?tenant=$demoTenant" -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET /api/public/lgpd/termos?tenant' -Passed ($r.Ok -and $r.Body.versao) -Detail "tenant=$demoTenant"))

$r = Invoke-AerosuiteApi -Method GET -Path "/api/public/lgpd/privacidade?tenant=$demoTenant" -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET /api/public/lgpd/privacidade?tenant' -Passed ($r.Ok -and $r.Body.versao) -Detail "tenant=$demoTenant"))

# Logo público por tenant (404 aceitável se sem upload)
$r = Invoke-AerosuiteApi -Method GET -Path "/api/public/empresa-asset/$demoTenant/logo" -ApiBaseUrl $cfg.ApiBaseUrl
$logoOk = $r.StatusCode -eq 200 -or $r.StatusCode -eq 404
$results.Add((New-AerosuiteTestResult -Name 'GET /api/public/empresa-asset/{tenant}/logo' -Passed $logoOk -Detail "status=$($r.StatusCode)"))

# Bling contatos exige auth
$r = Invoke-AerosuiteApi -Method GET -Path '/api/integracoes/bling/contatos?pesquisa=acme&limit=5' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET bling/contatos sem token (401/403)' -Passed ($r.StatusCode -eq 401 -or $r.StatusCode -eq 403) -Detail "status=$($r.StatusCode)"))

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
}
$token = $null
if ($login.Ok -and $login.Body.token) { $token = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma' -Passed ([bool]$token)))

$demoEmail = $env:AEROSUITE_DEMO_EMAIL
$demoPass = $env:AEROSUITE_DEMO_PASSWORD
$demoToken = $null
if ($demoEmail -and $demoPass) {
    $demoLogin = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        email = $demoEmail; password = $demoPass; tenantCodigo = $demoTenant
    }
    if ($demoLogin.Ok -and $demoLogin.Body.token) { $demoToken = [string]$demoLogin.Body.token }
}

if ($demoToken) {
    $r = Invoke-AerosuiteApi -Method GET -Path '/api/integracoes/bling/contatos?pesquisa=aa&limit=5' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken
    $blingOk = $r.Ok -and $null -ne $r.Body -and ($null -ne $r.Body.items -or $r.Body.PSObject.Properties.Name -contains 'items')
    $itemCount = if ($r.Body.items) { @($r.Body.items).Count } else { 0 }
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/integracoes/bling/contatos (demo)' -Passed $blingOk -Detail "status=$($r.StatusCode) enabled=$($r.Body.enabled) items=$itemCount"))

    $r = Invoke-AerosuiteApi -Method GET -Path '/api/sistema-empresa/config' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken
    $cfgOk = $r.Ok -and ($r.Body.PSObject.Properties.Name -contains 'lgpdTextosCustomizados')
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/sistema-empresa/config LGPD (demo)' -Passed $cfgOk -Detail "status=$($r.StatusCode)"))

    $r = Invoke-AerosuiteApi -Method GET -Path '/api/billing/status' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken
    $results.Add((New-AerosuiteTestResult -Name 'GET billing/status (demo)' -Passed $r.Ok -Detail "provedor=$($r.Body.provedor)"))

    # Pagarme: em dev normalmente mock/stripe — checkout mock deve 200; se provedor pagarme sem impl, 400 esperado
    $r = Invoke-AerosuiteApi -Method POST -Path '/api/billing/checkout-session' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken -Body @{}
    $checkoutOk = ($r.Ok -and $r.Body.checkoutUrl) -or ($r.StatusCode -eq 400 -and $r.Raw -match 'preparação|Pagar.me')
    $results.Add((New-AerosuiteTestResult -Name 'POST billing/checkout-session (demo)' -Passed $checkoutOk -Detail "status=$($r.StatusCode)"))
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
