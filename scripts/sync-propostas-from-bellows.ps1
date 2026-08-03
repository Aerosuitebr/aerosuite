# Copia proposta_comercial (+ itens + envios): bellows -> aerosuite (acentos corretos na origem).
# Uso: .\scripts\sync-propostas-from-bellows.ps1

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sqlFile = Join-Path $repoRoot 'db\scripts\sync_proposta_comercial_bellows_to_aerosuite.sql'

$user = if ($env:QUARKUS_DATASOURCE_USERNAME) { $env:QUARKUS_DATASOURCE_USERNAME } else { 'root' }
$pass = if ($env:QUARKUS_DATASOURCE_PASSWORD) { $env:QUARKUS_DATASOURCE_PASSWORD } else { 'root' }

$dbHost = 'host.docker.internal'
$port = '3306'
$jdbc = $env:QUARKUS_DATASOURCE_JDBC_URL
if ($jdbc -match 'jdbc:mysql://([^:/]+):(\d+)/') {
    $dbHost = $Matches[1]
    $port = $Matches[2]
    if ($dbHost -eq 'mysql') { $dbHost = '127.0.0.1' }
}

Write-Host "Sincronizando propostas comerciais: bellows -> aerosuite em ${dbHost}:${port} ..."

$content = Get-Content -LiteralPath $sqlFile -Raw -Encoding UTF8

if (Get-Command mysql -ErrorAction SilentlyContinue) {
    $content | mysql --default-character-set=utf8mb4 -h $dbHost -P $port -u $user "-p$pass"
    if ($LASTEXITCODE -ne 0) { throw "mysql falhou (exit $LASTEXITCODE)" }
}
elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerHost = if ($dbHost -eq '127.0.0.1') { 'host.docker.internal' } else { $dbHost }
    $content | docker run --rm -i mysql:8.0 mysql --default-character-set=utf8mb4 -h $dockerHost -P $port -u $user "-p$pass"
    if ($LASTEXITCODE -ne 0) { throw "mysql via docker falhou (exit $LASTEXITCODE)" }
}
else {
    throw 'Instale mysql client ou Docker.'
}

Write-Host 'Concluido. Atualize a lista de propostas no browser (Ctrl+F5).'
