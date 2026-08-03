# Testes de isolamento multi-tenant (requer tenant "demo" provisionado).
# Uso: .\scripts\test\api-tenant-isolation.ps1
# Credenciais demo: AEROSUITE_DEMO_EMAIL, AEROSUITE_DEMO_PASSWORD (ou provisionar via API).

param(
    [string]$ApiBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo,
    [string]$PlatformEmail,
    [string]$PlatformPassword,
    [string]$DemoEmail = $(if ($env:AEROSUITE_DEMO_EMAIL) { $env:AEROSUITE_DEMO_EMAIL } else { 'admin@demo.local' }),
    [string]$DemoPassword = $(if ($env:AEROSUITE_DEMO_PASSWORD) { $env:AEROSUITE_DEMO_PASSWORD } else { '' }),
    [string]$DemoTenant = 'demo',
    [switch]$ProvisionDemoIfMissing,
    [switch]$ResetDemoPassword
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig @PSBoundParameters
if ($PlatformEmail) { $cfg.Email = $PlatformEmail }
if ($PlatformPassword) { $cfg.Password = $PlatformPassword }

$results = [System.Collections.Generic.List[object]]::new()

function Get-Token {
    param($Email, $Password, $Tenant)
    $body = New-AerosuiteLoginBody -Email $Email -Password $Password -TenantCodigo $Tenant
    $r = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body $body
    if (-not $r.Ok -or -not $r.Body.token) { return $null }
    return [string]$r.Body.token
}

function Get-OsIdList {
    param($ResponseBody)
    if (-not $ResponseBody) { return @() }
    $items = $ResponseBody.items
    if (-not $items) { $items = $ResponseBody.content }
    if (-not $items) { return @() }
    return @($items | ForEach-Object { $_.id } | Where-Object { $null -ne $_ })
}

Write-Host 'Aero Suite - isolamento tenant' -ForegroundColor Cyan

if ($ProvisionDemoIfMissing -and [string]::IsNullOrWhiteSpace($DemoPassword)) {
    $provisionArgs = @{}
    if ($ResetDemoPassword) { $provisionArgs['ResetPasswordIfExists'] = $true }
    & (Join-Path $here 'provision-tenant-demo.ps1') @provisionArgs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    $DemoPassword = $env:AEROSUITE_DEMO_PASSWORD
    if ($env:AEROSUITE_DEMO_EMAIL) { $DemoEmail = $env:AEROSUITE_DEMO_EMAIL }
}

$platformToken = Get-Token -Email $cfg.Email -Password $cfg.Password -Tenant $cfg.TenantCodigo
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma (default)' -Passed ([bool]$platformToken)))

if (-not $platformToken) {
    Write-AerosuiteTestSummary -Results $results | Out-Null
    exit 1
}

$demoToken = $null
if (-not [string]::IsNullOrWhiteSpace($DemoPassword)) {
    $demoToken = Get-Token -Email $DemoEmail -Password $DemoPassword -Tenant $DemoTenant
}
$demoLoginRequired = -not [string]::IsNullOrWhiteSpace($DemoPassword) -or $ProvisionDemoIfMissing
$results.Add((New-AerosuiteTestResult -Name "Login tenant $DemoTenant" -Passed ((-not $demoLoginRequired) -or [bool]$demoToken) -Detail $(if (-not $demoToken -and $demoLoginRequired) { 'Defina credenciais demo ou execute POST /api/tenants' } elseif (-not $demoToken) { 'SKIP (sem AEROSUITE_DEMO_PASSWORD)' } else { 'OK' })))

if ($demoToken) {
    $r1 = Invoke-AerosuiteApi -Method GET -Path '/api/os?page=0&size=5' -ApiBaseUrl $cfg.ApiBaseUrl -Token $platformToken
    $r2 = Invoke-AerosuiteApi -Method GET -Path '/api/os?page=0&size=5' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken
    $ids1 = Get-OsIdList -ResponseBody $r1.Body
    $ids2 = Get-OsIdList -ResponseBody $r2.Body
    $overlap = @($ids1 | Where-Object { $_ -in $ids2 })
    $results.Add((New-AerosuiteTestResult -Name 'Listagens /api/os sem IDs partilhados entre tenants' -Passed ($overlap.Count -eq 0) -Detail "default=$($ids1.Count) demo=$($ids2.Count) overlap=$($overlap.Count)"))

    if ($ids1.Count -gt 0) {
        $foreignId = $ids1[0]
        $r = Invoke-AerosuiteApi -Method GET -Path "/api/os/$foreignId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken
        $results.Add((New-AerosuiteTestResult -Name 'GET /api/os/{id} de outro tenant (404)' -Passed ($r.StatusCode -eq 404) -Detail "status=$($r.StatusCode) id=$foreignId"))
    } else {
        $results.Add((New-AerosuiteTestResult -Name 'GET /api/os/{id} cross-tenant (skip)' -Passed $true -Detail 'Sem OS no tenant default para cruzar'))
    }
    # Sprint1 #8: tenant demo nao pode provisionar organizacoes
    $createBody = @{
        codigo = 'nao-deve-criar'
        nome = 'Teste'
        adminEmail = 'x@y.local'
        sendWelcomeEmail = $false
    }
    $deny = Invoke-AerosuiteApi -Method POST -Path '/api/tenants' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken -Body $createBody
    $results.Add((New-AerosuiteTestResult -Name 'POST /api/tenants com JWT demo (403)' -Passed ($deny.StatusCode -eq 403) -Detail "status=$($deny.StatusCode)"))
} else {
    Write-Host 'Testes cross-tenant ignorados (sem login demo).' -ForegroundColor DarkYellow
}

# Sprint1 #5–6: login/forgot sem tenant quando email exige escolha (opcional)
$multiEmail = $env:AEROSUITE_TEST_MULTI_TENANT_EMAIL
if ($multiEmail) {
    $noTenant = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        email = $multiEmail; password = $env:AEROSUITE_TEST_MULTI_TENANT_PASSWORD
    }
    $code = $null
    if ($noTenant.Body -and $noTenant.Body.code) { $code = $noTenant.Body.code }
    $results.Add((New-AerosuiteTestResult -Name 'Login sem tenant -> TENANT_REQUIRED' -Passed (
            $noTenant.StatusCode -eq 401 -and $code -eq 'TENANT_REQUIRED'
        ) -Detail "status=$($noTenant.StatusCode) code=$code"))

    $forgotNoTenant = Invoke-AerosuiteApi -Method POST -Path '/api/auth/forgot-password' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        email = $multiEmail
    }
    $forgotCode = $null
    if ($forgotNoTenant.Body -and $forgotNoTenant.Body.code) { $forgotCode = $forgotNoTenant.Body.code }
    $results.Add((New-AerosuiteTestResult -Name 'Forgot-password sem tenant -> TENANT_REQUIRED' -Passed (
            $forgotNoTenant.StatusCode -eq 400 -and $forgotCode -eq 'TENANT_REQUIRED'
        ) -Detail "status=$($forgotNoTenant.StatusCode) code=$forgotCode"))
} else {
    Write-Host 'Cenarios 5-6 ignorados (defina AEROSUITE_TEST_MULTI_TENANT_EMAIL ou execute provision-multi-tenant-login-test.ps1).' -ForegroundColor DarkYellow
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
