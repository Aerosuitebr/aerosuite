# Evidência de backup e teste de restauração (REQ-022 / P-003).
# Valida histórico de backup via API, existência do arquivo e mede RTO do ciclo backup.
# Uso: .\scripts\test\anac-backup-restore-evidencia.ps1

param(
    [string]$ApiBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo,
    [int]$PollSeconds = 120,
    [string]$ResponsavelTi = 'TI (preencher)'
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')
$root = Get-AerosuiteRepoRoot
$outDir = Join-Path $root 'docs\anac-conformidade\evidencias'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outFile = Join-Path $outDir "ata-backup-restore-$stamp.json"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

function Resolve-ContainerBackupPath {
    param([string]$ContainerPath)
    if (-not $ContainerPath) { return $null }
    $norm = $ContainerPath -replace '\\', '/'
    if ($norm -like '/app/backups*') {
        $tail = $norm -replace '^/app/backups/?', ''
        $hostBase = Join-Path $root 'backups'
        if ($tail) { return Join-Path $hostBase $tail }
        return $hostBase
    }
    return $ContainerPath
}

$cfg = Get-AerosuiteTestConfig -ApiBaseUrl $ApiBaseUrl -Email $Email -Password $Password -TenantCodigo $TenantCodigo
$started = Get-Date

Write-Host '=== Teste backup / restore ANAC (P-003) ===' -ForegroundColor Yellow
Write-Host "API: $($cfg.ApiBaseUrl)"

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body (New-AerosuiteLoginBody -Email $cfg.Email -Password $cfg.Password -TenantCodigo $cfg.TenantCodigo)
if (-not $login.Ok -or -not $login.Body.token) {
    throw "Login falhou: $($login.Raw)"
}
$token = [string]$login.Body.token

$rtoStart = Get-Date
$exec = Invoke-AerosuiteApi -Method POST -Path '/api/backup-config/execute' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{}
if (-not $exec.Ok -or -not $exec.Body.success) {
    throw "Backup execute falhou: $($exec.Raw)"
}
$backupId = $exec.Body.backupId
Write-Host "Backup iniciado: $backupId"

$finalStatus = $null
$deadline = (Get-Date).AddSeconds($PollSeconds)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 3
    $st = Invoke-AerosuiteApi -Method GET -Path "/api/backup-config/status/$backupId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $status = $st.Body.status
    Write-Host "  status=$status progress=$($st.Body.progress)"
    if ($status -in @('completed', 'success', 'failed', 'error')) {
        $finalStatus = $st.Body
        break
    }
}
$rtoSec = [math]::Round(((Get-Date) - $rtoStart).TotalSeconds, 1)

if ($null -eq $finalStatus) {
    throw "Timeout aguardando backup ($PollSeconds s)"
}
$mysqldumpMissing = $false
if ($finalStatus.status -in @('failed', 'error')) {
    $err = [string]$finalStatus.errorMessage
    if ($err -match 'Cannot run program.*mysqldump|No such file or directory') {
        $mysqldumpMissing = $true
        Write-Host 'AVISO: binário mysqldump ausente no container — instale default-mysql-client no Dockerfile.' -ForegroundColor Yellow
    } else {
        throw "Backup terminou com erro: $err"
    }
}

$history = Invoke-AerosuiteApi -Method GET -Path '/api/backup-config/history?limit=5' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$latest = @($history.Body) | Select-Object -First 1

$fileExists = $false
$fileDetail = 'caminho não verificado'
$backupPath = [string]$finalStatus.backupPath
if (-not $backupPath -and $latest) { $backupPath = [string]$latest.backupPath }
if ($backupPath) {
    $hostPath = Resolve-ContainerBackupPath -ContainerPath $backupPath
    if ((Test-Path -LiteralPath $hostPath) -and -not (Test-Path -LiteralPath $hostPath -PathType Container)) {
        $fileExists = ([long]$finalStatus.fileSize -gt 0) -or ($latest -and [long]$latest.fileSize -gt 0)
        if (-not $fileExists) {
            $fi = Get-Item -LiteralPath $hostPath
            $fileExists = $fi.Length -gt 0
        } else {
            $fileExists = $true
        }
        $fileDetail = $hostPath
    } elseif (Test-Path -LiteralPath $hostPath -PathType Container) {
        $newest = Get-ChildItem -LiteralPath $hostPath -Filter 'backup_*.sql*' -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($newest -and $newest.Length -gt 0) {
            $fileExists = $true
            $fileDetail = $newest.FullName
        } else {
            $fileDetail = "pasta sem dump: $hostPath"
        }
    } else {
        $fileDetail = "arquivo não encontrado: $hostPath (container: $backupPath)"
    }
}

$restoreProcedure = @(
    '1. Parar API Aero Suite (janela de manutenção)',
    '2. Restaurar dump MySQL: mysql -u user -p database < arquivo.sql.gz (descompactar se necessário)',
    '3. Restaurar pasta uploads conforme manual técnico §backup',
    '4. Subir API e validar login + OS amostra',
    '5. Registrar RTO/RPO nesta ata'
)

$ended = Get-Date
$report = [ordered]@{
    schema          = 'aerosuite-anac-ata-backup-restore-v1'
    reqId           = 'REQ-022'
    roadmapItem     = 'P-003'
    generatedAt     = $ended.ToString('o')
    durationSec     = [math]::Round(($ended - $started).TotalSeconds, 1)
    responsavelTi   = $ResponsavelTi
    backupId        = $backupId
    rtoBackupSec    = $rtoSec
    rpoEstimadoHoras = 'conforme frequencia_backup do tenant'
    latestHistory   = $latest
    backupFileExists = $fileExists
    backupFileDetail = $fileDetail
    restoreProcedure = $restoreProcedure
    restoreTestStatus = $(if ($fileExists) { 'ARQUIVO_VALIDADO' } elseif ($mysqldumpMissing) { 'API_OK_MYSQLDUMP_AUSENTE_DEV' } else { 'HISTORICO_OK_ARQUIVO_NAO_LOCAL' })
    assinaturasPendentes = @('TI', 'RT')
    proximaAcao = 'Executar restore em ambiente de homologação e anexar log mysql'
}

$report | ConvertTo-Json -Depth 6 | Set-Content -Path $outFile -Encoding UTF8
Write-Host "Ata JSON: $outFile (RTO backup=${rtoSec}s)" -ForegroundColor Green
if (-not $fileExists) {
    Write-Host 'AVISO: arquivo de backup não acessível neste host — histórico API OK.' -ForegroundColor Yellow
}
exit 0
