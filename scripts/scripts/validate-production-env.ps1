# Valida .env + .env.production para deploy (erros bloqueiam).
# Uso: .\scripts\validate-production-env.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.env'
$prodFile = Join-Path $root '.env.production'
$errors = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Read-EnvMap {
    param([string]$Path)
    $map = @{}
    if (-not (Test-Path $Path)) { return $map }
    Get-Content $Path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        $eq = $line.IndexOf('=')
        if ($eq -lt 1) { return }
        $key = $line.Substring(0, $eq).Trim()
        $val = $line.Substring($eq + 1).Trim()
        if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
        $map[$key] = $val
    }
    return $map
}

if (-not (Test-Path $envFile)) {
    Write-Host 'ERRO: .env ausente. Copie .env.example' -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $prodFile)) {
    Write-Host 'ERRO: .env.production ausente. Copie .env.production.example' -ForegroundColor Red
    exit 1
}

$merged = Read-EnvMap -Path $envFile
foreach ($k in (Read-EnvMap -Path $prodFile).Keys) {
    $merged[$k] = (Read-EnvMap -Path $prodFile)[$k]
}

Write-Host 'Validacao producao (.env + .env.production)' -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($merged['FRONTEND_URL'])) {
    $errors.Add('FRONTEND_URL obrigatorio em .env.production')
} elseif ($merged['FRONTEND_URL'] -notmatch '^https://') {
    $warnings.Add('FRONTEND_URL deveria usar https:// em producao')
}

if ($merged['MAIL_MOCK'] -eq 'true') {
    $errors.Add('MAIL_MOCK=true nao permitido em producao')
}

$secret = $merged['AERO_SUITE_JWT_SECRET']
if ([string]::IsNullOrWhiteSpace($secret)) {
    $errors.Add('AERO_SUITE_JWT_SECRET obrigatorio')
} elseif ($secret.Length -lt 32) {
    $errors.Add('AERO_SUITE_JWT_SECRET < 32 caracteres')
} elseif ($secret -match 'dev-only|change-in-production') {
    $errors.Add('AERO_SUITE_JWT_SECRET parece valor de desenvolvimento')
}

if ($merged['QUARKUS_FLYWAY_REPAIR_AT_START'] -eq 'true') {
    $warnings.Add('QUARKUS_FLYWAY_REPAIR_AT_START=true — use apenas em incidente, nao rotina')
}

$jdbc = $merged['QUARKUS_DATASOURCE_JDBC_URL']
if ($jdbc -match 'host\.docker\.internal') {
    $warnings.Add('JDBC host.docker.internal e para dev Windows/Mac — em Linux VPS use mysql:3306 ou host gerido')
}

foreach ($w in $warnings) { Write-Host "AVISO: $w" -ForegroundColor Yellow }
foreach ($e in $errors) { Write-Host "ERRO: $e" -ForegroundColor Red }

if ($errors.Count -eq 0) {
    Write-Host "OK: variaveis de producao ($($warnings.Count) aviso(s))." -ForegroundColor Green
    exit 0
}
exit 1
