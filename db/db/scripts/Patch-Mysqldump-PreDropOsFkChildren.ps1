<#
.SYNOPSIS
  Insere DROP TABLE no início de um mysqldump para evitar ERRO 3780 (fk_ueo_os / fk_os_solicitacao_troca_os).

.DESCRIPTION
  Se o banco ainda tiver tabelas filhas de `os` com `os_id` BIGINT (schema antigo / Hibernate) e o dump
  recriar `os` com `id` INT, o MySQL 8 pode falhar ao validar FKs ao executar CREATE TABLE `os`.

  Este patch coloca, logo após FOREIGN_KEY_CHECKS=0:
    DROP TABLE IF EXISTS `usuario_externo_os`;
    DROP TABLE IF EXISTS `os_solicitacao_troca_item`;

  Uso típico: após Reorder-AssociacaoFcuInMysqldump.ps1, ou direto no .sql original.

.EXAMPLE
  .\Patch-Mysqldump-PreDropOsFkChildren.ps1 -InputPath 'C:\Aero Suite\Migracao\Backup\dump.sql' -OutputPath 'C:\Aero Suite\Migracao\Backup\dump_patched.sql'
#>
param(
    [Parameter(Mandatory = $true)]
    [string] $InputPath,
    [Parameter(Mandatory = $false)]
    [string] $OutputPath
)

$marker = '/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;'
$patchBanner = '-- Patched: pre-drop filhos de os(id) para evitar 3780 (os_id BIGINT legado vs os.id INT no dump)'
$insert = @"

$patchBanner
DROP TABLE IF EXISTS ``usuario_externo_os``;
DROP TABLE IF EXISTS ``os_solicitacao_troca_item``;

"@

if (-not (Test-Path -LiteralPath $InputPath)) {
    throw "Arquivo não encontrado: $InputPath"
}

$enc = New-Object System.Text.UTF8Encoding($false)
$text = [System.IO.File]::ReadAllText($InputPath, $enc)

if ($text.Contains($patchBanner)) {
    Write-Host "Já contém o patch; nada a fazer."
    if ($OutputPath) { Copy-Item -LiteralPath $InputPath -Destination $OutputPath -Force }
    exit 0
}

$idx = $text.IndexOf($marker)
if ($idx -lt 0) {
    throw "Marcador mysqldump não encontrado (FOREIGN_KEY_CHECKS=0). Arquivo não é mysqldump padrão?"
}

$end = $idx + $marker.Length
$newText = $text.Substring(0, $end) + "`r`n" + $insert + $text.Substring($end)

$out = if ($OutputPath) { $OutputPath } else { $InputPath }
[System.IO.File]::WriteAllText($out, $newText, $enc)
Write-Host "Patch aplicado: $out"
