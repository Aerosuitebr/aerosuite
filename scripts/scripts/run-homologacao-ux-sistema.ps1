# Sanitiza tenant de homologação + verifica apontamentos UX do app (§3.5).
# Uso: .\scripts\run-homologacao-ux-sistema.ps1
# Env: AEROSUITE_APP_URL, AEROSUITE_APP_EMAIL, AEROSUITE_APP_PASSWORD, AEROSUITE_APP_TENANT

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

. (Join-Path $root 'scripts\test\Test-MysqlHelpers.ps1')

Write-Host '>> SQL: sanitize-demo-tenant-homologacao.sql' -ForegroundColor Cyan
Invoke-AerosuiteMysqlScriptFile -SqlFilePath (Join-Path $root 'db\scripts\sanitize-demo-tenant-homologacao.sql')

Write-Host '>> Playwright: verify-system-ux-report.mjs' -ForegroundColor Cyan
node (Join-Path $root 'scripts\verify-system-ux-report.mjs')
if ($LASTEXITCODE -ne 0) {
    throw 'Verificacao UX sistema falhou - ver scripts\.verify-system-ux-report.json'
}
Write-Host '>> Homologacao UX sistema: 12/12 OK' -ForegroundColor Green
