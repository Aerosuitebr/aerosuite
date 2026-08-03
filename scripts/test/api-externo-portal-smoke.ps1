# Smoke portal externo P4.2 — auth propostas + login opcional.
param(
    [switch]$ProvisionDemoIfMissing
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite - externo portal smoke (P4.2)' -ForegroundColor Cyan

if ($ProvisionDemoIfMissing) {
    & (Join-Path $here 'provision-tenant-demo.ps1')
}

$r = Invoke-AerosuiteApi -Method GET -Path '/api/auth-externo/me/1/propostas' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET propostas externo sem JWT (401)' -Passed ($r.StatusCode -eq 401) -Detail "status=$($r.StatusCode)"))

$extToken = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("EXT:1:portal-smoke@local:$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"))
$r = Invoke-AerosuiteApi -Method GET -Path '/api/auth-externo/me/2/propostas' -ApiBaseUrl $cfg.ApiBaseUrl -Token $extToken
$results.Add((New-AerosuiteTestResult -Name 'GET propostas outro usuario com token EXT (403)' -Passed ($r.StatusCode -eq 403) -Detail "status=$($r.StatusCode)"))

$extEmail = $env:AEROSUITE_EXTERNO_EMAIL
$extPass = $env:AEROSUITE_EXTERNO_PASSWORD
$extTenant = $(if ($env:AEROSUITE_EXTERNO_TENANT) { $env:AEROSUITE_EXTERNO_TENANT } else { $cfg.TenantCodigo })

if ($extEmail -and $extPass) {
    $login = Invoke-AerosuiteApi -Method POST -Path '/api/auth-externo/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        email = $extEmail; password = $extPass; tenantCodigo = $extTenant
    }
    $extUserToken = $null
    $extUserId = $null
    if ($login.Ok -and $login.Body.token) {
        $extUserToken = [string]$login.Body.token
        if ($login.Body.user) { $extUserId = [int]$login.Body.user.id }
    }
    $results.Add((New-AerosuiteTestResult -Name 'Login portal externo' -Passed ([bool]$extUserToken) -Detail $(if ($extUserId) { "userId=$extUserId" } else { 'sem user id' })))

    if ($extUserToken -and $extUserId) {
        $r = Invoke-AerosuiteApi -Method GET -Path "/api/auth-externo/me/$extUserId/propostas" -ApiBaseUrl $cfg.ApiBaseUrl -Token $extUserToken
        $listOk = $r.Ok -and ($null -ne $r.Body)
        $count = 0
        if ($r.Body -is [System.Array]) { $count = $r.Body.Count }
        $results.Add((New-AerosuiteTestResult -Name 'GET /auth-externo/me/{id}/propostas' -Passed $listOk -Detail "count=$count"))

        $r = Invoke-AerosuiteApi -Method GET -Path "/api/auth-externo/me/$extUserId/os" -ApiBaseUrl $cfg.ApiBaseUrl -Token $extUserToken
        $osOk = $r.Ok -and ($null -ne $r.Body)
        $osCount = 0
        if ($r.Body -is [System.Array]) { $osCount = $r.Body.Count }
        $results.Add((New-AerosuiteTestResult -Name 'GET /auth-externo/me/{id}/os' -Passed $osOk -Detail "count=$osCount"))

        if ($osCount -gt 0) {
            $firstOsId = [long]$r.Body[0].id
            $r = Invoke-AerosuiteApi -Method GET -Path "/api/auth-externo/me/$extUserId/os/$firstOsId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $extUserToken
            $detailOk = $r.Ok -and ($null -ne $r.Body.id)
            $propLink = $r.Body.propostaId
            $results.Add((New-AerosuiteTestResult -Name 'GET /auth-externo/me/{id}/os/{osId} (detalhe + propostaId)' -Passed $detailOk -Detail "osId=$firstOsId propostaId=$propLink"))
        }
    }
} else {
    Write-Host 'Sem AEROSUITE_EXTERNO_* — testes de login externo ignorados.' -ForegroundColor DarkYellow
    $results.Add((New-AerosuiteTestResult -Name 'Login portal externo (opcional)' -Passed $true -Detail 'defina AEROSUITE_EXTERNO_EMAIL/PASSWORD para teste completo'))
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
