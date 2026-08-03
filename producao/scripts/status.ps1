# Script de Status - Windows PowerShell
# Aero Suite Aeronáutica - Ambiente de Produção

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Status do Sistema" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Backend
Write-Host "Backend:" -ForegroundColor Yellow
$backendProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { 
    (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -like "*aerosuite*" -or
    (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -like "*jar*"
}

if ($backendProcesses) {
    foreach ($process in $backendProcesses) {
        $cpu = [math]::Round($process.CPU, 2)
        $memory = [math]::Round($process.WorkingSet64 / 1MB, 2)
        Write-Host "  ✓ Rodando (PID: $($process.Id), CPU: ${cpu}s, Memória: ${memory}MB)" -ForegroundColor Green
        
        # Verificar se está respondendo na porta 8080
        $connection = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "    ✓ Porta 8080 está aberta" -ForegroundColor Green
        } else {
            Write-Host "    ✗ Porta 8080 não está respondendo" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✗ Não está em execução" -ForegroundColor Red
}

Write-Host ""

# Verificar Nginx
Write-Host "Nginx:" -ForegroundColor Yellow
$nginxProcesses = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
if ($nginxProcesses) {
    foreach ($process in $nginxProcesses) {
        $cpu = [math]::Round($process.CPU, 2)
        $memory = [math]::Round($process.WorkingSet64 / 1MB, 2)
        Write-Host "  ✓ Rodando (PID: $($process.Id), CPU: ${cpu}s, Memória: ${memory}MB)" -ForegroundColor Green
        
        # Verificar se está respondendo na porta 8085
        $connection = Test-NetConnection -ComputerName localhost -Port 8085 -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "    ✓ Porta 8085 está aberta" -ForegroundColor Green
        } else {
            Write-Host "    ✗ Porta 8085 não está respondendo" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✗ Não está em execução" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acesse: http://localhost:8085" -ForegroundColor Yellow
Write-Host ""

