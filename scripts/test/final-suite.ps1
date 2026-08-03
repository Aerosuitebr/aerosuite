# Verificacao final dos 5 pilares (menu i18n, smoke, stress, E2E, tenant).
# Uso: .\scripts\test\final-suite.ps1
#      .\scripts\test\final-suite.ps1 -SkipDockerRebuild -SkipMaven

param(
    [switch]$SkipDockerRebuild,
    [switch]$SkipStress,
    [switch]$SkipMaven
)

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$args = @{}
if ($SkipDockerRebuild) { $args['SkipDockerRebuild'] = $true }
if ($SkipStress) { $args['SkipStress'] = $true }
if ($SkipMaven) { $args['SkipMaven'] = $true }

& (Join-Path $here 'verify-covered-suite.ps1') @args
exit $LASTEXITCODE
