<#
.SYNOPSIS
  Gera um único arquivo .sql (estrutura + INSERTs na ordem do dump) pronto para importar sem erros 3780 comuns.

.DESCRIPTION
  Encadeia:
    1) Reorder-AssociacaoFcuInMysqldump.ps1 — move o bloco `associacao_fcu` para depois de `fcu`/`product`
       (evita FK associacao_fcu -> fcu/product em ordem alfabética errada).
    2) Patch-Mysqldump-PreDropOsFkChildren.ps1 — DROP de `usuario_externo_os` e `os_solicitacao_troca_item`
       logo após FOREIGN_KEY_CHECKS=0 (evita 3780 fk_ueo_os com os_id BIGINT legado vs os.id INT).
    3) Opcional: remove linhas `mysqldump:` misturadas no arquivo (stderr do cliente).
    4) Opcional: insere USE `database` antes dos pre-drops.

  O resultado contém TODO o conteúdo do mysqldump original (CREATE + INSERT), apenas reordenado/patchado.

.PARAMETER SourcePath
  Caminho do arquivo .sql gerado pelo mysqldump.

.PARAMETER OutputPath
  Caminho de saída. Padrão: mesma pasta do fonte, sufixo _importavel.sql

.PARAMETER SkipAssociacaoReorder
  Use se o dump não tiver `associacao_fcu` ou não tiver `proposta_comercial` (o reordenador falharia).

.PARAMETER DatabaseName
  Se informado (ex.: aerosuite), insere USE `nome` após FOREIGN_KEY_CHECKS=0. Útil quando o dump não traz --databases.

.PARAMETER KeepMysqldumpWarnings
  Por padrão, remove linhas começando com "mysqldump:" (avisos/erros colados no .sql).

.EXAMPLE
  .\Build-ImportavelMysqldump.ps1 -SourcePath 'C:\Aero Suite\Migracao\Backup\backup_aerosuite_20260513_224032.sql'

.EXAMPLE
  .\Build-ImportavelMysqldump.ps1 -SourcePath 'C:\dump.sql' -OutputPath 'C:\dump_importavel.sql' -DatabaseName 'aerosuite'
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $SourcePath,
    [string] $OutputPath,
    [switch] $SkipAssociacaoReorder,
    [string] $DatabaseName,
    [switch] $KeepMysqldumpWarnings
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$reorderScript = Join-Path $root 'Reorder-AssociacaoFcuInMysqldump.ps1'
$patchScript = Join-Path $root 'Patch-Mysqldump-PreDropOsFkChildren.ps1'

if (-not (Test-Path -LiteralPath $SourcePath)) {
    throw "Fonte nao encontrada: $SourcePath"
}
foreach ($p in @($reorderScript, $patchScript)) {
    if (-not (Test-Path -LiteralPath $p)) {
        throw "Script auxiliar ausente: $p"
    }
}

if (-not $OutputPath) {
    $dir = [System.IO.Path]::GetDirectoryName($SourcePath)
    $base = [System.IO.Path]::GetFileNameWithoutExtension($SourcePath)
    $OutputPath = [System.IO.Path]::Combine($dir, "${base}_importavel.sql")
}

$enc = New-Object System.Text.UTF8Encoding($false)
$tmp = [System.IO.Path]::GetTempFileName() + '_importavel_stage.sql'

try {
    if ($SkipAssociacaoReorder) {
        Write-Host "Copiando (sem reordenar associacao_fcu)..."
        Copy-Item -LiteralPath $SourcePath -Destination $tmp -Force
    }
    else {
        Write-Host "Passo 1/2: reordenando associacao_fcu..."
        & $reorderScript -InputPath $SourcePath -OutputPath $tmp
    }

    Write-Host "Passo 2/2: patch pre-drop OS + FK..."
    & $patchScript -InputPath $tmp -OutputPath $OutputPath

    $t = [System.IO.File]::ReadAllText($OutputPath, $enc)

    if (-not $KeepMysqldumpWarnings) {
        $before = $t.Length
        $t = [System.Text.RegularExpressions.Regex]::Replace($t, '(?m)^mysqldump:.*\r?\n', '')
        if ($t.Length -ne $before) {
            Write-Host "Removidas linhas mysqldump: (stderr misturado ao arquivo)."
        }
    }

    $patchBanner = '-- Patched: pre-drop filhos de os(id) para evitar 3780 (os_id BIGINT legado vs os.id INT no dump)'
    if ($DatabaseName) {
        $dbEsc = $DatabaseName.Replace('`', '``')
        $useLine = "USE ``$dbEsc``;" + "`r`n"
        if ($t -notmatch '(?m)^USE\s+`') {
            if (-not $t.Contains($patchBanner)) {
                throw "Banner de patch nao encontrado; arquivo inesperado."
            }
            $t = $t.Replace($patchBanner, $useLine + $patchBanner)
            Write-Host "Inserido USE ``$DatabaseName``;"
        }
        else {
            Write-Host "Arquivo ja contem USE; nao inserindo."
        }
    }

    $genLine = "-- Gerado por Build-ImportavelMysqldump.ps1 em $([datetime]::Now.ToString('yyyy-MM-dd HH:mm'))" + "`r`n" +
               "-- Fonte: $SourcePath" + "`r`n"
    if ($t -match '(?ms)^-- MySQL dump') {
        $t = [System.Text.RegularExpressions.Regex]::Replace(
            $t,
            '(?ms)^(-- MySQL dump[^\r\n]*\r?\n)',
            "`$1$genLine",
            1
        )
    }
    else {
        $t = $genLine + $t
    }

    [System.IO.File]::WriteAllText($OutputPath, $t, $enc)
    Write-Host "Concluido: $OutputPath ($($t.Length) bytes)"
}
finally {
    Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
}
