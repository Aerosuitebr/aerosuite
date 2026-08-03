<#
.SYNOPSIS
  Reordena bloco `associacao_fcu` em dump mysqldump para depois de `product` e `fcu`.

.DESCRIPTION
  mysqldump ordena tabelas alfabeticamente: `associacao_fcu` vem antes de `fcu` e `product`.
  Na importacao, o CREATE de associacao_fcu valida FKs contra tabelas JA existentes no banco.
  Se `fcu.id` for BIGINT e `associacao_fcu.id_fcu` for INT -> erro 3780.

  Este script remove o bloco completo de associacao_fcu (do comentario ate antes de backup_config)
  e reinsere-o imediatamente ANTES de `proposta_comercial` (apos `product`).

.PARAMETER InputPath
  Caminho do .sql original (ex.: backup_aerosuite_YYYYMMDD.sql)

.PARAMETER OutputPath
  Caminho do .sql gerado. Se omitido, acrescenta _reordenado antes da extensao.
#>
param(
    [Parameter(Mandatory = $true)]
    [string] $InputPath,
    [string] $OutputPath
)

if (-not (Test-Path -LiteralPath $InputPath)) {
    throw "Arquivo nao encontrado: $InputPath"
}

if (-not $OutputPath) {
    $OutputPath = [System.IO.Path]::Combine(
        [System.IO.Path]::GetDirectoryName($InputPath),
        [System.IO.Path]::GetFileNameWithoutExtension($InputPath) + "_reordenado.sql"
    )
}

Write-Host "Lendo: $InputPath"
$s = [System.IO.File]::ReadAllText($InputPath, [System.Text.UTF8Encoding]::new($false))

$nl = if ($s.Contains("`r`n")) { "`r`n" } else { "`n" }
# Marcador mysqldump: --\n-- Table structure for table `nome`
$hdr = "$nl--$nl-- Table structure for table "

$bt = [char]96  # backtick
$startAssoc = $s.IndexOf($hdr + $bt + 'associacao_fcu' + $bt)
if ($startAssoc -lt 0) { throw "Marcador associacao_fcu nao encontrado." }

$endAssoc = $s.IndexOf($hdr + $bt + 'backup_config' + $bt, $startAssoc)
if ($endAssoc -lt 0) { throw "Marcador backup_config (fim do bloco associacao) nao encontrado." }

$assocBlock = $s.Substring($startAssoc, $endAssoc - $startAssoc)
$s2 = $s.Remove($startAssoc, $endAssoc - $startAssoc)

$insertBefore = $s2.IndexOf($hdr + $bt + 'proposta_comercial' + $bt)
if ($insertBefore -lt 0) { throw "Marcador proposta_comercial (ponto de insercao) nao encontrado." }

$out = $s2.Insert($insertBefore, $assocBlock)
[System.IO.File]::WriteAllText($OutputPath, $out, [System.Text.UTF8Encoding]::new($false))

Write-Host "Gravado: $OutputPath"
Write-Host "Tamanho original: $($s.Length) bytes -> novo: $($out.Length) bytes"
