# Valida backup real com API no Docker (caminho /app/backups).
# Uso: .\scripts\test\verify-backup-docker.ps1 [-ApplySqlFix]

param(
    [string]$ApiBaseUrl = 'http://localhost:8080',
    [switch]$ApplySqlFix,
    [switch]$RebuildApi
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent (Split-Path -Parent $here)

if ($ApplySqlFix) {
    $sql = Join-Path $root 'db\scripts\fix-backup-path-docker-local.sql'
    Write-Host "Aplicando $sql no MySQL local..." -ForegroundColor Cyan
    Get-Content -Raw -LiteralPath $sql | docker run --rm -i mysql:8.0 mysql -h host.docker.internal -u root -proot aerosuite
    if ($LASTEXITCODE -ne 0) { throw 'mysql fix-backup-path falhou' }
}

if ($RebuildApi) {
    Push-Location $root
    try {
        docker compose build api
        docker compose up -d api
        Start-Sleep -Seconds 45
    } finally {
        Pop-Location
    }
}

& (Join-Path $here 'anac-backup-restore-evidencia.ps1') -ApiBaseUrl $ApiBaseUrl
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$backupsDir = Join-Path $root 'backups'
$files = Get-ChildItem -Path $backupsDir -Filter 'backup_*.sql*' -ErrorAction SilentlyContinue
if ($files.Count -eq 0) {
    Write-Host "FALHA: nenhum dump em $backupsDir" -ForegroundColor Red
    exit 1
}
Write-Host "OK: $($files[0].FullName) ($([math]::Round($files[0].Length/1MB, 2)) MB)" -ForegroundColor Green
