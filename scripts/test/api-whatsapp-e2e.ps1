# E2E API — integração WhatsApp / Evolution (sem QR real; simula webhook connection.update)
#
# Pré-requisitos:
#   docker compose -f docker-compose.yml -f docker-compose.evolution.yml up -d --build
#   ou API local com WHATSAPP_API_ENABLED=true e Evolution em :8082
#
# Uso:
#   .\scripts\test\api-whatsapp-e2e.ps1
#   .\scripts\test\api-whatsapp-e2e.ps1 -SendTestMessage   # requer WHATSAPP_E2E_PHONE no .env
#
#Requires -Version 5.1
param(
    [string]$ApiUrl = $(if ($env:AEROSUITE_API_URL) { $env:AEROSUITE_API_URL } else { 'http://localhost:8080' }),
    [string]$EvolutionUrl = $(if ($env:EVOLUTION_API_URL) { $env:EVOLUTION_API_URL } else { 'http://localhost:18082' }),
    [string]$Email = $(if ($env:AEROSUITE_TEST_EMAIL) { $env:AEROSUITE_TEST_EMAIL } else { 'admin@aerosuite.com' }),
    [string]$Password = $(if ($env:AEROSUITE_TEST_PASSWORD) { $env:AEROSUITE_TEST_PASSWORD } else { 'admin123' }),
    [string]$Tenant = $(if ($env:AEROSUITE_TEST_TENANT) { $env:AEROSUITE_TEST_TENANT } else { 'default' }),
    [switch]$SendTestMessage,
    [switch]$SkipEvolutionProbe
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

$cfg = Get-AerosuiteTestConfig -ApiBaseUrl $ApiUrl -Email $Email -Password $Password -TenantCodigo $Tenant
$ApiUrl = $cfg.ApiBaseUrl
$evoKey = Get-AerosuiteDotEnvValue -Name 'EVOLUTION_API_KEY'
if (-not $evoKey) { $evoKey = Get-AerosuiteDotEnvValue -Name 'WHATSAPP_API_TOKEN' }
if (-not $evoKey) { $evoKey = 'aerosuite-evolution-api-key-2024' }

Write-Step "Aguardar API"
Wait-AerosuiteApiReady -ApiBaseUrl $ApiUrl -MaxWaitSec 90 | Out-Null

if (-not $SkipEvolutionProbe) {
    Write-Step "Probe Evolution API ($EvolutionUrl)"
    try {
        $null = Invoke-WebRequest -Uri $EvolutionUrl.TrimEnd('/') -Method GET -TimeoutSec 8 -UseBasicParsing
        Write-Host "  Evolution acessivel" -ForegroundColor Green
    } catch {
        Write-Host "  Evolution nao respondeu em $EvolutionUrl - suba docker-compose.evolution.yml" -ForegroundColor Yellow
    }
}

Write-Step "Login"
$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $ApiUrl -Body @{
    email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
}
if (-not $login.Ok -or -not $login.Body.token) { throw "Login falhou" }
$token = [string]$login.Body.token
$headers = @{
    Authorization = "Bearer $token"
    'X-Tenant-Codigo' = $Tenant
}

Write-Step "Status WhatsApp (antes)"
$statusBefore = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/whatsapp/status" -Headers $headers
$statusBefore | ConvertTo-Json -Depth 4 | Write-Host

if (-not $statusBefore.platformConfigured) {
    throw 'Evolution nao configurada na API - use docker-compose.evolution.yml ou defina WHATSAPP_API_* / AERO_SUITE_EVOLUTION_*'
}

Write-Step "Ativar WhatsApp (idempotente)"
if (-not $statusBefore.linked) {
    try {
        $activated = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/whatsapp/activate" -Method POST -Headers $headers -ContentType 'application/json' -Body '{}'
        Write-Host "  Instância: $($activated.instanceName)" -ForegroundColor Green
    } catch {
        $detail = $_.ErrorDetails.Message
        if ($detail) { Write-Host $detail -ForegroundColor Red }
        throw "Falha ao ativar WhatsApp"
    }
} else {
    Write-Host "  Ja ativado: $($statusBefore.instanceName)" -ForegroundColor DarkCyan
}

$statusMid = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/whatsapp/status" -Headers $headers
$instanceName = $statusMid.instanceName
if (-not $instanceName) { throw 'instanceName ausente apos activate' }

Write-Step "Obter QR Code"
try {
    $qr = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/whatsapp/qrcode" -Headers $headers
    if ($qr.qrCodeBase64) {
        Write-Host "  QR Code recebido ($($qr.qrCodeBase64.Length) chars base64)" -ForegroundColor Green
    } else {
        Write-Host "  QR vazio (instancia pode ja estar conectada na Evolution)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  QR endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Step "Webhook publico connection.update (simulacao E2E)"
$webhookBody = @{
    event = 'connection.update'
    instance = $instanceName
    data = @{ state = 'open'; statusReason = 200 }
    date_time = (Get-Date).ToUniversalTime().ToString('o')
} | ConvertTo-Json -Depth 5
# Evolution envia date_time; API aceita dateTime ou date_time
Invoke-RestMethod -Uri "$ApiUrl/webhooks/evolution" -Method POST -Body $webhookBody -ContentType 'application/json' | Out-Null
Write-Host "  Webhook aceito" -ForegroundColor Green

Start-Sleep -Seconds 2

Write-Step "Status WhatsApp (apos webhook)"
$statusAfter = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/whatsapp/status" -Headers $headers
$statusAfter | ConvertTo-Json -Depth 4 | Write-Host

if ($statusAfter.status -ne 'CONNECTED' -and -not $statusAfter.connected) {
    Write-Host "  Status ainda nao CONNECTED - aguardando sync..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    $statusAfter = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/whatsapp/status" -Headers $headers
}

if ($statusAfter.status -ne 'CONNECTED' -and -not $statusAfter.connected) {
    throw "Esperado status CONNECTED apos webhook; obtido: $($statusAfter.status)"
}
Write-Host "  Tenant CONNECTED" -ForegroundColor Green

Write-Step "Proposta WhatsApp API configured"
$waStatus = Invoke-RestMethod -Uri "$ApiUrl/api/propostas-comerciais/whatsapp-envio/status" -Headers $headers
if (-not $waStatus.configured) {
    throw "whatsapp-envio/status deveria ser configured=true com tenant ativo"
}
Write-Host "  configured=true" -ForegroundColor Green

if ($SendTestMessage) {
    $phone = Get-AerosuiteDotEnvValue -Name 'WHATSAPP_E2E_PHONE'
    if (-not $phone) { throw 'Defina WHATSAPP_E2E_PHONE no .env para -SendTestMessage' }
    Write-Step "Envio texto de teste para $phone"
    $msg = "Aero Suite E2E WhatsApp $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $sendBody = @{ number = $phone; text = $msg } | ConvertTo-Json
    $evoHeaders = @{ apikey = $evoKey; 'Content-Type' = 'application/json' }
    $sendUri = "$($EvolutionUrl.TrimEnd('/'))/message/sendText/$instanceName"
    Invoke-RestMethod -Uri $sendUri -Method POST -Headers $evoHeaders -Body $sendBody | Out-Null
    Write-Host "  Mensagem enviada via Evolution" -ForegroundColor Green
}

Write-Host "`nE2E WhatsApp API OK" -ForegroundColor Green
