# Stress / carga concorrente na API (login + meu-menu + auth/me).
# Uso: .\scripts\test\api-stress.ps1 -Workers 25 -Rounds 40
# Saída: taxa de sucesso, latência média e p95; exit 1 se taxa < MinSuccessRate.

param(
    [int]$Workers = 20,
    [int]$Rounds = 30,
    [double]$MinSuccessRate = 0.98,
    [int]$TimeoutSec = 60,
    [string]$ApiBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig @PSBoundParameters
$loginBody = @{ email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo } | ConvertTo-Json -Compress

Write-Host 'Aero Suite - stress API' -ForegroundColor Cyan
Write-Host "Workers=$Workers Rounds=$Rounds MinSuccess=$MinSuccessRate API=$($cfg.ApiBaseUrl)" -ForegroundColor DarkGray

# Token partilhado (stress de leitura autenticada, não só login)
$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body $loginBody
if (-not $login.Ok -or -not $login.Body.token) {
    Write-Host "Falha no login inicial: status=$($login.StatusCode) $($login.Raw)" -ForegroundColor Red
    exit 1
}
$token = [string]$login.Body.token
Write-Host "Login OK ($($login.ElapsedMs) ms). Iniciando $($Workers * $Rounds) pedidos..." -ForegroundColor DarkGray

$helperPath = Join-Path $here 'Test-ApiHelpers.ps1'
$scriptBlock = {
    param($HelperPath, $ApiBase, $Token, $Rounds, $Timeout)
    . $HelperPath
    $paths = @(
        '/api/funcionalidades/meu-menu',
        '/api/auth/me',
        '/api/integracoes/bling/status',
        '/api/billing/status',
        '/api/sistema-empresa/status'
    )
    $latencies = [System.Collections.Generic.List[int]]::new()
    $errors = 0
    $ok = 0
    for ($i = 0; $i -lt $Rounds; $i++) {
        $path = $paths[$i % $paths.Count]
        $r = Invoke-AerosuiteApi -Method GET -Path $path -ApiBaseUrl $ApiBase -Token $Token -TimeoutSec $Timeout
        if ($r.Ok -and $r.StatusCode -ge 200 -and $r.StatusCode -lt 300) {
            $ok++
            [void]$latencies.Add([int]$r.ElapsedMs)
        } else {
            $errors++
        }
    }
    [pscustomobject]@{ Ok = $ok; Errors = $errors; Latencies = $latencies }
}

$jobs = @()
for ($w = 0; $w -lt $Workers; $w++) {
    $jobs += Start-Job -ScriptBlock $scriptBlock -ArgumentList $helperPath, $cfg.ApiBaseUrl, $token, $Rounds, $TimeoutSec
}

$completed = $jobs | Wait-Job -Timeout ($TimeoutSec * $Rounds + 120)
if ($completed.Count -lt $jobs.Count) {
    $jobs | Where-Object { $_.State -eq 'Running' } | Stop-Job -PassThru | Remove-Job -Force
    Write-Host "Timeout: nem todos os workers terminaram." -ForegroundColor Red
    exit 1
}

$allLatencies = [System.Collections.Generic.List[int]]::new()
$totalOk = 0
$totalErr = 0
foreach ($j in $jobs) {
    $out = Receive-Job $j
    Remove-Job $j -Force
    $totalOk += $out.Ok
    $totalErr += $out.Errors
    foreach ($ms in $out.Latencies) { [void]$allLatencies.Add($ms) }
}

$total = $totalOk + $totalErr
$rate = if ($total -gt 0) { $totalOk / $total } else { 0 }
$sorted = $allLatencies | Sort-Object
$p50 = if ($sorted.Count -gt 0) { $sorted[[int][Math]::Floor($sorted.Count * 0.50)] } else { 0 }
$p95 = if ($sorted.Count -gt 0) { $sorted[[int][Math]::Min($sorted.Count - 1, [int][Math]::Floor($sorted.Count * 0.95))] } else { 0 }
$avg = if ($sorted.Count -gt 0) { [int](($sorted | Measure-Object -Average).Average) } else { 0 }

Write-Host ''
Write-Host ("Pedidos: {0} ; OK: {1} ; Erros: {2} ; Taxa: {3}%" -f $total, $totalOk, $totalErr, [math]::Round(100 * $rate, 2)) -ForegroundColor $(if ($rate -ge $MinSuccessRate) { 'Green' } else { 'Red' })
Write-Host "Latência (ms): média=$avg p50=$p50 p95=$p95 max=$(if ($sorted.Count) { $sorted[-1] } else { 0 })" -ForegroundColor Cyan

if ($rate -lt $MinSuccessRate) {
    Write-Host "Falhou: taxa abaixo de $([math]::Round(100 * $MinSuccessRate, 0))%" -ForegroundColor Red
    exit 1
}
exit 0
