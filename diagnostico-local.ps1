# Diagnóstico: aplicação não acessível nem em localhost
# Execute na pasta do projeto: .\diagnostico-local.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnóstico Aero Suite - Acesso local   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 0. .env
Write-Host "0. Validacao do .env:" -ForegroundColor Yellow
$validateScript = Join-Path $PSScriptRoot "scripts\validate-env.ps1"
if (Test-Path $validateScript) {
  & $validateScript
} else {
  Write-Host "   scripts\validate-env.ps1 nao encontrado" -ForegroundColor Yellow
}
Write-Host ""

# 1. Containers rodando?
Write-Host "1. Containers (docker ps):" -ForegroundColor Yellow
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern "aerosuite|NAMES"
Write-Host ""

# 2. Portas publicadas
Write-Host "2. Portas publicadas (docker port):" -ForegroundColor Yellow
docker port aerosuite-frontend 2>$null; if (-not $?) { Write-Host "   aerosuite-frontend: container nao encontrado ou nao rodando" }
docker port aerosuite-backend  2>$null; if (-not $?) { Write-Host "   aerosuite-backend: container nao encontrado ou nao rodando" }
Write-Host ""

# 3. Algo escutando em 8080 e 8081?
Write-Host "3. Portas 8080 e 8081 no host:" -ForegroundColor Yellow
$net8080 = netstat -ano | findstr ":8080.*LISTENING"
$net8081 = netstat -ano | findstr ":8081.*LISTENING"
if ($net8080) { Write-Host "   8080: em uso (backend)" -ForegroundColor Green } else { Write-Host "   8080: NADA escutando - backend pode ter caido" -ForegroundColor Red }
if ($net8081) { Write-Host "   8081: em uso (frontend)" -ForegroundColor Green } else { Write-Host "   8081: NADA escutando - frontend pode ter caido" -ForegroundColor Red }
Write-Host ""

# 4. Teste HTTP
Write-Host "4. Teste de acesso HTTP:" -ForegroundColor Yellow
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:8081" -UseBasicParsing -TimeoutSec 5
  Write-Host "   Frontend (http://127.0.0.1:8081): OK - Status $($r.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "   Frontend (http://127.0.0.1:8081): FALHOU - $($_.Exception.Message)" -ForegroundColor Red
}
try {
  $r2 = Invoke-WebRequest -Uri "http://127.0.0.1:8080/q/openapi" -UseBasicParsing -TimeoutSec 5
  Write-Host "   Backend  (http://127.0.0.1:8080): OK - Status $($r2.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "   Backend  (http://127.0.0.1:8080): FALHOU - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. Ultimas linhas do log do frontend (erro nginx?)
Write-Host "5. Ultimas linhas do log (frontend):" -ForegroundColor Yellow
docker logs aerosuite-frontend --tail 5 2>&1
Write-Host ""

Write-Host "6. Ultimas linhas do log (backend):" -ForegroundColor Yellow
docker logs aerosuite-backend --tail 8 2>&1
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Acesse no navegador: http://localhost:8081" -ForegroundColor White
Write-Host "  Se falhar, rode: docker compose up -d" -ForegroundColor White
Write-Host "  e depois: docker compose logs -f" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
