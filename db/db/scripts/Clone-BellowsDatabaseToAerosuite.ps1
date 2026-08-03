<#
.SYNOPSIS
  Clona o banco MySQL `bellows` (estrutura + dados) para `aerosuite`.

.DESCRIPTION
  Usa mysqldump | mysql no mesmo servidor. Útil após o rebrand Aero Suite quando a BD
  de produção/dev ainda se chama `bellows`.

  Após o clone, aplica correções pós-migração (e-mail admin) e pode atualizar o `.env` na raiz.

.PARAMETER MySqlHost
  Host MySQL (ignorado se -UseDocker).

.PARAMETER Port
  Porta TCP (ignorado se -UseDocker).

.PARAMETER User
  Utilizador MySQL.

.PARAMETER Password
  Senha. Se vazio, usa variável MYSQL_PWD ou pede interactivamente.

.PARAMETER SourceDatabase
  BD origem (padrão: bellows).

.PARAMETER TargetDatabase
  BD destino (padrão: aerosuite).

.PARAMETER DropTarget
  Apaga a BD destino antes de recriar (recomendado na primeira migração).

.PARAMETER UseDocker
  Executa mysql/mysqldump via `docker exec` no contentor indicado.

.PARAMETER DockerContainer
  Nome do contentor (padrão: aerosuite-mysql-local).

.PARAMETER UpdateEnvFile
  Substitui `/bellows` por `/aerosuite` em QUARKUS_DATASOURCE_JDBC_URL no `.env` da raiz.

.PARAMETER SaveDumpPath
  Se definido, grava também um ficheiro .sql do dump antes de importar.

.EXAMPLE
  .\Clone-BellowsDatabaseToAerosuite.ps1 -Password root -DropTarget

.EXAMPLE
  .\Clone-BellowsDatabaseToAerosuite.ps1 -UseDocker -DockerContainer aerosuite-mysql-local -DropTarget -UpdateEnvFile
#>
[CmdletBinding()]
param(
    [string] $MySqlHost = '127.0.0.1',
    [int] $Port = 3306,
    [string] $User = 'root',
    [string] $Password = '',
    [string] $SourceDatabase = 'bellows',
    [string] $TargetDatabase = 'aerosuite',
    [switch] $DropTarget,
    [switch] $UseDocker,
    [string] $DockerContainer = 'bellows-mysql-local',
    [switch] $UpdateEnvFile,
    [string] $SaveDumpPath = ''
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$postSql = Join-Path $PSScriptRoot 'post_clone_aerosuite_rebrand.sql'

function Get-PlainPassword {
    if ($Password) { return $Password }
    if ($env:MYSQL_PWD) { return $env:MYSQL_PWD }
  $sec = Read-Host "Senha MySQL ($User)" -AsSecureString
    [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}

function Invoke-MySqlCli {
    param([string]$Sql)
    if ($UseDocker) {
        & docker exec $DockerContainer mysql "-u$User" "-p$script:plainPwd" -e $Sql
    }
    else {
        & mysql -h $MySqlHost -P $Port -u $User "-p$script:plainPwd" -e $Sql
    }
    if ($LASTEXITCODE -ne 0) { throw "mysql falhou (exit $LASTEXITCODE)" }
}

function Test-DatabaseExists {
    param([string]$DbName)
    $q = "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '$DbName'"
    if ($UseDocker) {
        $out = & docker exec $DockerContainer mysql "-u$User" "-p$script:plainPwd" -N -e $q 2>$null
    }
    else {
        $out = & mysql -h $MySqlHost -P $Port -u $User "-p$script:plainPwd" -N -e $q 2>$null
    }
    return ($out -match [regex]::Escape($DbName))
}

function Invoke-MysqlDumpToTarget {
    $dumpArgs = @(
        '--single-transaction',
        '--routines',
        '--triggers',
        '--events',
        '--set-gtid-purged=OFF',
        '--column-statistics=0',
        '--default-character-set=utf8mb4',
        $SourceDatabase
    )
    if ($UseDocker) {
        $dumpCmd = @('exec', $DockerContainer, 'mysqldump', "-u$User", "-p$script:plainPwd") + $dumpArgs
        $importCmd = @('exec', '-i', $DockerContainer, 'mysql', "-u$User", "-p$script:plainPwd", $TargetDatabase)
        if ($SaveDumpPath) {
            Write-Host "A gravar dump em $SaveDumpPath ..."
            & docker @dumpCmd | Tee-Object -FilePath $SaveDumpPath | & docker @importCmd
        }
        else {
            & docker @dumpCmd | & docker @importCmd
        }
    }
    else {
        $dumpBase = @('-h', $MySqlHost, '-P', $Port, '-u', $User, "-p$script:plainPwd") + $dumpArgs
        $importBase = @('-h', $MySqlHost, '-P', $Port, '-u', $User, "-p$script:plainPwd", $TargetDatabase)
        if ($SaveDumpPath) {
            Write-Host "A gravar dump em $SaveDumpPath ..."
            & mysqldump @dumpBase | Tee-Object -FilePath $SaveDumpPath | & mysql @importBase
        }
        else {
            & mysqldump @dumpBase | & mysql @importBase
        }
    }
    if ($LASTEXITCODE -ne 0) { throw "mysqldump/mysql pipe falhou (exit $LASTEXITCODE)" }
}

function Update-RootEnvJdbc {
    $envPath = Join-Path $repoRoot '.env'
    if (-not (Test-Path $envPath)) {
        Write-Warning ".env não encontrado em $envPath — copie .env.example e defina QUARKUS_DATASOURCE_JDBC_URL com /$TargetDatabase"
        return
    }
    $lines = Get-Content $envPath -Encoding UTF8
    $changed = $false
    $newLines = foreach ($line in $lines) {
        if ($line -match '^\s*QUARKUS_DATASOURCE_JDBC_URL\s*=') {
            $changed = $true
            if ($line -match '/bellows(\?|$)') {
                $line -replace '/bellows', "/$TargetDatabase"
            }
            elseif ($line -notmatch "/$TargetDatabase") {
                Write-Warning 'JDBC_URL não contém /bellows nem /aerosuite — ajuste manualmente.'
                $line
            }
            else { $line }
        }
        else { $line }
    }
    if ($changed) {
        Set-Content -Path $envPath -Value $newLines -Encoding UTF8
        Write-Host "Atualizado QUARKUS_DATASOURCE_JDBC_URL em .env → base $TargetDatabase" -ForegroundColor Green
    }
}

Write-Host "=== Clone MySQL: $SourceDatabase → $TargetDatabase ===" -ForegroundColor Cyan
$script:plainPwd = Get-PlainPassword

if ($UseDocker) {
    $running = docker inspect -f '{{.State.Running}}' $DockerContainer 2>$null
    if ($running -ne 'true') {
        throw "Contentor '$DockerContainer' não está a correr. Ex.: docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml up -d mysql"
    }
}

if (-not (Test-DatabaseExists -DbName $SourceDatabase)) {
    throw "Base de dados origem '$SourceDatabase' não existe. Verifique host/credenciais."
}

if ((Test-DatabaseExists -DbName $TargetDatabase) -and -not $DropTarget) {
    throw "Base '$TargetDatabase' já existe. Use -DropTarget para recriar (apaga dados actuais em $TargetDatabase)."
}

if ($DropTarget) {
    Write-Host "A recriar base $TargetDatabase ..."
    Invoke-MySqlCli -Sql "DROP DATABASE IF EXISTS ``$TargetDatabase``; CREATE DATABASE ``$TargetDatabase`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
}
elseif (-not (Test-DatabaseExists -DbName $TargetDatabase)) {
    Write-Host "A criar base $TargetDatabase ..."
    Invoke-MySqlCli -Sql "CREATE DATABASE ``$TargetDatabase`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
}

Write-Host "A copiar tabelas e dados (isto pode demorar) ..."
Invoke-MysqlDumpToTarget

if (Test-Path $postSql) {
    Write-Host "A aplicar pos-migracao (rebrand admin, etc.) ..."
    if ($UseDocker) {
        Get-Content $postSql -Raw | docker exec -i $DockerContainer mysql "-u$User" "-p$script:plainPwd" $TargetDatabase
    }
    else {
        Get-Content $postSql -Raw | mysql -h $MySqlHost -P $Port -u $User "-p$script:plainPwd" $TargetDatabase
    }
}

if ($UpdateEnvFile) {
    Update-RootEnvJdbc
}

Write-Host ""
Write-Host "Concluido. Base $TargetDatabase pronta." -ForegroundColor Green
Write-Host "Reinicie a API (docker compose restart api) e faca login com admin@aerosuite.com"
Write-Host "JDBC padrao: jdbc:mysql://...:3306/$TargetDatabase (application.properties e .env)."
