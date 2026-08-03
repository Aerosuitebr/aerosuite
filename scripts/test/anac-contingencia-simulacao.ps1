# Simulação formal de contingência (REQ-026 / P-002).
# Gera ata JSON em docs/anac-conformidade/evidencias/ e opcionalmente executa smoke hangar offline.
# Uso: .\scripts\test\anac-contingencia-simulacao.ps1 [-SkipSmoke]

param(
    [switch]$SkipSmoke,
    [string]$ApiBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo,
    [string]$ResponsavelRt = 'RT (preencher)',
    [string]$ResponsavelTi = 'TI (preencher)'
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')
$root = Get-AerosuiteRepoRoot
$outDir = Join-Path $root 'docs\anac-conformidade\evidencias'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outFile = Join-Path $outDir "ata-contingencia-$stamp.json"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$started = Get-Date
$checklist = [System.Collections.Generic.List[object]]::new()

function Add-Check {
    param([string]$Step, [string]$Status, [string]$Detail = '')
    $script:checklist.Add([ordered]@{
        step   = $Step
        status = $Status
        detail = $Detail
        at     = (Get-Date).ToString('o')
    }) | Out-Null
}

Write-Host '=== Simulação contingência ANAC (P-002) ===' -ForegroundColor Yellow

$smokeOk = $true
$smokeDetail = 'skipped'
if (-not $SkipSmoke) {
    $smokePath = Join-Path $here 'api-hangar-offline-sync-smoke.ps1'
    if (Test-Path $smokePath) {
        try {
            $cfg = Get-AerosuiteTestConfig -ApiBaseUrl $ApiBaseUrl -Email $Email -Password $Password -TenantCodigo $TenantCodigo
            & $smokePath -ApiBaseUrl $cfg.ApiBaseUrl -Email $cfg.Email -Password $cfg.Password -TenantCodigo $cfg.TenantCodigo
            $smokeDetail = 'api-hangar-offline-sync-smoke.ps1 PASS'
        } catch {
            $smokeOk = $false
            $smokeDetail = $_.Exception.Message
        }
    } else {
        $smokeDetail = 'smoke script ausente'
    }
}

Add-Check -Step '1. Acionamento RT + TI documentado' -Status 'MANUAL' -Detail 'Ver 08-plano-contingencia.md §8.4'
Add-Check -Step '2. Operação manual (formulário papel)' -Status 'MANUAL' -Detail 'Formulários ANAC / MOM interno'
Add-Check -Step '3. Hangar offline — sync pós-rede' -Status $(if ($smokeOk) { 'PASS' } else { 'FAIL' }) -Detail $smokeDetail
Add-Check -Step '4. Reconciliação OS + anexos scans' -Status 'MANUAL' -Detail 'Checklist §8.4 passos 1-5'
Add-Check -Step '5. Registro evento SGQ / NC leve' -Status 'MANUAL' -Detail 'Qualidade registra após reconciliação'

$ended = Get-Date
$report = [ordered]@{
    schema       = 'aerosuite-anac-ata-contingencia-v1'
    reqId        = 'REQ-026'
    roadmapItem  = 'P-002'
    generatedAt  = $ended.ToString('o')
    durationSec  = [math]::Round(($ended - $started).TotalSeconds, 1)
    referencia   = 'docs/anac-conformidade/08-plano-contingencia.md'
    responsaveis = [ordered]@{
        rt = $ResponsavelRt
        ti = $ResponsavelTi
    }
    assinaturasPendentes = @('RT', 'Coordenador produção', 'TI')
    checklist            = $checklist
    resultado            = $(if ($smokeOk) { 'APTO_PARA_ASSINATURA' } else { 'REVISAR_SMOKE' })
    proximaAcao          = 'Exportar PDF assinado: evidencias/ata-contingencia-YYYYMMDD.pdf'
}

$report | ConvertTo-Json -Depth 6 | Set-Content -Path $outFile -Encoding UTF8
Write-Host "Ata JSON: $outFile" -ForegroundColor Green
if (-not $smokeOk) { exit 1 }
exit 0
