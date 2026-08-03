# Smoke estoque — invoice: listagem, validação de inativação e auditoria (V43).
param()

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite - estoque invoice smoke' -ForegroundColor Cyan

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
}
$token = $null
if ($login.Ok -and $login.Body.token) { $token = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma' -Passed ([bool]$token)))

if (-not $token) {
    Write-AerosuiteTestSummary -Results $results | Out-Null
    exit 1
}

$base = '/api/estoque'

$r = Invoke-AerosuiteApi -Method GET -Path "$base/invoices?size=5" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$listOk = $r.Ok -and $null -ne $r.Body.content
$invoiceId = $null
if ($listOk -and $r.Body.content.Count -gt 0) {
    $invoiceId = [long]$r.Body.content[0].id
}
$results.Add((New-AerosuiteTestResult -Name 'GET /api/estoque/invoices' -Passed $listOk -Detail $(if ($invoiceId) { "id=$invoiceId" } else { 'lista vazia' })))

if ($invoiceId) {
    $r = Invoke-AerosuiteApi -Method GET -Path "$base/invoices/$invoiceId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/estoque/invoices/{id}' -Passed ($r.Ok -and $r.Body.id -eq $invoiceId)))

    $r = Invoke-AerosuiteApi -Method GET -Path "$base/invoices/$invoiceId/validacao-inativacao" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $valOk = $r.Ok -and ($null -ne $r.Body.podeInativar) -and ($null -ne $r.Body.bloqueios)
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/estoque/invoices/{id}/validacao-inativacao' -Passed $valOk -Detail "podeInativar=$($r.Body.podeInativar) bloqueios=$($r.Body.bloqueios.Count)"))

    $r = Invoke-AerosuiteApi -Method GET -Path "$base/invoices/$invoiceId/auditoria" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $audOk = $r.Ok -and ($null -ne $r.Body)
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/estoque/invoices/{id}/auditoria' -Passed $audOk -Detail "registros=$($r.Body.Count)"))
} else {
    $results.Add((New-AerosuiteTestResult -Name 'Invoice endpoints (requer invoice no tenant)' -Passed $true -Detail 'skip — cadastre uma invoice para teste completo'))
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
