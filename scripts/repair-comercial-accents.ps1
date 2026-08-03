# Aplica correção de acentos (?) em templates/propostas no MySQL.
# Uso: .\scripts\repair-comercial-accents.ps1
# Requer cliente mysql no PATH ou Docker.

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sqlFile = Join-Path $repoRoot 'db\scripts\fix_comercial_texto_utf8.sql'

$user = $env:QUARKUS_DATASOURCE_USERNAME
if (-not $user) { $user = 'root' }
$pass = $env:QUARKUS_DATASOURCE_PASSWORD
if (-not $pass) { $pass = 'root' }
$db = 'aerosuite'

$jdbc = $env:QUARKUS_DATASOURCE_JDBC_URL
$dbHost = '127.0.0.1'
$port = '3306'
if ($jdbc -match 'jdbc:mysql://([^:/]+):(\d+)/') {
    $dbHost = $Matches[1]
    $port = $Matches[2]
    if ($dbHost -eq 'mysql') { $dbHost = '127.0.0.1' }
    if ($dbHost -eq 'host.docker.internal') { $dbHost = '127.0.0.1' }
}

Write-Host "Aplicando $sqlFile em ${dbHost}:${port}/$db ..."

$mysqlArgs = @(
    '--default-character-set=utf8mb4',
    "-h$dbHost",
    "-P$port",
    "-u$user",
    "-p$pass",
    $db
)

if (Get-Command mysql -ErrorAction SilentlyContinue) {
    Get-Content -LiteralPath $sqlFile -Encoding UTF8 | mysql @mysqlArgs
} elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    $content = Get-Content -LiteralPath $sqlFile -Raw -Encoding UTF8
    $content | docker run --rm -i mysql:8.0 mysql @mysqlArgs
} else {
    throw 'Instale o cliente mysql ou Docker para executar o script.'
}

Write-Host 'Concluído. Reinicie a API se ainda não aplicou a migração Flyway V26.'
