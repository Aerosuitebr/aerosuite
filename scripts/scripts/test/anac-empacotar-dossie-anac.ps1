# Empacota dossiê ANAC + evidências para submissão.
# Uso: .\scripts\test\anac-empacotar-dossie-anac.ps1 [-Stamp yyyyMMdd]

param([string]$Stamp = '')

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')
$root = Get-AerosuiteRepoRoot
$evDir = Join-Path $root 'docs\anac-conformidade\evidencias'
$dossieDir = Join-Path $root 'docs\anac-conformidade'

if (-not $Stamp) { $Stamp = Get-Date -Format 'yyyyMMdd' }
$zipPath = Join-Path $evDir "pacote-dossie-anac-$Stamp.zip"

if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force }

$includes = @(
    (Join-Path $dossieDir '*.md'),
    (Join-Path $dossieDir 'templates\*'),
    (Join-Path $dossieDir '03-matriz-requisitos.csv'),
    (Join-Path $evDir 'ultima-execucao.json'),
    (Join-Path $evDir 'fechamento-pendencias-*.json'),
    (Join-Path $evDir 'status-certificacao-*.json'),
    (Join-Path $evDir 'escopo-assinado-*.md'),
    (Join-Path $evDir 'escopo-piloto-assinado-*.md'),
    (Join-Path $evDir 'relatorio-validacao-*.md'),
    (Join-Path $evDir 'ata-contingencia-*.md'),
    (Join-Path $evDir 'ata-backup-restore-*.md'),
    (Join-Path $evDir 'organizacao\*'),
    (Join-Path $evDir 'submissao\*'),
    (Join-Path $evDir 'aceites\*'),
    (Join-Path $evDir 'restore-homolog-*\*')
)

$tempList = Join-Path $env:TEMP "anac-dossie-files-$Stamp.txt"
$files = @()
foreach ($pattern in $includes) {
    $files += Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
}
$files = $files | Sort-Object FullName -Unique
if ($files.Count -eq 0) { throw 'Nenhum arquivo para empacotar' }

$files.FullName | Set-Content -Path $tempList -Encoding UTF8
Compress-Archive -Path $files.FullName -DestinationPath $zipPath -Force
Remove-Item -LiteralPath $tempList -Force -ErrorAction SilentlyContinue

Write-Host "Pacote criado: $zipPath ($($files.Count) arquivos)" -ForegroundColor Green
