# Script de Visualização de Logs - Windows PowerShell
# Aero Suite Aeronáutica - Ambiente de Produção

param(
    [string]$service = "all",
    [int]$lines = 50
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location $rootPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Logs do Sistema" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($service -eq "backend" -or $service -eq "all") {
    if (Test-Path "logs\backend.log") {
        Write-Host "Backend Log (últimas $lines linhas):" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Get-Content "logs\backend.log" -Tail $lines
        Write-Host ""
    } else {
        Write-Host "Backend log não encontrado" -ForegroundColor Red
    }
    
    if (Test-Path "logs\backend-error.log") {
        Write-Host "Backend Error Log (últimas $lines linhas):" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Get-Content "logs\backend-error.log" -Tail $lines
        Write-Host ""
    }
}

if ($service -eq "nginx" -or $service -eq "all") {
    $nginxLogPath = "logs\nginx-access.log"
    if (Test-Path $nginxLogPath) {
        Write-Host "Nginx Access Log (últimas $lines linhas):" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Get-Content $nginxLogPath -Tail $lines
        Write-Host ""
    }
    
    $nginxErrorLogPath = "logs\nginx-error.log"
    if (Test-Path $nginxErrorLogPath) {
        Write-Host "Nginx Error Log (últimas $lines linhas):" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Get-Content $nginxErrorLogPath -Tail $lines
        Write-Host ""
    }
}

Write-Host "Uso: .\scripts\logs.ps1 [backend|nginx|all] [linhas]" -ForegroundColor Gray
Write-Host ""

