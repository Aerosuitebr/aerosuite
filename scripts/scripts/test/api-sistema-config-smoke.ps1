# Smoke — GET/PUT /api/sistema-config (V44, admin).
param()

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite - sistema-config smoke' -ForegroundColor Cyan

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

$r = Invoke-AerosuiteApi -Method GET -Path '/api/sistema-config' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$getOk = $r.Ok -and $null -ne $r.Body.valores -and $null -ne $r.Body.avancadas
$results.Add((New-AerosuiteTestResult -Name 'GET /api/sistema-config' -Passed $getOk -Detail "timeout=$($r.Body.valores.timeout_sessao)"))

$putBody = @{
    valores = @{
        nome_sistema = 'AEROSUITE SMOKE'
        timeout_sessao = 45
    }
    avancadas = @{
        logsDetalhados = $false
        backupAutomatico = $true
        notificacoesEmail = $true
    }
}
$r = Invoke-AerosuiteApi -Method PUT -Path '/api/sistema-config' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body $putBody
$putOk = $r.Ok -and $r.Body.valores.nome_sistema -eq 'AEROSUITE SMOKE'
$results.Add((New-AerosuiteTestResult -Name 'PUT /api/sistema-config' -Passed $putOk))

$r = Invoke-AerosuiteApi -Method PUT -Path '/api/sistema-config' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{ restaurarPadroes = $true }
$results.Add((New-AerosuiteTestResult -Name 'PUT /api/sistema-config (restaurar padroes)' -Passed $r.Ok))

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
