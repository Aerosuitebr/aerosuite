# Apos Flyway (API no ar): garante admin plataforma para smoke/E2E em BD vazia.
param(
    [string]$MysqlContainer = 'aerosuite-mysql-local',
    [string]$MysqlPassword = 'root'
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $here '..\..')).Path
$seed = Join-Path $root 'db\scripts\seed_aerosuite_admin.sql'

if (-not (Test-Path $seed)) {
    Write-Host "Seed nao encontrado: $seed" -ForegroundColor Red
    exit 1
}

$running = docker ps --filter "name=$MysqlContainer" --format '{{.Names}}' 2>$null
if (-not $running) {
    Write-Host "Container MySQL '$MysqlContainer' nao encontrado - ignorar bootstrap." -ForegroundColor Yellow
    exit 0
}

Get-Content $seed -Raw -Encoding UTF8 | docker exec -i $MysqlContainer mysql -uroot "-p$MysqlPassword" --default-character-set=utf8mb4 aerosuite
Write-Host 'Bootstrap admin plataforma aplicado.' -ForegroundColor Green
