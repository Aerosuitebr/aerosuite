# Valida migrações Flyway aplicadas (V8+ descobertas em db/migration).
# Uso: .\scripts\test\verify-flyway.ps1
# Requer MySQL do Compose: docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml up -d mysql api

param(
    [string]$MysqlContainer = 'aerosuite-mysql-local',
    [string]$MysqlHost = $(if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { '127.0.0.1' }),
    [int]$MysqlPort = $(if ($env:MYSQL_PORT) { [int]$env:MYSQL_PORT } else { 3306 }),
    [string]$MysqlUser = 'root',
    [string]$MysqlPassword = $(if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { 'root' }),
    [string]$MysqlDatabase = 'aerosuite',
    [int]$MinVersion = 8,
    [int[]]$RequiredVersions
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')
. (Join-Path $here 'Test-MysqlHelpers.ps1')

function Get-AerosuiteFlywayRequiredVersions {
    param([int]$FromVersion = 8)
    $root = Get-AerosuiteRepoRoot
    $migrationDir = Join-Path $root 'backend\src\main\resources\db\migration'
    if (-not (Test-Path $migrationDir)) {
        throw "Pasta de migracoes nao encontrada: $migrationDir"
    }
    $found = [System.Collections.Generic.List[int]]::new()
    Get-ChildItem $migrationDir -Filter 'V*.sql' | ForEach-Object {
        if ($_.Name -match '^V(\d+)__') {
            $v = [int]$Matches[1]
            if ($v -ge $FromVersion) { $found.Add($v) }
        }
    }
    return @($found | Sort-Object -Unique)
}

if (-not $RequiredVersions -or $RequiredVersions.Count -eq 0) {
    $RequiredVersions = Get-AerosuiteFlywayRequiredVersions -FromVersion $MinVersion
}
$maxRequired = ($RequiredVersions | Measure-Object -Maximum).Maximum

$results = [System.Collections.Generic.List[object]]::new()

$sql = 'SELECT version FROM flyway_schema_history WHERE success = 1 ORDER BY installed_rank;'
try {
    $raw = Invoke-AerosuiteMysql -Arguments @($MysqlDatabase, '-N', '-e', $sql) `
        -MysqlContainer $MysqlContainer -MysqlUser $MysqlUser -MysqlPassword $MysqlPassword `
        -MysqlHost $MysqlHost -MysqlPort $MysqlPort
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao consultar flyway_schema_history: $($raw -join ' ')" -ForegroundColor Red
    exit 1
}

$applied = @(
    $raw |
        Where-Object { $_ -and $_.Trim() -ne '' -and $_ -notmatch 'mysql: \[Warning\]' -and $_ -match '^\d+$' } |
        ForEach-Object { $_.Trim() }
)
$missing = @()
foreach ($v in $RequiredVersions) {
    $key = [string]$v
    if ($applied -notcontains $key) {
        $missing += "V$key"
    }
}

$ok = $missing.Count -eq 0
$detail = if ($ok) {
    "versoes=$($RequiredVersions.Count) aplicadas max=V$maxRequired"
} else {
    "em falta: $($missing -join ', '); aplicadas=$($applied -join ',')"
}
$results.Add((New-AerosuiteTestResult -Name "Flyway V$MinVersion-V$maxRequired aplicadas" -Passed $ok -Detail $detail))

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
