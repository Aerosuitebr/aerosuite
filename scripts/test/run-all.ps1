# Executa validação de ambiente, testes Maven (backend), build frontend e smoke/stress HTTP.
# Uso: .\scripts\test\run-all.ps1
#      .\scripts\test\run-all.ps1 -SkipStress -SkipFrontendBuild

param(
    [switch]$SkipMaven,
    [switch]$SkipFrontendBuild,
    [switch]$SkipSmoke,
    [switch]$SkipStress,
    [switch]$SkipE2E,
    [switch]$SkipTenantIsolation,
    [switch]$SkipRbac,
    [switch]$SkipSprint1Api,
    [switch]$SkipFlyway,
    [switch]$SkipMenuAudit,
    [switch]$ProvisionDemoTenant,
    [switch]$SkipEnvValidation,
    [int]$StressWorkers = 15,
    [int]$StressRounds = 25
)

$ErrorActionPreference = 'Stop'
$testDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $testDir 'Test-ApiHelpers.ps1')
$root = Get-AerosuiteRepoRoot
$failed = $false

function Invoke-Step {
    param([string]$Title, [scriptblock]$Action)
    Write-Host ''
    Write-Host "=== $Title ===" -ForegroundColor Cyan
    try {
        & $Action
        if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
            throw "Exit code $LASTEXITCODE"
        }
        Write-Host "OK: $Title" -ForegroundColor Green
    } catch {
        Write-Host "FALHA: $Title - $($_.Exception.Message)" -ForegroundColor Red
        $script:failed = $true
    }
}

Write-Host 'Aero Suite - run-all (testes automatizados)' -ForegroundColor Yellow

if (-not $SkipEnvValidation) {
    Invoke-Step 'Validar .env' {
        & (Join-Path $root 'scripts\validate-env.ps1')
    }
}

if (-not $SkipMaven) {
    Invoke-Step 'Backend: mvn test' {
        Push-Location (Join-Path $root 'backend')
        $settings = Join-Path (Get-Location) 'settings.xml'
        if (Test-Path $settings) { mvn -B -s settings.xml test }
        else { mvn -B test }
        Pop-Location
    }
}

if (-not $SkipFrontendBuild) {
    Invoke-Step 'Frontend: npm run build' {
        Push-Location (Join-Path $root 'frontend')
        if (-not (Test-Path 'node_modules')) { npm ci }
        npm run build
        Pop-Location
    }
}

if (-not $SkipMenuAudit) {
    Invoke-Step 'Auditoria menu i18n' {
        & (Join-Path $testDir 'audit-menu-i18n.ps1')
    }
    Invoke-Step 'Auditoria i18n P3' {
        & (Join-Path $testDir 'audit-p3-i18n.ps1')
    }
}

if (-not $SkipFlyway) {
    Invoke-Step 'Flyway V8-V19' {
        & (Join-Path $testDir 'verify-flyway.ps1')
    }
}

Invoke-Step 'P3 smoke (Bling, LGPD, billing)' {
    & (Join-Path $testDir 'api-p3-smoke.ps1') -ProvisionDemoIfMissing
}

if (-not $SkipSmoke) {
    Invoke-Step 'API smoke (HTTP)' {
        & (Join-Path $testDir 'api-smoke.ps1')
    }
}

if (-not $SkipRbac) {
    Invoke-Step 'RBAC servidor' {
        $rbacArgs = @{ ProvisionDemoIfMissing = $true }
        & (Join-Path $testDir 'api-rbac-smoke.ps1') @rbacArgs
    }
}

if (-not $SkipSprint1Api) {
    Invoke-Step 'Sprint 1 Centro de Organizacoes (API)' {
        & (Join-Path $testDir 'api-sprint1-organizacoes.ps1') -ProvisionDemoIfMissing
    }
}

if (-not $SkipStress) {
    Invoke-Step 'API stress (HTTP)' {
        & (Join-Path $testDir 'api-stress.ps1') -Workers $StressWorkers -Rounds $StressRounds
    }
}

if (-not $SkipE2E) {
    Invoke-Step 'E2E Playwright' {
        Push-Location (Join-Path $root 'e2e')
        if (-not (Test-Path 'node_modules')) { npm install }
        if (-not $env:CI) { npx playwright install chromium 2>$null }
        npm test
        Pop-Location
    }
}

if ($ProvisionDemoTenant -or -not $SkipTenantIsolation) {
    if ($ProvisionDemoTenant) {
        Invoke-Step 'Provisionar tenant demo' {
            & (Join-Path $testDir 'provision-tenant-demo.ps1') -ResetPasswordIfExists
        }
    }
    if (-not $SkipTenantIsolation) {
        Invoke-Step 'Isolamento multi-tenant' {
            if ($ProvisionDemoTenant) {
                & (Join-Path $testDir 'verify-tenant-provision.ps1') -IncludeMultiTenant
            } else {
                $isoArgs = @{ ProvisionDemoIfMissing = $true }
                & (Join-Path $testDir 'api-tenant-isolation.ps1') @isoArgs
            }
        }
    }
}

Write-Host ''
if ($failed) {
    Write-Host 'run-all: uma ou mais etapas falharam.' -ForegroundColor Red
    exit 1
}
Write-Host 'run-all: todas as etapas concluidas com sucesso.' -ForegroundColor Green
exit 0
