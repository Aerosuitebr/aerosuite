# Verifica chaves i18n P3 nos ficheiros corretos (PT/EN/ES/FR).
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))

function Test-KeyInFile([string]$path, [string]$key) {
    if (-not (Test-Path $path)) { return $false }
    $pat = [regex]::Escape("'$key'")
    return (Select-String -Path $path -Pattern $pat -Quiet)
}

$checks = @(
    @{ Key = 'comercial.proposta.bling.importBtn'; Path = 'frontend\src\app\core\i18n\commercial-proposta-i18n.ts' },
    @{ Key = 'tenants.field.logo'; Path = 'frontend\src\app\core\i18n\tenants-i18n.ts' },
    @{ Key = 'empresa.accordion.lgpd'; Path = 'frontend\src\app\core\translation.service.ts' },
    @{ Key = 'empresa.lgpd.useCustom'; Path = 'frontend\src\app\core\translation.service.ts' }
)

$missing = @()
foreach ($c in $checks) {
    $full = Join-Path $repo $c.Path
    if (-not (Test-KeyInFile $full $c.Key)) {
        $missing += "$($c.Key) em $($c.Path)"
    }
}

# tenants-i18n: logo em 4 blocos (PT, EN, ES, FR)
$tenantsFile = Join-Path $repo 'frontend\src\app\core\i18n\tenants-i18n.ts'
$logoCount = (Select-String -Path $tenantsFile -Pattern "'tenants\.field\.logo'" -AllMatches).Matches.Count
if ($logoCount -lt 4) {
    $missing += "tenants.field.logo ($logoCount/4 locales em tenants-i18n.ts)"
}

# translation.service: lgpd blocos em 4 línguas
$tsFile = Join-Path $repo 'frontend\src\app\core\translation.service.ts'
$lgpdAccordion = (Select-String -Path $tsFile -Pattern "'empresa\.accordion\.lgpd'" -AllMatches).Matches.Count
if ($lgpdAccordion -lt 4) {
    $missing += "empresa.accordion.lgpd ($lgpdAccordion/4 locales em translation.service.ts)"
}

if ($missing.Count -gt 0) {
    Write-Host 'audit-p3-i18n: FALHA' -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  $_" }
    exit 1
}
Write-Host 'audit-p3-i18n: OK' -ForegroundColor Green
exit 0
