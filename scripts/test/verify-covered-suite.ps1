# Fecha pendencias dos 5 pilares: menu i18n, smoke/stress, E2E, isolamento, provisao tenant.
# Uso: .\scripts\test\verify-covered-suite.ps1

param(
    [switch]$SkipDockerRebuild,
    [switch]$SkipStress,
    [switch]$SkipMaven,
    [switch]$SkipFlyway,
    [switch]$SkipSprint1Api,
    [switch]$SkipRbac
)

$ErrorActionPreference = 'Stop'
$testDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $testDir 'Test-ApiHelpers.ps1')
$root = Get-AerosuiteRepoRoot
$failed = $false

function Step {
    param([string]$Name, [scriptblock]$Action)
    Write-Host ''
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
        Write-Host "FALHA: $Name" -ForegroundColor Red
        $script:failed = $true
        return
    }
    Write-Host "OK: $Name" -ForegroundColor Green
}

Write-Host 'Aero Suite - verify covered suite' -ForegroundColor Yellow

if (-not $SkipDockerRebuild) {
    Step 'Docker rebuild api + web' {
        Push-Location $root
        docker compose build api web
        docker compose up -d --force-recreate api web
        Pop-Location
        & (Join-Path $testDir 'wait-api-ready.ps1')
        if ($LASTEXITCODE -ne 0) { throw 'API nao respondeu apos rebuild' }
    }
}

Step 'Auditoria menu i18n' {
    & (Join-Path $testDir 'audit-menu-i18n.ps1')
}

Step 'Auditoria i18n P3' {
    & (Join-Path $testDir 'audit-p3-i18n.ps1')
}

if (-not $SkipMaven) {
    Step 'Backend mvn test' {
        Push-Location (Join-Path $root 'backend')
        if (Test-Path 'settings.xml') { mvn -B -q -s settings.xml test }
        else { mvn -B -q test }
        Pop-Location
    }
}

if (-not $SkipFlyway) {
    Step 'Flyway V8+ (auto V60)' {
        & (Join-Path $testDir 'verify-flyway.ps1')
    }
}

Step 'P3 smoke (Bling, LGPD tenant, billing)' {
    & (Join-Path $testDir 'api-p3-smoke.ps1') -ProvisionDemoIfMissing
}

Step 'Comercial integrations smoke' {
    & (Join-Path $testDir 'api-comercial-smoke.ps1') -ProvisionDemoIfMissing
}

Step 'Portal externo propostas smoke (P4.2)' {
    & (Join-Path $testDir 'api-externo-portal-smoke.ps1') -ProvisionDemoIfMissing
}

Step 'Bling integration smoke' {
    & (Join-Path $testDir 'api-bling-smoke.ps1') -ProvisionDemoIfMissing
}

Step 'Estoque invoice auditoria smoke' {
    & (Join-Path $testDir 'api-estoque-invoice-smoke.ps1')
    Step 'Sistema config smoke' {
    & (Join-Path $testDir 'api-sistema-config-smoke.ps1')
    }
}

Step 'API smoke' {
    & (Join-Path $testDir 'api-smoke.ps1')
}

Step 'Conformidade Onda D smoke (V58)' {
    & (Join-Path $testDir 'api-conformidade-onda-d-smoke.ps1')
}

Step 'Hangar offline sync smoke (P2)' {
    & (Join-Path $testDir 'api-hangar-offline-sync-smoke.ps1')
}

Step 'Conformidade enforcement smoke (P4)' {
    & (Join-Path $testDir 'api-conformidade-enforcement-smoke.ps1')
}

Step 'Conformidade SMS + relatórios SGQ smoke (P5.3/P5.4)' {
    & (Join-Path $testDir 'api-conformidade-relatorios-smoke.ps1')
}

if (-not $SkipRbac) {
    Step 'RBAC servidor' {
        & (Join-Path $testDir 'api-rbac-smoke.ps1') -ProvisionDemoIfMissing
    }
}

Step 'P1 LGPD billing signup' {
    & (Join-Path $testDir 'api-p1-smoke.ps1') -SkipSignup
}

if (-not $SkipSprint1Api) {
    Step 'Sprint 1 Centro de Organizacoes (API)' {
        & (Join-Path $testDir 'api-sprint1-organizacoes.ps1') -ProvisionDemoIfMissing
    }
}

if (-not $SkipStress) {
    Step 'API stress' {
        & (Join-Path $testDir 'api-stress.ps1') -Workers 15 -Rounds 25
    }
}

Step 'Provisao + isolamento tenant' {
    & (Join-Path $testDir 'verify-tenant-provision.ps1') -IncludeMultiTenant
}

Step 'E2E Playwright' {
    & (Join-Path $testDir 'wait-api-ready.ps1')
    if ($LASTEXITCODE -ne 0) { throw 'API nao respondeu antes do E2E' }
    & (Join-Path $testDir 'provision-e2e-hangar-os.ps1')
    Push-Location (Join-Path $root 'e2e')
    if (-not (Test-Path 'node_modules')) { npm install }
    npx playwright install chromium 2>$null
    $workers = if ($env:PLAYWRIGHT_WORKERS) { $env:PLAYWRIGHT_WORKERS } else { '1' }
    npx playwright test --workers=$workers
    Pop-Location
}

if ($failed) {
    Write-Host ''
    Write-Host 'Suite FALHOU.' -ForegroundColor Red
    exit 1
}
Write-Host ''
Write-Host 'Suite OK - pendencias dos 5 pilares fechadas.' -ForegroundColor Green
exit 0
