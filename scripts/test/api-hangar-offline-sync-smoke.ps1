# P2 — smoke API do fluxo que o hangar offline sincroniza (apontamento + leitura job-card).
# Uso: .\scripts\test\api-hangar-offline-sync-smoke.ps1

param(
    [string]$ApiBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig @PSBoundParameters
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite — smoke hangar offline sync (API)' -ForegroundColor Cyan

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body (New-AerosuiteLoginBody -Email $cfg.Email -Password $cfg.Password -TenantCodigo $cfg.TenantCodigo)
$token = $null
if ($login.Ok -and $login.Body.token) { $token = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma' -Passed ([bool]$token)))

if (-not $token) {
    Write-AerosuiteTestSummary -Results $results | Out-Null
    exit 1
}

$list = Invoke-AerosuiteApi -Method GET -Path '/api/os/job-card/abertas?limite=5' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$itens = @()
if ($list.Ok -and $list.Body.itens) { $itens = @($list.Body.itens) }
$listOk = $itens.Count -gt 0
if (-not $listOk) {
    $results.Add((New-AerosuiteTestResult -Name 'OS aberta para job-card' -Passed $false -Detail 'Nenhuma OS aberta'))
    Write-AerosuiteTestSummary -Results $results | Out-Null
    exit 1
}
$osId = [long]$itens[0].osId
$results.Add((New-AerosuiteTestResult -Name 'Listar OS abertas hangar' -Passed $true -Detail "osId=$osId"))

$body = @{
    trabalhoEm             = (Get-Date).ToString('yyyy-MM-dd')
    horas                  = 0.25
    descricao              = 'Smoke offline sync API'
    ferramentaIdentificador = 'SMOKE-TOOL-01'
}

$ap = Invoke-AerosuiteApi -Method POST -Path "/api/os/job-card/$osId/apontamentos" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body $body
$apOk = $ap.Ok -and $ap.Body -and $ap.Body.id
$results.Add((New-AerosuiteTestResult -Name 'POST apontamento (fila offline)' -Passed $apOk -Detail $(if ($apOk) { "id=$($ap.Body.id)" } else { "status=$($ap.StatusCode)" })))

$get = Invoke-AerosuiteApi -Method GET -Path "/api/os/job-card/$osId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$count = 0
if ($get.Ok -and $get.Body.apontamentos) { $count = @($get.Body.apontamentos).Count }
$getOk = $get.Ok -and $count -ge 1
$results.Add((New-AerosuiteTestResult -Name 'GET job-card pós-sync' -Passed $getOk -Detail "apontamentos=$count"))

Write-AerosuiteTestSummary -Results $results | Out-Null
if ($results | Where-Object { -not $_.Passed }) { exit 1 }
