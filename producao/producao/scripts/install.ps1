# Script de Instalação - Windows PowerShell
# Aero Suite Aeronáutica - Ambiente de Produção

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Aero Suite Aeronáutica - Instalação" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "AVISO: Algumas operações podem requerer privilégios de administrador" -ForegroundColor Yellow
}

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Green
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js não encontrado. Instale Node.js 18+ de https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verificar Nginx
Write-Host "Verificando Nginx..." -ForegroundColor Green
$nginxPath = "C:\nginx"
if (-not (Test-Path $nginxPath)) {
    Write-Host "Nginx não encontrado em $nginxPath" -ForegroundColor Yellow
    Write-Host "Por favor, instale o Nginx e configure o caminho em config/nginx-path.txt" -ForegroundColor Yellow
} else {
    Write-Host "✓ Nginx encontrado em $nginxPath" -ForegroundColor Green
}

# Criar diretórios necessários
Write-Host "Criando diretórios..." -ForegroundColor Green
$directories = @(
    "backend",
    "frontend",
    "logs",
    "config"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Diretório criado: $dir" -ForegroundColor Green
    }
}

# Copiar configurações padrão se não existirem
Write-Host "Configurando arquivos..." -ForegroundColor Green
if (-not (Test-Path "config\backend.env")) {
    Copy-Item "config\backend.env.example" "config\backend.env" -ErrorAction SilentlyContinue
    Write-Host "✓ Arquivo de configuração criado: config\backend.env" -ForegroundColor Green
    Write-Host "  IMPORTANTE: Edite config\backend.env com suas configurações!" -ForegroundColor Yellow
}

# Verificar se o frontend foi buildado
if (-not (Test-Path "frontend\index.html")) {
    Write-Host "AVISO: Frontend não encontrado em frontend/" -ForegroundColor Yellow
    Write-Host "Execute: cd ..\frontend && npm install && npm run build:prod" -ForegroundColor Yellow
}

# Verificar se o backend foi compilado
if (-not (Test-Path "backend\*.jar") -and -not (Test-Path "backend\*.war")) {
    Write-Host "AVISO: Backend não encontrado em backend/" -ForegroundColor Yellow
    Write-Host "Copie o JAR/WAR do backend para backend/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalação concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Edite config\backend.env com suas configurações" -ForegroundColor White
Write-Host "2. Execute .\scripts\start.ps1 para iniciar o sistema" -ForegroundColor White
Write-Host ""

