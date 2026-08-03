# Garante tenant demo + utilizador com o mesmo e-mail em default e demo (cenário B1).
# Uso:
#   .\scripts\test\provision-tenant-demo.ps1
#   .\scripts\test\provision-multi-tenant-login-test.ps1
# Exporta na sessão:
#   AEROSUITE_TEST_MULTI_TENANT_EMAIL, AEROSUITE_TEST_MULTI_TENANT_PASSWORD

param(
    [string]$TestEmail = 'multi-tenant-test@aerosuite.local',
    [string]$TestPassword = 'admin123',
    [string]$MysqlContainer = 'aerosuite-mysql-local',
    [string]$MysqlUser = 'root',
    [string]$MysqlPassword = $(if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_ROOT_PASSWORD } else { 'root' }),
    [string]$MysqlDatabase = 'aerosuite'
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $here '..\..')
. (Join-Path $here 'Test-MysqlHelpers.ps1')

Write-Host 'Aero Suite - provision utilizador multi-tenant (login B1)' -ForegroundColor Cyan

& (Join-Path $here 'provision-tenant-demo.ps1')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$seedFile = Join-Path $root 'db\scripts\seed_multi_tenant_login_test.sql'
if (-not (Test-Path $seedFile)) {
    Write-Host "Seed nao encontrado: $seedFile" -ForegroundColor Red
    exit 1
}

try {
    Invoke-AerosuiteMysqlScriptFile -SqlFilePath $seedFile -MysqlDatabase $MysqlDatabase `
        -MysqlContainer $MysqlContainer -MysqlUser $MysqlUser -MysqlPassword $MysqlPassword
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

$checkLines = Invoke-AerosuiteMysql -Arguments @(
    $MysqlDatabase, '-N', '-e',
    "SELECT COUNT(*) FROM usuario u JOIN tenant t ON t.id = u.tenant_id WHERE u.email = '$TestEmail' AND u.ativo = 1;"
) -MysqlContainer $MysqlContainer -MysqlUser $MysqlUser -MysqlPassword $MysqlPassword
$check = if ($checkLines.Count -gt 0) { [int]$checkLines[0] } else { 0 }
if ($check -lt 2) {
    Write-Host "Esperado >= 2 linhas de usuario para $TestEmail; encontrado: $check" -ForegroundColor Red
    Write-Host 'Verifique perfil/tenant no seed (db/scripts/seed_multi_tenant_login_test.sql).' -ForegroundColor Yellow
    exit 1
}

$env:AEROSUITE_TEST_MULTI_TENANT_EMAIL = $TestEmail
$env:AEROSUITE_TEST_MULTI_TENANT_PASSWORD = $TestPassword

Write-Host ''
Write-Host 'Utilizador multi-tenant pronto.' -ForegroundColor Green
Write-Host "  AEROSUITE_TEST_MULTI_TENANT_EMAIL=$TestEmail"
Write-Host "  AEROSUITE_TEST_MULTI_TENANT_PASSWORD=$TestPassword"
Write-Host ''
Write-Host 'Validar: .\scripts\test\api-tenant-isolation.ps1' -ForegroundColor Cyan
exit 0
