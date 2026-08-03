# Script de Parada - Windows PowerShell
# Aero Suite Aeronáutica - Ambiente de Produção

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Parando Aero Suite Aeronáutica" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Parar Backend
Write-Host "Parando Backend..." -ForegroundColor Green
$backendProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*aerosuite*" -or 
    (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -like "*aerosuite*"
}

if ($backendProcesses) {
    foreach ($process in $backendProcesses) {
        Write-Host "  Parando processo (PID: $($process.Id))..." -ForegroundColor Gray
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✓ Backend parado" -ForegroundColor Green
} else {
    Write-Host "  Backend não está em execução" -ForegroundColor Gray
}

# Parar Nginx
Write-Host "Parando Nginx..." -ForegroundColor Green
$nginxProcesses = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
if ($nginxProcesses) {
    foreach ($process in $nginxProcesses) {
        Write-Host "  Parando processo (PID: $($process.Id))..." -ForegroundColor Gray
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "✓ Nginx parado" -ForegroundColor Green
} else {
    Write-Host "  Nginx não está em execução" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sistema parado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

