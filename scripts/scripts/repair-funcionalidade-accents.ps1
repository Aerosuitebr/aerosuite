# Aplica correcao de acentos em funcionalidade (menu / permissoes).
# Uso: .\scripts\repair-funcionalidade-accents.ps1
# Opcional: .\scripts\repair-funcionalidade-accents.ps1 -Diagnose

param(
    [switch]$Diagnose
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sqlFile = if ($Diagnose) {
    Join-Path $repoRoot 'db\scripts\diagnose_utf8_corruption.sql'
} else {
    Join-Path $repoRoot 'db\scripts\fix_funcionalidade_texto_utf8.sql'
}
$sqlDir = Split-Path -Parent $sqlFile
$sqlName = Split-Path -Leaf $sqlFile

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
}

$label = if ($Diagnose) { 'Diagnostico UTF-8' } else { 'Reparo funcionalidade UTF-8' }
Write-Host "$label : $sqlFile em ${dbHost}:${port}/$db ..."

function Invoke-MysqlFile {
    param([string]$HostName, [string]$SqlPath)

    $mysqlArgs = @(
        '--default-character-set=utf8mb4',
        "-h$HostName",
        "-P$port",
        "-u$user",
        "-p$pass",
        $db
    )

    if (Get-Command mysql -ErrorAction SilentlyContinue) {
        cmd /c "mysql --default-character-set=utf8mb4 -h$HostName -P$port -u$user -p$pass $db < `"$SqlPath`""
        if ($LASTEXITCODE -ne 0) { throw "mysql falhou (exit $LASTEXITCODE)" }
        return
    }

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Instale o cliente mysql ou Docker para executar o script.'
    }

    $dockerHost = if ($HostName -in @('127.0.0.1', 'localhost')) { 'host.docker.internal' } else { $HostName }
    $vol = "${sqlDir}:/scripts"
    $inner = "mysql --default-character-set=utf8mb4 -h$dockerHost -P$port -u$user -p$pass $db < /scripts/$sqlName"
    docker run --rm -v $vol mysql:8.0 sh -c $inner
    if ($LASTEXITCODE -ne 0) { throw "mysql via docker falhou (exit $LASTEXITCODE)" }
}

try {
    Invoke-MysqlFile -HostName $dbHost -SqlPath $sqlFile
} catch {
    if ($dbHost -eq '127.0.0.1') {
        Write-Host 'Tentando host.docker.internal via Docker...' -ForegroundColor Yellow
        Invoke-MysqlFile -HostName 'host.docker.internal' -SqlPath $sqlFile
    } else {
        throw
    }
}

if (-not $Diagnose) {
    Write-Host 'Concluido. Confira o relatorio no final do SQL e recarregue o menu no navegador.'
    Write-Host 'Prevencao: .\scripts\fix-jdbc-utf8-env.ps1 e sempre mysql --default-character-set=utf8mb4'
}
