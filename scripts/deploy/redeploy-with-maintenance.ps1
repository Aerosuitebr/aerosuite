# Deploy com pagina de manutencao durante o rebuild (evita erro generico do Cloudflare).
# Uso: .\scripts\deploy\redeploy-with-maintenance.ps1
#      .\scripts\deploy\redeploy-with-maintenance.ps1 -SkipBuild
# Duplo clique: scripts\deploy\redeploy-with-maintenance.cmd ou deploy.bat

param([switch]$SkipBuild)

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot '_docker-compose.ps1')

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')

Push-Location $root
try {
    Write-Host 'Aero Suite - deploy com manutencao' -ForegroundColor Cyan
    Assert-DockerRunning

    Write-Host '1/4 Ativando pagina de manutencao...' -ForegroundColor DarkGray
    Start-AeroMaintenancePage

    if ($SkipBuild) {
        Write-Host '2/4 Reiniciando API (sem rebuild)...' -ForegroundColor DarkGray
        $apiCode = Invoke-AeroDockerComposeUp -Service api
    } else {
        Write-Host '2/4 Rebuild da API e do frontend (manutencao continua em :8081)...' -ForegroundColor DarkGray
        Write-Host '     (pode levar varios minutos - nao feche esta janela)' -ForegroundColor DarkGray
        $buildCode = Invoke-AeroDockerComposeRaw -ComposeArgs @('build', 'api', 'web')
        if ($buildCode -ne 0) {
            Write-Host "ERRO: falha no docker compose build (codigo $buildCode)" -ForegroundColor Red
            Write-Host 'A manutencao continua ativa em :8081. Corrija o erro e rode maintenance-off.cmd quando terminar.' -ForegroundColor Yellow
            Complete-AeroDeployScript 1
        }
        Write-Host '     Build concluido.' -ForegroundColor DarkGray
        $apiCode = Invoke-AeroDockerComposeUp -Service api
    }

    if ($apiCode -ne 0) {
        Write-Host "ERRO: falha ao subir a API (codigo $apiCode)" -ForegroundColor Red
        Complete-AeroDeployScript 1
    }

    Write-Host '3/4 Troca rapida: manutencao -> frontend...' -ForegroundColor DarkGray
    Stop-AeroMaintenancePage

    if (-not (Wait-TcpPortFree -Port 8081 -TimeoutSec 10)) {
        Write-Host 'AVISO: porta 8081 ainda ocupada; tentando subir frontend mesmo assim...' -ForegroundColor Yellow
    }

    $webCode = Invoke-AeroDockerComposeUp -Service web
    if ($webCode -ne 0) {
        Write-Host "ERRO: falha ao subir o frontend (codigo $webCode)" -ForegroundColor Red
        Write-Host 'Tente: scripts\deploy\maintenance-off.cmd' -ForegroundColor Yellow
        Complete-AeroDeployScript 1
    }

    Write-Host '4/4 Aguardando frontend...' -ForegroundColor DarkGray
    $ready = $false
    for ($i = 0; $i -lt 24; $i++) {
        if (Test-WebEndpoint -ExpectedStatus @(200)) {
            $ready = $true
            break
        }
        Write-Host "     tentativa $($i + 1)/24..." -ForegroundColor DarkGray
        Start-Sleep -Seconds 5
    }

    if ($ready) {
        Write-Host 'Deploy concluido - aplicacao disponivel em http://127.0.0.1:8081' -ForegroundColor Green
        Complete-AeroDeployScript 0
    } else {
        Write-Host 'AVISO: frontend ainda nao respondeu; verifique: docker logs aerosuite-frontend' -ForegroundColor Yellow
        Complete-AeroDeployScript 1
    }
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Complete-AeroDeployScript 1
} finally {
    Pop-Location
}
