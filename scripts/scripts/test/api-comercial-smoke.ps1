# Smoke integrações comerciais: Bling status, proposta portal v1.1 (aditivos), billing, LGPD export.
param(
    [switch]$SkipLgpdExport,
    [switch]$ProvisionDemoIfMissing
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite - comercial integrations smoke' -ForegroundColor Cyan

if ($ProvisionDemoIfMissing) {
    & (Join-Path $here 'provision-tenant-demo.ps1')
}

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
}
$token = $null
if ($login.Ok -and $login.Body.token) { $token = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma' -Passed ([bool]$token)))

if ($token) {
    $r = Invoke-AerosuiteApi -Method GET -Path '/api/integracoes/bling/status' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $ok = $r.Ok -and $null -ne $r.Body
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/integracoes/bling/status' -Passed $ok -Detail "enabled=$($r.Body.enabled) configured=$($r.Body.configured)"))

    $r = Invoke-AerosuiteApi -Method GET -Path '/api/integracoes/bling/contatos?pesquisa=test&limit=3' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $contatosOk = $r.Ok -and $null -ne $r.Body.items
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/integracoes/bling/contatos' -Passed $contatosOk -Detail "items=$($r.Body.items.Count)"))

    $r = Invoke-AerosuiteApi -Method POST -Path '/api/integracoes/bling/webhook' -ApiBaseUrl $cfg.ApiBaseUrl -Body ''
    $webhookReachable = $r.StatusCode -eq 400 -or $r.StatusCode -eq 401 -or $r.Ok
    $results.Add((New-AerosuiteTestResult -Name 'POST /api/integracoes/bling/webhook (rota publica)' -Passed $webhookReachable -Detail "status=$($r.StatusCode)"))

    $r = Invoke-AerosuiteApi -Method GET -Path '/api/propostas-comerciais?status=APROVADA&size=1' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $propId = $null
    if ($r.Ok -and $r.Body.content -and $r.Body.content.Count -gt 0) {
        $propId = [long]$r.Body.content[0].id
    }
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/propostas-comerciais (APROVADA)' -Passed $r.Ok -Detail $(if ($propId) { "id=$propId" } else { 'sem proposta aprovada no tenant' })))

    if ($propId) {
        $r = Invoke-AerosuiteApi -Method GET -Path "/api/propostas-comerciais/$propId/aditivos" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
        $adOk = $r.Ok -and ($null -ne $r.Body)
        $results.Add((New-AerosuiteTestResult -Name 'GET /api/propostas-comerciais/{id}/aditivos' -Passed $adOk -Detail "count=$($r.Body.Count)"))

        $r = Invoke-AerosuiteApi -Method GET -Path "/api/propostas-comerciais/$propId/anexos" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
        $anOk = $r.Ok -and ($null -ne $r.Body)
        $results.Add((New-AerosuiteTestResult -Name 'GET /api/propostas-comerciais/{id}/anexos' -Passed $anOk -Detail "count=$($r.Body.Count)"))

        $r = Invoke-AerosuiteApi -Method GET -Path "/api/propostas-comerciais/$propId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
        $dtoOk = $r.Ok -and ($null -ne $r.Body.aditivos) -and ($null -ne $r.Body.anexos)
        $results.Add((New-AerosuiteTestResult -Name 'GET /api/propostas-comerciais/{id} (aditivos+anexos no DTO)' -Passed $dtoOk))
    }

    # P4.1 — gerar OS a partir de proposta APROVADA sem vínculo
    $gerarPropId = $null
    $r = Invoke-AerosuiteApi -Method GET -Path '/api/propostas-comerciais?status=APROVADA&size=25' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    if ($r.Ok -and $r.Body.content) {
        foreach ($p in @($r.Body.content)) {
            if (-not $p.osId) { $gerarPropId = [long]$p.id; break }
        }
    }
    if (-not $gerarPropId) {
        $numero = "SMOKE-GERAR-OS-$(Get-Date -Format 'yyyyMMddHHmmss')"
        $create = Invoke-AerosuiteApi -Method POST -Path '/api/propostas-comerciais' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
            numeroProposta = $numero
            status         = 'APROVADA'
            clienteNome    = 'Cliente Smoke Gerar OS'
            produtoNome    = 'Servico smoke P4.1'
            produtoValor   = 500
            valorTotalFinal = 500
        }
        if ($create.Ok -and $create.Body.id) { $gerarPropId = [long]$create.Body.id }
    }
    if ($gerarPropId) {
        $r = Invoke-AerosuiteApi -Method POST -Path "/api/propostas-comerciais/$gerarPropId/gerar-os" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{}
        $osId = $null
        if ($r.Body.os) { $osId = $r.Body.os.id }
        if (-not $osId -and $r.Body.proposta) { $osId = $r.Body.proposta.osId }
        $gerarOk = $r.Ok -and $null -ne $osId
        $results.Add((New-AerosuiteTestResult -Name 'POST /api/propostas-comerciais/{id}/gerar-os (P4.1)' -Passed $gerarOk -Detail "proposta=$gerarPropId osId=$osId status=$($r.StatusCode)"))
    } else {
        $results.Add((New-AerosuiteTestResult -Name 'POST /api/propostas-comerciais/{id}/gerar-os (P4.1)' -Passed $false -Detail 'nao foi possivel obter proposta APROVADA sem OS'))
    }
}

$demoEmail = $env:AEROSUITE_DEMO_EMAIL
$demoPass = $env:AEROSUITE_DEMO_PASSWORD
$demoTenant = $(if ($env:AEROSUITE_DEMO_TENANT) { $env:AEROSUITE_DEMO_TENANT } else { 'demo' })
$demoToken = $null
if ($demoEmail -and $demoPass) {
    $demoLogin = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        email = $demoEmail; password = $demoPass; tenantCodigo = $demoTenant
    }
    if ($demoLogin.Ok -and $demoLogin.Body.token) { $demoToken = [string]$demoLogin.Body.token }
}
$results.Add((New-AerosuiteTestResult -Name 'Login tenant demo (billing/LGPD)' -Passed ([bool]$demoToken) -Detail $(if ($demoToken) { $demoTenant } else { 'defina AEROSUITE_DEMO_* ou -ProvisionDemoIfMissing' })))

if ($demoToken) {
    $r = Invoke-AerosuiteApi -Method GET -Path '/api/billing/status' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/billing/status (demo)' -Passed $r.Ok -Detail "provedor=$($r.Body.provedor)"))

    $r = Invoke-AerosuiteApi -Method POST -Path '/api/billing/checkout-session' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken -Body @{}
    $results.Add((New-AerosuiteTestResult -Name 'POST /api/billing/checkout-session (demo)' -Passed ($r.Ok -and $r.Body.checkoutUrl) -Detail "status=$($r.StatusCode)"))

    if (-not $SkipLgpdExport) {
        $r = Invoke-AerosuiteApi -Method POST -Path '/api/lgpd/solicitacoes' -ApiBaseUrl $cfg.ApiBaseUrl -Token $demoToken -Body @{ tipo = 'EXPORT' }
        $ok = $r.Ok -and $r.Body -and ($r.Body.status -eq 'COMPLETED' -or $r.Body.status -eq 'PENDING')
        $dl = $r.Body.downloadAvailable -eq $true
        $results.Add((New-AerosuiteTestResult -Name 'POST /api/lgpd/solicitacoes EXPORT (demo)' -Passed $ok -Detail "status=$($r.Body.status) download=$dl"))
    }
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
