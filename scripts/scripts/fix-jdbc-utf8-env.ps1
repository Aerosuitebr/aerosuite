# Adiciona parâmetros UTF-8 à QUARKUS_DATASOURCE_JDBC_URL no .env da raiz do projeto.
# Uso: .\scripts\fix-jdbc-utf8-env.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.env'

if (-not (Test-Path $envFile)) {
    Write-Host "Ficheiro .env não encontrado. Copie .env.example para .env primeiro." -ForegroundColor Yellow
    exit 1
}

$utf8Suffix = 'characterEncoding=UTF-8&useUnicode=true&connectionCollation=utf8mb4_unicode_ci'
$lines = Get-Content $envFile -Encoding UTF8
$changed = $false
$out = foreach ($line in $lines) {
    if ($line -match '^\s*QUARKUS_DATASOURCE_JDBC_URL\s*=') {
        $changed = $true
        $url = ($line -split '=', 2)[1].Trim()
        if ($url -match 'useUnicode=true' -and $url -match 'characterEncoding=') {
            Write-Host "JDBC URL já contém UTF-8." -ForegroundColor Green
            $line
        } else {
            $sep = if ($url -match '\?') { '&' } else { '?' }
            $newUrl = "$url$sep$utf8Suffix"
            Write-Host "Atualizado QUARKUS_DATASOURCE_JDBC_URL com UTF-8." -ForegroundColor Green
            "QUARKUS_DATASOURCE_JDBC_URL=$newUrl"
        }
    } else {
        $line
    }
}

if (-not $changed) {
    Write-Host "Linha QUARKUS_DATASOURCE_JDBC_URL não encontrada no .env." -ForegroundColor Yellow
    exit 1
}

Set-Content -Path $envFile -Value $out -Encoding UTF8
Write-Host "Reinicie a API: docker compose up -d --build api" -ForegroundColor Cyan
