# Valida .env na raiz do repositório (variáveis Quarkus / Docker Compose).
# Uso: .\scripts\validate-env.ps1
# Saída: 0 = OK ou avisos apenas; 1 = erros que impedem subir a API com Docker.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.env'
$errors = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Read-EnvMap {
    param([string]$Path)
    $map = @{}
    if (-not (Test-Path $Path)) {
        return $map
    }
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

Write-Host "Validando: $envFile" -ForegroundColor Cyan

if (-not (Test-Path $envFile)) {
    Write-Host "ERRO: .env não encontrado. Copie .env.example para .env" -ForegroundColor Red
    exit 1
}

$raw = Get-Content $envFile -Raw -Encoding UTF8
if ($raw -match '(?m)^\s*UARKUS_') {
    $errors.Add('Linha com prefixo errado UARKUS_* — use QUARKUS_* (ex.: QUARKUS_DATASOURCE_JDBC_URL).')
}

$env = Read-EnvMap -Path $envFile

$required = @(
    'QUARKUS_DATASOURCE_JDBC_URL',
    'QUARKUS_DATASOURCE_USERNAME',
    'QUARKUS_DATASOURCE_PASSWORD'
)
foreach ($k in $required) {
    if (-not $env.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($env[$k])) {
        $errors.Add("Variável obrigatória ausente ou vazia: $k")
    }
}

if ($env.ContainsKey('QUARKUS_DATASOURCE_JDBC_URL')) {
    $jdbc = $env['QUARKUS_DATASOURCE_JDBC_URL']
    if ($jdbc -match 'jdbc:mysql://(127\.0\.0\.1|localhost)(:|/)') {
        $warnings.Add('QUARKUS_DATASOURCE_JDBC_URL usa localhost/127.0.0.1 — com API no Docker use host.docker.internal ou mysql:3306 (overlay local-mysql).')
    }
    if ($jdbc -notmatch '^jdbc:mysql://') {
        $warnings.Add('QUARKUS_DATASOURCE_JDBC_URL não parece MySQL (jdbc:mysql://...).')
    }
    if ($jdbc -match '/bellows(\?|/|$)') {
        $errors.Add('QUARKUS_DATASOURCE_JDBC_URL ainda aponta para a BD legada /bellows — use /aerosuite ou execute db\scripts\Clone-BellowsDatabaseToAerosuite.ps1 -UpdateEnvFile.')
    }
    if ($jdbc -notmatch '/aerosuite(\?|/|$)') {
        $warnings.Add('QUARKUS_DATASOURCE_JDBC_URL não contém /aerosuite — confirme o nome da base após a migração.')
    }
    if ($jdbc -notmatch 'useUnicode=true' -or $jdbc -notmatch 'characterEncoding=') {
        $warnings.Add('QUARKUS_DATASOURCE_JDBC_URL sem useUnicode/characterEncoding — acentos (ç, ã, é) podem aparecer como ??. Adicione: &characterEncoding=UTF-8&useUnicode=true&connectionCollation=utf8mb4_unicode_ci')
    }
}

if ($env.ContainsKey('AERO_SUITE_JWT_SECRET')) {
    $secret = $env['AERO_SUITE_JWT_SECRET']
    if ($secret.Length -lt 32) {
        $errors.Add('AERO_SUITE_JWT_SECRET deve ter pelo menos 32 caracteres.')
    }
    if ($secret -match 'change-in-production|dev-only') {
        $warnings.Add('AERO_SUITE_JWT_SECRET parece valor de desenvolvimento — use segredo forte em produção.')
    }
} else {
    $warnings.Add('AERO_SUITE_JWT_SECRET não definido — o compose usa fallback de dev (não use em produção).')
}

if ($env.ContainsKey('QUARKUS_MAILER_PASSWORD') -and $env['QUARKUS_MAILER_PASSWORD'] -match 'sua_api_key|placeholder|changeme') {
    $warnings.Add('QUARKUS_MAILER_PASSWORD parece placeholder — e-mails não serão enviados.')
}

$evoEnabled = ($env['WHATSAPP_API_ENABLED'] -eq 'true') -or ($env['AERO_SUITE_EVOLUTION_ENABLED'] -eq 'true')
if ($evoEnabled) {
    $evoUrl = if ($env['AERO_SUITE_EVOLUTION_API_BASE_URL']) { $env['AERO_SUITE_EVOLUTION_API_BASE_URL'] } else { $env['WHATSAPP_API_URL'] }
    $evoKey = if ($env['AERO_SUITE_EVOLUTION_ADMIN_API_KEY']) { $env['AERO_SUITE_EVOLUTION_ADMIN_API_KEY'] } else { $env['WHATSAPP_API_TOKEN'] }
    if (-not $evoUrl -or $evoUrl -eq 'none') {
        $warnings.Add('WhatsApp/Evolution habilitado mas URL da API não configurada (WHATSAPP_API_URL ou AERO_SUITE_EVOLUTION_API_BASE_URL).')
    }
    if (-not $evoKey -or $evoKey -eq 'none') {
        $warnings.Add('WhatsApp/Evolution habilitado mas chave admin não configurada (WHATSAPP_API_TOKEN ou AERO_SUITE_EVOLUTION_ADMIN_API_KEY).')
    }
    $webhookBase = $env['AERO_SUITE_EVOLUTION_WEBHOOK_BASE_URL']
    if (-not $webhookBase) {
        $warnings.Add('AERO_SUITE_EVOLUTION_WEBHOOK_BASE_URL vazio — use http://api:8080 com docker-compose.evolution.yml ou URL pública em produção.')
    }
    if ($evoUrl -match 'localhost|127\.0\.0\.1') {
        $warnings.Add('WHATSAPP/Evolution URL usa localhost — com API no Docker use http://evolution-api:8080 (localhost dentro do container nao alcanca a Evolution).')
    }
}

foreach ($w in $warnings) {
    Write-Host "AVISO: $w" -ForegroundColor Yellow
}
foreach ($e in $errors) {
    Write-Host "ERRO: $e" -ForegroundColor Red
}

if ($errors.Count -eq 0) {
    Write-Host "OK: .env válido ($($warnings.Count) aviso(s))." -ForegroundColor Green
    exit 0
}
Write-Host "Falha: corrija $($errors.Count) erro(s) no .env." -ForegroundColor Red
exit 1
