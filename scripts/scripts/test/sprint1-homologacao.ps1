# Homologacao Sprint 1 (Fase A): suite automatizada + checklist UI.
# Uso: .\scripts\test\sprint1-homologacao.ps1
#      .\scripts\test\sprint1-homologacao.ps1 -SkipSuite -ApiOnly

param(
    [switch]$SkipSuite,
    [switch]$SkipDockerRebuild,
    [switch]$ApiOnly
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host '=== Sprint 1 - Homologacao (Fase A) ===' -ForegroundColor Yellow
Write-Host ''

if ($ApiOnly) {
    & (Join-Path $here 'verify-flyway.ps1')
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & (Join-Path $here 'api-sprint1-organizacoes.ps1') -ProvisionDemoIfMissing
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & (Join-Path $here 'api-rbac-smoke.ps1') -ProvisionDemoIfMissing
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & (Join-Path $here 'verify-tenant-provision.ps1') -IncludeMultiTenant
    exit $LASTEXITCODE
}

if (-not $SkipSuite) {
    $suiteArgs = @{
        SkipMaven           = $true
        SkipSprint1Api      = $false
        SkipRbac            = $false
        SkipFlyway          = $false
    }
    if ($SkipDockerRebuild) { $suiteArgs['SkipDockerRebuild'] = $true }
    & (Join-Path $here 'verify-covered-suite.ps1') @suiteArgs
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ''
Write-Host 'Checklist manual (Centro de Organizacoes — A1):' -ForegroundColor Cyan
Write-Host '  1. Login admin@aerosuite.com / tenant default'
Write-Host '  2. Menu Controle de Acesso -> Organizacoes (/organizacoes)'
Write-Host '  3. Provisionar org demo (wizard 4 passos) ou validar tenant demo existente'
Write-Host '  4. Editar nome / ativo; painel KPIs; reenviar boas-vindas'
Write-Host ''
Write-Host 'Referencias:' -ForegroundColor DarkGray
Write-Host '  docs/SPRINT1-ISOLAMENTO-TENANT.md (cenarios 5-8 multi-tenant)'
Write-Host '  docs/CI-SECRETS.md (secrets GitHub A4)'
Write-Host '  docs/P0-P1-EXECUCAO.md (Flyway A2)'
Write-Host '  docs/PROXIMOS-PASSOS-DESENV.md'
exit 0
