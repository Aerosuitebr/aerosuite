# Provisiona Aero Suite num VPS Vultr a partir do PC Windows.
# Pré-requisito: instância Ubuntu 24.04 Running + SSH key no Vultr.
#
# Uso:
#   .\scripts\deploy\setup-vultr-production.ps1 -ServerIp 203.0.113.10
#   .\scripts\deploy\setup-vultr-production.ps1 -ServerIp 203.0.113.10 -Branch desenv

param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIp,
    [string]$SshUser = 'root',
    [string]$SshKeyPath = (Join-Path $env:USERPROFILE '.ssh\aerosuite_ed25519'),
    [string]$Branch = 'desenv',
    [string]$InstallDir = '/opt/aerosuite',
    [switch]$SkipComposeUp,
    [switch]$SkipRepoUpload
)

function Get-SshArgs() {
    $args = @('-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=15')
    if ($SshKeyPath -and (Test-Path $SshKeyPath)) {
        $args = @('-i', $SshKeyPath) + $args
    }
    return $args
}

function Send-LfFile([string]$LocalPath, [string]$RemotePath, [object[]]$ScpArgs) {
    $content = [System.IO.File]::ReadAllText($LocalPath) -replace "`r`n", "`n" -replace "`r", "`n"
    $tmp = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tmp, $content, [System.Text.UTF8Encoding]::new($false))
    try {
        scp @ScpArgs $tmp $RemotePath
        if ($LASTEXITCODE -ne 0) { throw "scp falhou: $RemotePath" }
    } finally {
        Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    }
}

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$prodExample = Join-Path $root '.env.production.example'
$prodFile = Join-Path $root '.env.production'
$envExample = Join-Path $root '.env.example'
$envFile = Join-Path $root '.env'

function Read-EnvMap([string]$Path) {
    $map = @{}
    if (-not (Test-Path $Path)) { return $map }
    Get-Content $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        $eq = $line.IndexOf('=')
        if ($eq -lt 1) { return }
        $map[$line.Substring(0, $eq).Trim()] = $line.Substring($eq + 1).Trim()
    }
    return $map
}

function New-RandomSecret([int]$Bytes = 32) {
    $buf = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
    return [Convert]::ToBase64String($buf) -replace '[+/=]', 'x'
}

Write-Host "Aero Suite setup Vultr (${SshUser}@${ServerIp})" -ForegroundColor Cyan

if (-not (Test-Path $prodFile)) {
    if (-not (Test-Path $prodExample)) { throw '.env.production.example ausente' }
    Copy-Item $prodExample $prodFile
    Write-Host 'Criado .env.production a partir do exemplo' -ForegroundColor Yellow
}

$localEnv = Read-EnvMap $envFile
$prodLines = Get-Content $prodFile -Encoding UTF8
$prodMap = Read-EnvMap $prodFile

$jwt = $prodMap['AERO_SUITE_JWT_SECRET']
if ([string]::IsNullOrWhiteSpace($jwt) -or $jwt -match 'dev-only|change-in-production') {
    $jwt = New-RandomSecret 48
}

$mysqlPwd = $prodMap['MYSQL_ROOT_PASSWORD']
if ([string]::IsNullOrWhiteSpace($mysqlPwd)) {
    $mysqlPwd = New-RandomSecret 24
}

$mailPwd = $prodMap['QUARKUS_MAILER_PASSWORD']
if ([string]::IsNullOrWhiteSpace($mailPwd) -and $localEnv['QUARKUS_MAILER_PASSWORD']) {
    $mailPwd = $localEnv['QUARKUS_MAILER_PASSWORD']
}

$updates = @{
    'FRONTEND_URL'                      = 'https://app.aerosuite.app'
    'QUARKUS_DATASOURCE_JDBC_URL'       = 'jdbc:mysql://mysql:3306/aerosuite?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo&characterEncoding=UTF-8&useUnicode=true&connectionCollation=utf8mb4_unicode_ci'
    'QUARKUS_DATASOURCE_USERNAME'       = 'root'
    'QUARKUS_DATASOURCE_PASSWORD'       = $mysqlPwd
    'AERO_SUITE_JWT_SECRET'             = $jwt
    'MYSQL_ROOT_PASSWORD'               = $mysqlPwd
    'QUARKUS_FLYWAY_REPAIR_AT_START'    = 'false'
    'MAIL_MOCK'                         = 'false'
}
if ($mailPwd) { $updates['QUARKUS_MAILER_PASSWORD'] = $mailPwd }

$keysWritten = @{}
$out = foreach ($line in $prodLines) {
    if ($line -match '^\s*#' -or $line.Trim() -eq '') { $line; continue }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { $line; continue }
    $key = $line.Substring(0, $eq).Trim()
    if ($updates.ContainsKey($key)) {
        $keysWritten[$key] = $true
        "$key=$($updates[$key])"
    } else { $line }
}
foreach ($k in $updates.Keys) {
    if (-not $keysWritten[$k]) { $out += "$k=$($updates[$k])" }
}
Set-Content -Path $prodFile -Value $out -Encoding UTF8

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
}
$envMap = Read-EnvMap $envFile
$envMap['QUARKUS_DATASOURCE_JDBC_URL'] = $updates['QUARKUS_DATASOURCE_JDBC_URL']
$envMap['QUARKUS_DATASOURCE_PASSWORD'] = $mysqlPwd
$envMap['MYSQL_ROOT_PASSWORD'] = $mysqlPwd
$envOut = Get-Content $envFile -Encoding UTF8 | ForEach-Object {
    $line = $_
    if ($line -match '^\s*#' -or $line.Trim() -eq '') { return $line }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return $line }
    $key = $line.Substring(0, $eq).Trim()
    if ($key -eq 'MYSQL_ROOT_PASSWORD' -and $updates.ContainsKey('MYSQL_ROOT_PASSWORD')) {
        return "MYSQL_ROOT_PASSWORD=$mysqlPwd"
    }
    if ($envMap.ContainsKey($key) -and $updates.ContainsKey($key)) { return "$key=$($updates[$key])" }
    return $line
}
if (-not ($envOut | Where-Object { $_ -match '^\s*MYSQL_ROOT_PASSWORD=' })) {
    $envOut += "MYSQL_ROOT_PASSWORD=$mysqlPwd"
}
Set-Content -Path $envFile -Value $envOut -Encoding UTF8

& (Join-Path $root 'scripts\validate-production-env.ps1')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Testar SSH...' -ForegroundColor Cyan
$sshArgs = Get-SshArgs
ssh @sshArgs "${SshUser}@${ServerIp}" "echo OK-SSH && uname -a"
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Falha SSH. Confirme IP, chave no Vultr e instancia Running.' -ForegroundColor Red
    exit 1
}

$bootstrapSh = Join-Path $root 'scripts\deploy\bootstrap-linux.sh'
$serverSetupSh = Join-Path $root 'scripts\deploy\vultr-server-setup.sh'

Write-Host 'Enviar scripts e variaveis...' -ForegroundColor Cyan
$sshArgs = Get-SshArgs
scp @sshArgs $envFile "${SshUser}@${ServerIp}:/tmp/aerosuite.env"
scp @sshArgs $prodFile "${SshUser}@${ServerIp}:/tmp/aerosuite.env.production"
Send-LfFile $bootstrapSh "${SshUser}@${ServerIp}:/tmp/bootstrap-linux.sh" $sshArgs
Send-LfFile $serverSetupSh "${SshUser}@${ServerIp}:/tmp/vultr-server-setup.sh" $sshArgs

if (-not $SkipRepoUpload) {
    Write-Host 'Empacotar e enviar codigo local...' -ForegroundColor Cyan
    $repoTar = Join-Path $env:TEMP "aerosuite-repo-$(Get-Date -Format 'yyyyMMddHHmmss').tgz"
    $exclude = @(
        '--exclude=./node_modules',
        '--exclude=./frontend/node_modules',
        '--exclude=./backend/target',
        '--exclude=./.git',
        '--exclude=./.cursor',
        '--exclude=./dist',
        '--exclude=./frontend/dist',
        '--exclude=./.env',
        '--exclude=./.env.production'
    )
    Push-Location $root
    try {
        & tar -czf $repoTar @exclude .
        if ($LASTEXITCODE -ne 0) { throw 'tar falhou ao empacotar o repositorio' }
    } finally {
        Pop-Location
    }
    scp @sshArgs $repoTar "${SshUser}@${ServerIp}:/tmp/aerosuite-repo.tgz"
    if ($LASTEXITCODE -ne 0) { throw 'scp falhou: aerosuite-repo.tgz' }
    Remove-Item $repoTar -Force -ErrorAction SilentlyContinue
}

$skipUp = [int][bool]$SkipComposeUp
Write-Host 'Executar setup remoto (Docker, repo, compose)...' -ForegroundColor Cyan
ssh @sshArgs "${SshUser}@${ServerIp}" "AEROSUITE_BRANCH='$Branch' INSTALL_DIR='$InstallDir' SKIP_COMPOSE_UP='$skipUp' bash /tmp/vultr-server-setup.sh"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host "Concluido. Teste: ssh ${SshUser}@${ServerIp} 'curl -I http://127.0.0.1:8081'" -ForegroundColor Green
Write-Host 'Cloudflare Tunnel: docs/CLOUDFLARE_TUNNEL.md' -ForegroundColor Cyan
