# Ativa a pagina de manutencao na porta 8081 (Cloudflare Tunnel continua a responder).
# Uso: scripts\deploy\maintenance-on.cmd

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot '_docker-compose.ps1')

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')

Push-Location $root
try {
    Write-Host 'Aero Suite - ativando manutencao em :8081' -ForegroundColor Cyan
    Assert-DockerRunning
    Start-AeroMaintenancePage
    Write-Host 'Para voltar: scripts\deploy\maintenance-off.cmd' -ForegroundColor DarkGray
    Complete-AeroDeployScript 0
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Complete-AeroDeployScript 1
} finally {
    Pop-Location
}
