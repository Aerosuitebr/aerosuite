# Audita cobertura menu.func.* / menu.section.* vs API (meu-menu) e scripts SQL.
# Uso: .\scripts\test\audit-menu-i18n.ps1
# Exit 1 se faltar chave em menu-i18n.ts (pt-BR como referencia).

param(
    [switch]$SkipApi
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')
$root = Get-AerosuiteRepoRoot

$menuFile = Join-Path $root 'frontend\src\app\core\i18n\menu-i18n.ts'
$content = Get-Content $menuFile -Raw -Encoding UTF8
$funcKeys = [regex]::Matches($content, "menu\.func\.([A-Z0-9_]+)") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$sectionKeys = [regex]::Matches($content, "menu\.section\.([A-Z0-9_]+)") | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
$knownFunc = [System.Collections.Generic.HashSet[string]]::new([string[]]$funcKeys)
$knownSec = [System.Collections.Generic.HashSet[string]]::new([string[]]$sectionKeys)

$script:MenuFuncAliases = @{ AUDITORIA_OS = 'OS_AUDITORIA' }

function Get-CodigoVariants {
    param([string]$Codigo)
    if (-not $Codigo) { return @() }
    $raw = $Codigo.Trim().ToUpper()
    $u = $raw.Replace('-', '_')
    $variants = [System.Collections.Generic.HashSet[string]]::new([string[]]@($raw, $u))
    if ($script:MenuFuncAliases.ContainsKey($u)) {
        [void]$variants.Add($script:MenuFuncAliases[$u])
    }
    return @($variants)
}

function Slugify-Secao {
    param([string]$Secao)
    if (-not $Secao) { return '' }
    $s = $Secao -replace '\uFFFD', '' -replace '\?+', ' '
    $s = $s.Normalize([Text.NormalizationForm]::FormD)
    $s = -join ($s.ToCharArray() | Where-Object { [Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne 'NonSpacingMark' })
    $s = $s.Trim().ToUpper() -replace '[\s-]+', '_' -replace '[^A-Z0-9_]', ''
    if ($s.StartsWith('PUBLICA') -and ($s.Contains('TECNIC') -or $s.Contains('T_CNIC'))) { return 'PUBLICACOES_TECNICAS' }
    if ($s.StartsWith('ADMINISTRA')) { return 'ADMINISTRACAO' }
    if ($s.StartsWith('OPERACION')) { return 'OPERACIONAL' }
    if ($s.StartsWith('ACOE') -and $s.Contains('RAPID')) { return 'ACOES_RAPIDAS' }
    if ($s -match '^A_.*PIDAS$' -or ($s.Contains('_ES_R_') -and $s.Contains('PIDAS'))) { return 'ACOES_RAPIDAS' }
    if ($s.StartsWith('GEST')) { return 'GESTAO' }
    if ($s.StartsWith('COMUNICA')) { return 'COMUNICACAO' }
    return $s
}

function Test-MenuFuncCovered {
    param([string]$Codigo)
    foreach ($v in (Get-CodigoVariants $Codigo)) {
        if ($knownFunc.Contains($v)) { return $true }
    }
    return $false
}

function Test-MenuSecCovered {
    param([string]$Secao)
    $slug = Slugify-Secao $Secao
    if (-not $slug) { return $true }
    return $knownSec.Contains($slug)
}

$missingFunc = [System.Collections.Generic.HashSet[string]]::new()
$missingSec = [System.Collections.Generic.HashSet[string]]::new()

function Register-Funcionalidade {
    param($Codigo, $Secao)
    if ($Codigo -and -not (Test-MenuFuncCovered $Codigo)) {
        [void]$missingFunc.Add(($Codigo.Trim().ToUpper().Replace('-', '_')))
    }
    if ($Secao -and -not (Test-MenuSecCovered $Secao)) {
        [void]$missingSec.Add((Slugify-Secao $Secao))
    }
}

# Codigos conhecidos em scripts SQL do repo
$sqlDir = Join-Path $root 'db\scripts'
Get-ChildItem $sqlDir -Filter '*.sql' | ForEach-Object {
    $sql = Get-Content $_.FullName -Raw -Encoding UTF8
    [regex]::Matches($sql, "codigo\s*=\s*'([^']+)'", 'IgnoreCase') | ForEach-Object {
        Register-Funcionalidade -Codigo $_.Groups[1].Value -Secao ''
    }
    [regex]::Matches($sql, "'([A-Z0-9_-]+)',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*\d+,\s*'([^']+)'") | ForEach-Object {
        Register-Funcionalidade -Codigo $_.Groups[1].Value -Secao $_.Groups[2].Value
    }
}

if (-not $SkipApi) {
    $cfg = Get-AerosuiteTestConfig
    $login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
    }
    if ($login.Ok -and $login.Body.token) {
        $menu = Invoke-AerosuiteApi -Method GET -Path '/api/funcionalidades/meu-menu' -ApiBaseUrl $cfg.ApiBaseUrl -Token $login.Body.token
        if ($menu.Ok -and $menu.Body) {
            foreach ($f in $menu.Body) {
                Register-Funcionalidade -Codigo $f.codigo -Secao $f.secao
            }
        }
    } else {
        Write-Host 'API indisponivel - auditoria apenas SQL local' -ForegroundColor Yellow
    }
}

Write-Host 'Auditoria menu i18n' -ForegroundColor Cyan
Write-Host "Chaves func: $($funcKeys.Count) | secoes: $($sectionKeys.Count)"

if ($missingFunc.Count -eq 0 -and $missingSec.Count -eq 0) {
    Write-Host 'OK: cobertura completa para codigos/secoes conhecidos.' -ForegroundColor Green
    exit 0
}

if ($missingSec.Count -gt 0) {
    Write-Host 'Secoes em falta (menu.section.*):' -ForegroundColor Red
    $missingSec | Sort-Object | ForEach-Object { Write-Host "  - $_" }
}
if ($missingFunc.Count -gt 0) {
    Write-Host 'Funcionalidades em falta (menu.func.*):' -ForegroundColor Red
    $missingFunc | Sort-Object | ForEach-Object { Write-Host "  - $_" }
}
exit 1
