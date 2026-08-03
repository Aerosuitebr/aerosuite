# Guia e registro de evidência para teste de restauração em homologação (VAL-19 / REQ-022).
# Uso:
#   .\scripts\test\anac-restore-homologacao-guia.ps1                    # imprime checklist
#   .\scripts\test\anac-restore-homologacao-guia.ps1 -RecordOnly -BackupId 42 -RtoMin 15

param(
    [string]$HomologDbHost = 'localhost',
    [int]$HomologDbPort = 3306,
    [string]$HomologDbName = 'aerosuite_homolog',
    [string]$BackupDir = '',
    [string]$BackupId = '',
    [int]$RtoMin = 0,
    [string]$OsAmostra = '',
    [switch]$RecordOnly
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')
$root = Get-AerosuiteRepoRoot
$outDir = Join-Path $root 'docs\anac-conformidade\evidencias'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

if (-not $BackupDir) {
    $BackupDir = Join-Path $root 'backups\homolog-restore-test'
}

$steps = @(
    '1. Agendar janela com TI e RT; comunicar indisponibilidade do ambiente homologação.'
    '2. Identificar backup válido (API GET /api/admin/backup ou último agendado). Anotar backupId e caminho do arquivo .sql.gz.'
    "3. Parar API homologação (evitar escrita durante restore)."
    "4. Criar snapshot ou dump de segurança do estado atual (opcional, recomendado)."
    "5. Restaurar no MySQL homologação ($HomologDbHost`:$HomologDbPort / $HomologDbName):"
    '     mysql -h HOST -P PORT -u USER -p DB < backup.sql   (ou gunzip -c backup.sql.gz | mysql ...)'
    '6. Reiniciar API; aguardar health check.'
    '7. Login com usuário piloto; abrir OS amostra e validar CRS, anexos e job card.'
    '8. Exportar dossiê PDF/ZIP da OS amostra e comparar com pré-restore.'
    '9. Anexar log do cliente MySQL (saída do restore) em evidencias/restore-homolog-*/'
    '10. Preencher ata-backup-restore-*.md (seção homologação) e coletar assinaturas TI + RT.'
)

Write-Host '=== VAL-19 — Restore backup em homologação ===' -ForegroundColor Yellow
Write-Host ''
foreach ($s in $steps) {
    Write-Host "  $s"
}
Write-Host ''
Write-Host "Diretório sugerido para logs: $BackupDir" -ForegroundColor Cyan
Write-Host 'Documentação: docs/anac-conformidade/21-pendencias-acoes-certificacao.md (VAL-M2)' -ForegroundColor Cyan

if (-not $RecordOnly) {
    Write-Host ''
    Write-Host 'Execute o restore manualmente e rode novamente com -RecordOnly após concluir.' -ForegroundColor Gray
    exit 0
}

if ([string]::IsNullOrWhiteSpace($BackupId)) {
    Write-Host 'AVISO: BackupId nao informado — registro de procedimento VAL-19 (homologacao).' -ForegroundColor Yellow
    $BackupId = 'N/A'
}

$recordDir = Join-Path $outDir "restore-homolog-$stamp"
New-Item -ItemType Directory -Path $recordDir -Force | Out-Null

$ata = [ordered]@{
    schema            = 'aerosuite-anac-restore-homolog-v1'
    generatedAt       = (Get-Date).ToString('o')
    reqId             = 'REQ-022'
    valId             = 'VAL-19'
    homologDbHost     = $HomologDbHost
    homologDbPort     = $HomologDbPort
    homologDbName     = $HomologDbName
    backupId          = $BackupId
    rtoRestoreMin     = $RtoMin
    osAmostra         = $OsAmostra
    restoreTestStatus = 'EXECUTADO_HOMOLOG'
    responsavelTi     = ''
    checklist         = $steps
    evidenciaDir      = $recordDir
    proximaAcao       = 'Anexar mysql-restore.log neste diretório e assinar ata-backup-restore PDF'
}

$jsonPath = Join-Path $recordDir 'ata-restore-homolog.json'
$ata | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding UTF8

$readme = @"
# Evidência restore homologação — $stamp

- Backup ID: $BackupId
- RTO (min): $RtoMin
- OS amostra: $OsAmostra

## Anexar aqui

- `mysql-restore.log` — saída do comando de restore
- Capturas de tela login + OS (opcional)
- Cópia do dossiê PDF pós-restore

## Assinatura

Usar seção de homologação em `ata-backup-restore-*.md` gerado por `anac-exportar-documentos-certificacao.ps1`.
"@

$readme | Set-Content -Path (Join-Path $recordDir 'README.md') -Encoding UTF8

Write-Host ''
Write-Host "Registro criado: $jsonPath" -ForegroundColor Green
Write-Host "Anexe mysql-restore.log em: $recordDir" -ForegroundColor Green
