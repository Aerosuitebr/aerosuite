# Provisiona wcag-auditor@aerosuite.com.br (perfil = admin, MFA off) em homologação.
# Uso:
#   .\scripts\provision-wcag-auditor-homologacao.ps1
#   .\scripts\provision-wcag-auditor-homologacao.ps1 -MySqlHost localhost -MySqlUser root

param(
    [string]$MySqlHost = 'localhost',
    [int]$MySqlPort = 3306,
    [string]$MySqlUser = 'root',
    [string]$MySqlPassword = '',
    [string]$Database = 'aerosuite',
    [string]$DockerContainer = ''
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyScriptInvocation.MyCommand.Path)
$sql = Join-Path $root 'db\scripts\provision-wcag-auditor-homologacao.sql'

if (-not (Test-Path $sql)) {
    throw "SQL não encontrado: $sql"
}

if ($DockerContainer) {
    Get-Content $sql -Raw | docker exec -i $DockerContainer mysql -u$MySqlUser "-p$MySqlPassword" $Database
} elseif ($MySqlPassword) {
    Get-Content $sql -Raw | mysql -h $MySqlHost -P $MySqlPort -u$MySqlUser "-p$MySqlPassword" $Database
} else {
    Get-Content $sql -Raw | mysql -h $MySqlHost -P $MySqlPort -u$MySqlUser $Database
}

Write-Host 'Conta wcag-auditor@aerosuite.com.br provisionada (perfil = admin, MFA off).' -ForegroundColor Green
Write-Host 'Login: tenant default · senha documentada no cabeçalho de provision-wcag-auditor-homologacao.sql' -ForegroundColor Cyan
