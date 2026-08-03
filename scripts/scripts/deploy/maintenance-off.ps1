# Desativa a manutencao e sobe o frontend normal na porta 8081.
# Uso: scripts\deploy\maintenance-off.cmd

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot '_docker-compose.ps1')

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')

Push-Location $root
try {
    Write-Host 'Aero Suite - desativando manutencao' -ForegroundColor Cyan
    Assert-DockerRunning

    Stop-AeroMaintenancePage

    $upCode = Invoke-AeroDockerComposeUp -Service web
    if ($upCode -ne 0) {
        Write-Host "ERRO: nao foi possivel subir o frontend (codigo $upCode)" -ForegroundColor Red
        Complete-AeroDeployScript 1
    }

    Start-Sleep -Seconds 2
    if (Test-WebEndpoint -ExpectedStatus @(200)) {
        Write-Host 'OK: frontend ativo em http://127.0.0.1:8081' -ForegroundColor Green
    } else {
        Write-Host 'AVISO: frontend iniciado; aguarde alguns segundos e teste http://127.0.0.1:8081' -ForegroundColor Yellow
    }
    Complete-AeroDeployScript 0
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Complete-AeroDeployScript 1
} finally {
    Pop-Location
}
