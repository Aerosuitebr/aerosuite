# Script de Build do Frontend - Windows PowerShell
# Aero Suite Aeronáutica - Ambiente de Produção

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build do Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent (Split-Path -Parent $scriptPath)
$frontendPath = Join-Path $rootPath "frontend"

if (-not (Test-Path $frontendPath)) {
    Write-Host "✗ Diretório frontend não encontrado em $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host "Navegando para: $frontendPath" -ForegroundColor Gray
Set-Location $frontendPath

Write-Host "Instalando dependências..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

Write-Host "Executando build de produção..." -ForegroundColor Green
npm run build:prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Erro ao fazer build" -ForegroundColor Red
    exit 1
}

Write-Host "Copiando arquivos para producao/frontend..." -ForegroundColor Green
$distPath = Join-Path $frontendPath "dist\aerosuite-frontend"
$prodFrontendPath = Join-Path (Split-Path -Parent $scriptPath) "..\producao\frontend"

if (Test-Path $prodFrontendPath) {
    Remove-Item $prodFrontendPath -Recurse -Force
}
New-Item -ItemType Directory -Path $prodFrontendPath -Force | Out-Null

Copy-Item "$distPath\*" $prodFrontendPath -Recurse -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Build concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Arquivos copiados para: $prodFrontendPath" -ForegroundColor Yellow
Write-Host ""

