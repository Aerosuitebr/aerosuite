# Checklist automatizado antes do primeiro deploy (D2).
# Uso: .\scripts\deploy\pre-deploy-check.ps1
#      .\scripts\deploy\pre-deploy-check.ps1 -Strict   # exige .env.production preenchido

param([switch]$Strict)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$prodExample = Join-Path $root '.env.production.example'
$prodFile = Join-Path $root '.env.production'
$validate = Join-Path $root 'scripts\validate-production-env.ps1'

Write-Host 'Aero Suite - pre-deploy check (D2)' -ForegroundColor Cyan

if (-not (Test-Path $prodExample)) {
    Write-Host 'ERRO: .env.production.example ausente' -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $prodFile)) {
    Write-Host 'AVISO: .env.production ausente — copie o exemplo antes do VPS:' -ForegroundColor Yellow
    Write-Host "  cp .env.production.example .env.production" -ForegroundColor DarkGray
    if ($Strict) { exit 1 }
} else {
    & $validate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Push-Location $root
try {
    docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml config -q 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'ERRO: docker compose config (production overlays) invalido' -ForegroundColor Red
        exit 1
    }
    Write-Host 'OK: docker-compose.production.yml valido' -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host ''
Write-Host 'Proximo (manual):' -ForegroundColor Cyan
Write-Host '  1. VPS Ubuntu 24.04 — docs/DECISAO-VPS.md'
Write-Host '  2. docs/DEPLOY-PRODUCAO.md + scripts/deploy/bootstrap-linux.sh'
Write-Host '  3. Pos-deploy: .\scripts\test\sprint1-homologacao.ps1 -ApiOnly (contra URL publica)'
exit 0
