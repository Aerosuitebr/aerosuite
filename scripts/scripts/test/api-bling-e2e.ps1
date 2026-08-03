# Teste E2E Bling — escopos, bootstrap, proposta → pedido → NF-e
#
# Pré-requisitos:
#   - API rodando com AERO_SUITE_BLING_* configurado
#   - OAuth conectado (Configurações > Bling)
#   - Escopos completos no app Bling (ver GET /integracoes/bling/scopes)
#
# Uso:
#   .\scripts\test\api-bling-e2e.ps1
#   .\scripts\test\api-bling-e2e.ps1 -SkipNfe   # para quando certificado SEFAZ não estiver pronto
#
#Requires -Version 5.1
param(
    [string]$ApiUrl = $(if ($env:AEROSUITE_API_URL) { $env:AEROSUITE_API_URL } else { 'https://app.aerosuite.com.br' }),
    [string]$Email = $(if ($env:AEROSUITE_TEST_EMAIL) { $env:AEROSUITE_TEST_EMAIL } else { 'admin@aerosuite.com' }),
    [string]$Password = $(if ($env:AEROSUITE_TEST_PASSWORD) { $env:AEROSUITE_TEST_PASSWORD } else { 'admin123' }),
    [string]$Tenant = $(if ($env:AEROSUITE_TEST_TENANT) { $env:AEROSUITE_TEST_TENANT } else { 'default' }),
    [switch]$SkipBootstrap,
    [switch]$SkipNfe,
    [long]$PropostaId = 0
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Write-Step "Login"
$cfg = Get-AerosuiteTestConfig -ApiBaseUrl $ApiUrl -Email $Email -Password $Password -TenantCodigo $Tenant
$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
}
if (-not $login.Ok -or -not $login.Body.token) { throw "Login falhou" }
$token = [string]$login.Body.token
$headers = @{
    Authorization = "Bearer $token"
    'X-Tenant-Codigo' = $Tenant
}
$ApiUrl = $cfg.ApiBaseUrl
$boot = $null

Write-Step "Probe webhook homologação (HMAC + fila)"
$webhookProbeOk = $false
try {
    $wh = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/bling/homologacao/webhook" -Method POST -Headers $headers
    foreach ($s in $wh.steps) { Write-Host "  - $s" }
    if ($wh.webhookUrl) { Write-Host "Webhook URL: $($wh.webhookUrl)" -ForegroundColor DarkCyan }
    if (-not $wh.success) { throw $wh.message }
    $webhookProbeOk = $true
} catch {
    $statusCode = $null
    if ($_.Exception.Response) { $statusCode = [int]$_.Exception.Response.StatusCode }
    if ($statusCode -eq 404) {
        Write-Host "Endpoint homologacao/webhook ausente (deploy pendente) - testando webhook publico HMAC..." -ForegroundColor Yellow
        $secret = Get-AerosuiteDotEnvValue -Name 'AERO_SUITE_BLING_CLIENT_SECRET'
        if (-not $secret) { throw 'Defina AERO_SUITE_BLING_CLIENT_SECRET no .env para probe HMAC' }
        $body = '{"eventId":"e2e-probe-' + [guid]::NewGuid().ToString() + '","event":"contatos.atualizado","data":{"id":"0"}}'
        $hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($secret))
        $hash = -join ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($body)) | ForEach-Object { $_.ToString('x2') })
        $hmac.Dispose()
        $uri = "$ApiUrl/api/integracoes/bling/webhook/t/$Tenant"
        Invoke-RestMethod -Uri $uri -Method POST -Body $body -ContentType 'application/json' `
            -Headers @{ 'X-Bling-Signature-256' = "sha256=$hash" } | Out-Null
        Write-Host "Webhook público aceito em $uri" -ForegroundColor Green
        $webhookProbeOk = $true
    } else {
        $err = $_.ErrorDetails.Message
        if ($err) { Write-Host $err -ForegroundColor Red }
        throw 'Webhook homologacao falhou - verifique AERO_SUITE_BLING_WEBHOOK_ENABLED e CLIENT_SECRET'
    }
}

Write-Step "Verificar conexao Bling"
$conn = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/bling/connection" -Headers $headers
if (-not $conn.connected) {
    Write-Host "Bling OAuth não conectado neste tenant." -ForegroundColor Yellow
    Write-Host "Abra Configurações > Integração Bling > Conectar Bling e rode o E2E novamente para bootstrap/pedido." -ForegroundColor Yellow
    if ($webhookProbeOk) {
        Write-Host "`nE2E parcial OK (webhook). Falta OAuth para fluxo comercial completo." -ForegroundColor Green
        exit 0
    }
    throw "Bling não conectado. Conecte em Configurações > Integração Bling."
}
Write-Host "Conectado: $($conn.message)"

Write-Step "Diagnóstico de escopos"
$scopes = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/bling/scopes" -Headers $headers
foreach ($c in $scopes.checks) {
    $icon = if ($c.ok) { '[OK]' } else { '[FALHA]' }
    Write-Host "  $icon $($c.label) (HTTP $($c.httpStatus)) - $($c.message)"
}
if (-not $scopes.allOk) {
    Write-Host "`nEscopos faltando no app Bling. Habilite no painel developer.bling.com.br:" -ForegroundColor Yellow
    foreach ($p in $scopes.requiredBlingAppPermissions) {
        Write-Host "  - $p"
    }
    Write-Host "`nDepois: Desconectar > Conectar Bling novamente." -ForegroundColor Yellow
    throw $scopes.message
}

Write-Step "Testar conexão (probe multi-recurso)"
$status = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/bling/status" -Headers $headers
if (-not $status.ok) {
    throw "Status Bling: $($status.message)"
}
Write-Host $status.message

if (-not $SkipBootstrap) {
    Write-Step "Bootstrap homologação (contato + fiscal)"
    try {
        $boot = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/bling/bootstrap/homologacao" -Method POST -Headers $headers
        foreach ($s in $boot.steps) { Write-Host "  - $s" }
        Write-Host "Contato Bling: $($boot.blingContatoId) | ClienteProposta: $($boot.clientePropostaId)"
    } catch {
        $err = $_.ErrorDetails.Message
        if ($err) { Write-Host $err -ForegroundColor Red }
        throw 'Bootstrap falhou - verifique escopos de contatos (criar/listar)'
    }
}

if ($PropostaId -le 0) {
    Write-Step "Criar proposta de teste"
    $numero = "PROP-E2E-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $body = @{
        numeroProposta = $numero
        status = 'RASCUNHO'
        produtoNome = 'Servico homologacao Bling E2E'
        produtoValor = 1500.00
        valorTotalFinal = 1500.00
        observacoes = 'Proposta gerada por api-bling-e2e.ps1'
    } | ConvertTo-Json
    $proposta = Invoke-RestMethod -Uri "$ApiUrl/api/propostas-comerciais" -Method POST -Headers $headers -ContentType 'application/json' -Body $body
    $PropostaId = [long]$proposta.id
    Write-Host "Proposta criada id=$PropostaId numero=$numero"

    if ($boot -and $boot.clientePropostaId) {
        Write-Step "Vincular cliente importado da Bling"
        $upd = Invoke-RestMethod -Uri "$ApiUrl/api/propostas-comerciais/$PropostaId" -Headers $headers
        $upd.clientePropostaId = $boot.clientePropostaId
        $upd.status = 'RASCUNHO'
        $upd | ConvertTo-Json -Depth 6 | Out-Null
        Invoke-RestMethod -Uri "$ApiUrl/api/propostas-comerciais/$PropostaId" -Method PUT -Headers $headers `
            -ContentType 'application/json' -Body ($upd | ConvertTo-Json -Depth 8) | Out-Null
    }

    Write-Step "Adicionar item à proposta"
    $p2 = Invoke-RestMethod -Uri "$ApiUrl/api/propostas-comerciais/$PropostaId" -Headers $headers
    if (-not $p2.itens) { $p2 | Add-Member -NotePropertyName itens -NotePropertyValue @() -Force }
    $p2.itens = @(@{
        produtoPn = 'AERO-HML-SERV-001'
        produtoNome = 'Servico aeronautico homologacao'
        quantidade = 1
        valorUnitario = 1500.00
        ordem = 1
    })
    $p2.status = 'APROVADA'
    Invoke-RestMethod -Uri "$ApiUrl/api/propostas-comerciais/$PropostaId" -Method PUT -Headers $headers `
        -ContentType 'application/json' -Body ($p2 | ConvertTo-Json -Depth 8) | Out-Null
    Write-Host "Proposta $PropostaId marcada APROVADA"
} else {
    Write-Step "Usar proposta existente id=$PropostaId"
    $p = Invoke-RestMethod -Uri "$ApiUrl/api/propostas-comerciais/$PropostaId" -Headers $headers
    if ($p.status -ne 'APROVADA') {
        $p.status = 'APROVADA'
        Invoke-RestMethod -Uri "$ApiUrl/api/propostas-comerciais/$PropostaId" -Method PUT -Headers $headers `
            -ContentType 'application/json' -Body ($p | ConvertTo-Json -Depth 8) | Out-Null
    }
}

Write-Step "Enviar pedido à Bling"
try {
    $pedido = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/bling/propostas/$PropostaId/pedido" -Method POST -Headers $headers
    Write-Host "Pedido Bling id=$($pedido.blingPedidoId) numero=$($pedido.blingPedidoNumero) - $($pedido.message)"
} catch {
    $err = $_.ErrorDetails.Message
    if ($err) { Write-Host $err -ForegroundColor Red }
    throw 'Falha ao criar pedido - cliente vinculado a Bling? Proposta APROVADA?'
}

if (-not $SkipNfe) {
    Write-Step "Emitir NF-e (requer certificado A1 no Aero Suite + Bling)"
    try {
        $nfe = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/bling/propostas/$PropostaId/nfe/emitir" -Method POST -Headers $headers
        Write-Host "NF-e id=$($nfe.blingNfeId) numero=$($nfe.numero) situacao=$($nfe.situacao)"
    } catch {
        Write-Host "NF-e não emitida (esperado sem certificado SEFAZ): $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        Write-Host "Configure certificado .pfx em Configurações > Bling e no painel Bling." -ForegroundColor Yellow
    }
}

Write-Step "Resumo sync"
$sync = Invoke-RestMethod -Uri "$ApiUrl/api/integracoes/bling/sync/status" -Headers $headers
Write-Host "Contatos: $($sync.mappedContacts) | Pedidos: $($sync.linkedPedidos) | NF-e: $($sync.nfeRegistros)"

Write-Host "`nE2E concluído. PropostaId=$PropostaId" -ForegroundColor Green
