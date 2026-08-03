# Sobe stack local com Evolution API e executa E2E API WhatsApp.
#Requires -Version 5.1
param(
    [switch]$WithLocalMysql,
    [switch]$SkipE2e
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== Aero Suite — stack local + Evolution ===" -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $root '.env'))) {
    Copy-Item (Join-Path $root '.env.example') (Join-Path $root '.env')
    Write-Host "Criado .env a partir de .env.example" -ForegroundColor Yellow
}

$composeArgs = @('compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.evolution.yml')
if ($WithLocalMysql) {
    $composeArgs += '-f', 'docker-compose.local-mysql.yml'
}

Write-Host "docker $($composeArgs -join ' ') up -d --build" -ForegroundColor DarkCyan
& docker @composeArgs up -d --build
if ($LASTEXITCODE -ne 0) { throw 'docker compose falhou' }

if ($SkipE2e) {
    Write-Host "Stack no ar. API: http://localhost:8080  Web: http://localhost:8081  Evolution: http://localhost:18082" -ForegroundColor Green
    exit 0
}

& (Join-Path $root 'scripts\test\api-whatsapp-e2e.ps1')
exit $LASTEXITCODE
