# Consolida testes regulatórios (ANAC / Part 145) e grava relatório JSON.
# Uso: .\scripts\test\anac-conformidade-evidencias.ps1
#      .\scripts\test\anac-conformidade-evidencias.ps1 -SkipMaven -SkipE2E
#      .\scripts\test\anac-conformidade-evidencias.ps1 -SkipIT   # só testes unitários (sem Quarkus IT)

param(
    [switch]$SkipMaven,
    [switch]$SkipIT,
    [switch]$SkipSmokes,
    [switch]$SkipE2E,
    [switch]$SkipFlyway,
    [string]$ApiBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')
$root = Get-AerosuiteRepoRoot
$outDir = Join-Path $root 'docs\anac-conformidade\evidencias'
$outFile = Join-Path $outDir 'ultima-execucao.json'

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$started = Get-Date
$steps = [System.Collections.Generic.List[object]]::new()
$failed = 0
$passed = 0

function Add-StepResult {
    param(
        [string]$Id,
        [string]$Name,
        [string]$Category,
        [string]$Status,
        [string]$Detail = '',
        [string[]]$ReqIds = @()
    )
    $script:steps.Add([ordered]@{
        id       = $Id
        name     = $Name
        category = $Category
        status   = $Status
        detail   = $Detail
        reqIds   = $ReqIds
        at       = (Get-Date).ToString('o')
    }) | Out-Null
    if ($Status -eq 'PASS') { $script:passed++ } elseif ($Status -eq 'FAIL') { $script:failed++ }
}

function Invoke-Step {
    param(
        [string]$Id,
        [string]$Name,
        [string]$Category,
        [string[]]$ReqIds,
        [scriptblock]$Action
    )
    Write-Host "[$Id] $Name" -ForegroundColor Cyan
    try {
        # Evita LASTEXITCODE vazado de passos anteriores (ex.: smoke com exit 1)
        cmd /c exit 0 2>$null | Out-Null
        & $Action
        if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
            throw "Exit code $LASTEXITCODE"
        }
        Add-StepResult -Id $Id -Name $Name -Category $Category -Status 'PASS' -ReqIds $ReqIds
        Write-Host "  PASS" -ForegroundColor Green
    } catch {
        Add-StepResult -Id $Id -Name $Name -Category $Category -Status 'FAIL' -Detail $_.Exception.Message -ReqIds $ReqIds
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ''
Write-Host '=== Aero Suite — evidências conformidade ANAC ===' -ForegroundColor Yellow
Write-Host "Saída: $outFile"
Write-Host ''

$mavenUnitTests = @(
    'Part145CrsSegregationTest',
    'Part145CrsSegregationEmitTest',
    'ConformidadeEnforcementTest',
    'CertificadoPecaUtilTest',
    'DossieAuditoriaLabelsTest',
    'OsRegistroEncerradoGuardTest',
    'TotpServiceTest',
    'MfaPolicyServiceTest',
    'OsTarefaDadoTecnicoServiceTest',
    'JobCardAssinaturaIntegrityTest',
    'ConformidadeChecklistJsonTest'
)

$mavenItTests = @(
    'ConformidadeEnforcementP1IT',
    'ConformidadeApiAuthIT',
    'ConformidadeOndaDFunctionalIT',
    'JobCardAssinaturaIntegrityIT'
)

function Invoke-MavenConformidadeTests {
    param([string[]]$Tests)
    $settings = Join-Path $root 'backend\settings.xml'
    Push-Location (Join-Path $root 'backend')
    try {
        $list = ($Tests -join ',')
        # -s explícito: Quarkus IT não herda sempre .mvn/maven.config; evita mirror Nexus global
        mvn -s $settings -q test "-Dtest=$list"
    } finally {
        Pop-Location
    }
}

if (-not $SkipMaven) {
    $unitList = ($mavenUnitTests -join ',')
    Invoke-Step -Id 'MVN-01' -Name "Maven unit: $unitList" -Category 'junit' -ReqIds @('REQ-002','REQ-005','REQ-010','REQ-014','REQ-016','REQ-017','REQ-018','REQ-019','REQ-001','REQ-008') -Action {
        Invoke-MavenConformidadeTests -Tests $mavenUnitTests
    }
    if (-not $SkipIT) {
        $itList = ($mavenItTests -join ',')
        Invoke-Step -Id 'MVN-02' -Name "Maven IT: $itList" -Category 'junit' -ReqIds @('REQ-008','REQ-010','REQ-016','REQ-017','REQ-019') -Action {
            Invoke-MavenConformidadeTests -Tests $mavenItTests
        }
    } else {
        Add-StepResult -Id 'MVN-02' -Name 'Maven IT (skipped)' -Category 'junit' -Status 'SKIP' -ReqIds @()
    }
} else {
    Add-StepResult -Id 'MVN-01' -Name 'Maven conformidade (skipped)' -Category 'junit' -Status 'SKIP' -ReqIds @()
    Add-StepResult -Id 'MVN-02' -Name 'Maven IT (skipped)' -Category 'junit' -Status 'SKIP' -ReqIds @()
}

if (-not $SkipFlyway) {
    Invoke-Step -Id 'FLY-01' -Name 'verify-flyway.ps1' -Category 'infra' -ReqIds @('REQ-028') -Action {
        & (Join-Path $here 'verify-flyway.ps1')
    }
}

if (-not $SkipSmokes) {
    $apiForWait = if ($ApiBaseUrl) { $ApiBaseUrl } else { 'http://localhost:8080' }
    try {
        Wait-AerosuiteApiReady -ApiBaseUrl $apiForWait | Out-Null
    } catch {
        Add-StepResult -Id 'API-01' -Name 'API pronta pós-Maven' -Category 'infra' -Status 'FAIL' -Detail $_.Exception.Message -ReqIds @()
        Write-Host "  API wait FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
    $smokes = @(
        @{ Script = 'api-rbac-smoke.ps1';           Id = 'SMK-01'; Name = 'RBAC smoke';           Req = @('REQ-010') },
        @{ Script = 'api-tenant-isolation.ps1';    Id = 'SMK-02'; Name = 'Tenant isolation';     Req = @('REQ-012') },
        @{ Script = 'api-conformidade-enforcement-smoke.ps1'; Id = 'SMK-03'; Name = 'Enforcement smoke'; Req = @('REQ-017','REQ-018','REQ-021') },
        @{ Script = 'api-conformidade-relatorios-smoke.ps1'; Id = 'SMK-04'; Name = 'Relatórios SGQ smoke'; Req = @('REQ-025') },
        @{ Script = 'api-hangar-offline-sync-smoke.ps1'; Id = 'SMK-05'; Name = 'Hangar offline sync'; Req = @('REQ-004') }
    )
    foreach ($s in $smokes) {
        $path = Join-Path $here $s.Script
        if (-not (Test-Path $path)) {
            Add-StepResult -Id $s.Id -Name $s.Name -Category 'smoke' -Status 'SKIP' -Detail "Script não encontrado: $($s.Script)" -ReqIds $s.Req
            continue
        }
        Invoke-Step -Id $s.Id -Name $s.Name -Category 'smoke' -ReqIds $s.Req -Action {
            $apiWait = if ($ApiBaseUrl) { $ApiBaseUrl } else { 'http://localhost:8080' }
            Wait-AerosuiteApiReady -ApiBaseUrl $apiWait -MaxWaitSec 90 | Out-Null
            $smokeParams = @{}
            foreach ($k in @('ApiBaseUrl', 'Email', 'Password', 'TenantCodigo')) {
                $val = (Get-Variable -Name $k -ValueOnly -ErrorAction SilentlyContinue)
                if ($val) { $smokeParams[$k] = $val }
            }
            if ($s.Script -eq 'api-tenant-isolation.ps1') {
                $smokeParams['ProvisionDemoIfMissing'] = $true
            }
            & $path @smokeParams
            Start-Sleep -Seconds 2
        }
    }
}

Invoke-Step -Id 'DOC-01' -Name 'Simulação contingência (ata JSON)' -Category 'doc' -ReqIds @('REQ-026') -Action {
    & (Join-Path $here 'anac-contingencia-simulacao.ps1') -SkipSmoke:$(if ($SkipSmokes) { $true } else { $false }) `
        -ApiBaseUrl $ApiBaseUrl -Email $Email -Password $Password -TenantCodigo $TenantCodigo
}

if (-not $SkipSmokes) {
    Invoke-Step -Id 'DOC-02' -Name 'Evidência backup/restore (ata JSON)' -Category 'doc' -ReqIds @('REQ-022') -Action {
        & (Join-Path $here 'anac-backup-restore-evidencia.ps1') `
            -ApiBaseUrl $ApiBaseUrl -Email $Email -Password $Password -TenantCodigo $TenantCodigo
    }
}

if (-not $SkipE2E) {
    $e2eDir = Join-Path $root 'e2e'
    if (Test-Path $e2eDir) {
        Invoke-Step -Id 'E2E-01' -Name 'Playwright conformidade + hangar offline' -Category 'e2e' -ReqIds @('REQ-004','REQ-017') -Action {
            Push-Location $e2eDir
            try {
                if (-not (Test-Path 'node_modules')) {
                    npm ci --silent 2>$null
                }
                npx playwright test conformidade-painel-hangar.spec.ts hangar-offline.spec.ts --reporter=line
            } finally {
                Pop-Location
            }
        }
    } else {
        Add-StepResult -Id 'E2E-01' -Name 'Playwright (pasta e2e ausente)' -Category 'e2e' -Status 'SKIP'
    }
}

$ended = Get-Date
$report = [ordered]@{
    schema      = 'aerosuite-anac-evidencias-v1'
    generatedAt = $ended.ToString('o')
    durationSec = [math]::Round(($ended - $started).TotalSeconds, 1)
    dossiePath  = 'docs/anac-conformidade'
    matriz      = 'docs/anac-conformidade/03-matriz-requisitos.csv'
    summary     = [ordered]@{
        pass = $passed
        fail = $failed
        skip = ($steps | Where-Object { $_.status -eq 'SKIP' }).Count
        total = $steps.Count
    }
    readyForAnacSubmission = ($failed -eq 0)
    blockersIfAny = @(
        'Processo organizacional: ver docs/anac-conformidade/21-pendencias-acoes-certificacao.md',
        'Assinaturas RT/TI/Qualidade (escopo, relatorio, atas) e restore homologacao VAL-19'
    )
    steps = $steps
}

$json = $report | ConvertTo-Json -Depth 6
Set-Content -Path $outFile -Value $json -Encoding UTF8

Write-Host ''
Write-Host "Resumo: PASS=$passed FAIL=$failed -> $outFile" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Red' })
if ($failed -gt 0) { exit 1 }
