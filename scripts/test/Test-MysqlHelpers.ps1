# Helpers MySQL para testes (container Compose ou host).
function Get-AerosuiteMysqlExecMode {
    param(
        [string]$MysqlContainer = 'aerosuite-mysql-local',
        [string]$MysqlHost = $(if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { '127.0.0.1' }),
        [int]$MysqlPort = $(if ($env:MYSQL_PORT) { [int]$env:MYSQL_PORT } else { 3306 })
    )
    $running = docker ps --format '{{.Names}}' 2>$null | Where-Object { $_ -eq $MysqlContainer }
    if ($running) {
        return @{ Mode = 'container'; Container = $MysqlContainer }
    }
    if (Get-Command mysql -ErrorAction SilentlyContinue) {
        return @{ Mode = 'host'; Host = $MysqlHost; Port = $MysqlPort }
    }
    # Host MySQL sem CLI local: cliente efémero (ex.: API no Docker + MySQL na porta 3306 do Windows).
    if (docker info 2>$null) {
        $hostName = if ($MysqlHost -eq '127.0.0.1' -or $MysqlHost -eq 'localhost') { 'host.docker.internal' } else { $MysqlHost }
        return @{ Mode = 'docker-run'; Host = $hostName; Port = $MysqlPort }
    }
    return $null
}

function Invoke-AerosuiteMysql {
    param(
        [Parameter(Mandatory)][string[]]$Arguments,
        [string]$MysqlContainer = 'aerosuite-mysql-local',
        [string]$MysqlUser = 'root',
        [string]$MysqlPassword = $(if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { 'root' }),
        [string]$MysqlHost = $(if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { '127.0.0.1' }),
        [int]$MysqlPort = $(if ($env:MYSQL_PORT) { [int]$env:MYSQL_PORT } else { 3306 })
    )
    $mode = Get-AerosuiteMysqlExecMode -MysqlContainer $MysqlContainer -MysqlHost $MysqlHost -MysqlPort $MysqlPort
    if (-not $mode) {
        throw "MySQL indisponivel: container '$MysqlContainer' parado e CLI 'mysql' ausente."
    }
    if ($mode.Mode -eq 'container') {
        $prevEa = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            $out = docker exec $mode.Container mysql "-u$MysqlUser" "-p$MysqlPassword" @Arguments 2>&1
        } finally {
            $ErrorActionPreference = $prevEa
        }
    } elseif ($mode.Mode -eq 'docker-run') {
        $prevEa = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            $out = docker run --rm mysql:8.0 mysql "-u$MysqlUser" "-p$MysqlPassword" "-h$($mode.Host)" "-P$($mode.Port)" @Arguments 2>&1
        } finally {
            $ErrorActionPreference = $prevEa
        }
    } else {
        $env:MYSQL_PWD = $MysqlPassword
        try {
            $out = & mysql "-u$MysqlUser" "-h$($mode.Host)" "-P$($mode.Port)" @Arguments 2>&1
        } finally {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }
    }
    return @(
        $out |
            ForEach-Object { if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.ToString() } else { $_ } } |
            Where-Object { $_ -is [string] -and $_ -notmatch 'mysql: \[Warning\]' }
    )
}

function Invoke-AerosuiteMysqlScriptFile {
    param(
        [Parameter(Mandatory)][string]$SqlFilePath,
        [string]$MysqlDatabase = 'aerosuite',
        [string]$MysqlContainer = 'aerosuite-mysql-local',
        [string]$MysqlUser = 'root',
        [string]$MysqlPassword = $(if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { 'root' }),
        [string]$MysqlHost = $(if ($env:MYSQL_HOST) { $env:MYSQL_HOST } else { '127.0.0.1' }),
        [int]$MysqlPort = $(if ($env:MYSQL_PORT) { [int]$env:MYSQL_PORT } else { 3306 })
    )
    $mode = Get-AerosuiteMysqlExecMode -MysqlContainer $MysqlContainer -MysqlHost $MysqlHost -MysqlPort $MysqlPort
    if (-not $mode) {
        throw "MySQL indisponivel: container '$MysqlContainer' parado e CLI 'mysql' ausente."
    }
    $prevEa = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($mode.Mode -eq 'container') {
            Get-Content $SqlFilePath -Raw | docker exec -i $mode.Container mysql "-u$MysqlUser" "-p$MysqlPassword" $MysqlDatabase 2>&1 | Out-Null
        } elseif ($mode.Mode -eq 'docker-run') {
            Get-Content $SqlFilePath -Raw | docker run --rm -i mysql:8.0 mysql "-u$MysqlUser" "-p$MysqlPassword" "-h$($mode.Host)" "-P$($mode.Port)" $MysqlDatabase 2>&1 | Out-Null
        } else {
            $env:MYSQL_PWD = $MysqlPassword
            try {
                Get-Content $SqlFilePath -Raw | & mysql "-u$MysqlUser" "-h$($mode.Host)" "-P$($mode.Port)" $MysqlDatabase 2>&1 | Out-Null
            } finally {
                Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
            }
        }
    } finally {
        $ErrorActionPreference = $prevEa
    }
    if ($LASTEXITCODE -ne 0) { throw "Falha ao executar script SQL: $SqlFilePath" }
}
