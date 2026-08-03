# Script de Inicialização - Windows PowerShell
# Aero Suite Aeronáutica - Ambiente de Produção

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Iniciando Aero Suite Aeronáutica" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Carregar configurações
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootPath = Split-Path -Parent $scriptPath
Set-Location $rootPath

# Verificar se já está rodando
$backendProcess = Get-Process -Name "java" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*aerosuite*" }
if ($backendProcess) {
    Write-Host "AVISO: Backend já está em execução (PID: $($backendProcess.Id))" -ForegroundColor Yellow
    Write-Host "Execute .\scripts\stop.ps1 primeiro se desejar reiniciar" -ForegroundColor Yellow
}

# Verificar Nginx
$nginxProcess = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
if ($nginxProcess) {
    Write-Host "AVISO: Nginx já está em execução" -ForegroundColor Yellow
} else {
    Write-Host "Iniciando Nginx..." -ForegroundColor Green
    $nginxPath = Get-Content "config\nginx-path.txt" -ErrorAction SilentlyContinue
    if (-not $nginxPath) {
        $nginxPath = "C:\nginx"
    }
    
    if (Test-Path "$nginxPath\nginx.exe") {
        Start-Process -FilePath "$nginxPath\nginx.exe" -WorkingDirectory $nginxPath
        Start-Sleep -Seconds 2
        Write-Host "✓ Nginx iniciado" -ForegroundColor Green
    } else {
        Write-Host "✗ Nginx não encontrado em $nginxPath" -ForegroundColor Red
        Write-Host "Configure o caminho do Nginx em config\nginx-path.txt" -ForegroundColor Yellow
    }
}

# Iniciar Backend
Write-Host "Iniciando Backend..." -ForegroundColor Green
$backendJar = Get-ChildItem "backend\*.jar" | Select-Object -First 1
if ($backendJar) {
    # Carregar variáveis de ambiente
    if (Test-Path "config\backend.env") {
        Get-Content "config\backend.env" | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    
    # Definir porta
    $env:QUARKUS_HTTP_PORT = "8080"
    
    # Iniciar backend em background
    $backendProcess = Start-Process -FilePath "java" `
        -ArgumentList "-jar", $backendJar.FullName `
        -WorkingDirectory "backend" `
        -PassThru `
        -NoNewWindow `
        -RedirectStandardOutput "logs\backend.log" `
        -RedirectStandardError "logs\backend-error.log"
    
    Start-Sleep -Seconds 3
    Write-Host "✓ Backend iniciado (PID: $($backendProcess.Id))" -ForegroundColor Green
    Write-Host "  Logs: logs\backend.log" -ForegroundColor Gray
} else {
    Write-Host "✗ Backend JAR não encontrado em backend\" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sistema iniciado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acesse: http://localhost:8085" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para verificar status: .\scripts\status.ps1" -ForegroundColor Gray
Write-Host "Para parar: .\scripts\stop.ps1" -ForegroundColor Gray
Write-Host ""

