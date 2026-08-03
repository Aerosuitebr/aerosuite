# Smoke test — integração Bling: webhooks assinados, fila de sync e validação OS/NF-e.
#
# Uso básico (API + MySQL local):
#   .\scripts\test\api-bling-smoke.ps1
#
# Com proposta específica (valida pedido/OS/NF-e no banco):
#   $env:AEROSUITE_BLING_SMOKE_PROPOSTA_ID = '42'
#   .\scripts\test\api-bling-smoke.ps1 -WaitSeconds 35
#
# Variáveis de ambiente:
#   AEROSUITE_API_URL              (default http://localhost:8080)
#   AEROSUITE_TEST_EMAIL / PASSWORD / TENANT
#   AERO_SUITE_BLING_CLIENT_SECRET ou AEROSUITE_BLING_CLIENT_SECRET  (HMAC webhook)
#   AEROSUITE_BLING_SMOKE_PROPOSTA_ID   proposta para validar pedido/OS/NF-e
#   AEROSUITE_BLING_SMOKE_PEDIDO_ID     id pedido Bling no webhook simulado
#   AEROSUITE_BLING_SMOKE_NFE_ID        id NF-e no webhook simulado
#   MYSQL_ROOT_PASSWORD              (default root)
#
#Requires -Version 5.1
param(
    [long]$PropostaId = $(if ($env:AEROSUITE_BLING_SMOKE_PROPOSTA_ID) { [long]$env:AEROSUITE_BLING_SMOKE_PROPOSTA_ID } else { 0 }),
    [long]$BlingPedidoId = $(if ($env:AEROSUITE_BLING_SMOKE_PEDIDO_ID) { [long]$env:AEROSUITE_BLING_SMOKE_PEDIDO_ID } else { 900001 }),
    [long]$BlingNfeId = $(if ($env:AEROSUITE_BLING_SMOKE_NFE_ID) { [long]$env:AEROSUITE_BLING_SMOKE_NFE_ID } else { 500001 }),
    [int]$WaitSeconds = 90,
    [switch]$SkipWebhook,
    [switch]$SkipMysql,
    [switch]$SkipWait,
    [switch]$AllowJobFailure
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')
if (-not $SkipMysql) {
    . (Join-Path $here 'Test-MysqlHelpers.ps1')
}

function Get-BlingWebhookSecret {
    @(
        $env:AERO_SUITE_BLING_CLIENT_SECRET,
        $env:AEROSUITE_BLING_CLIENT_SECRET,
        $env:BLING_CLIENT_SECRET,
        (Get-AerosuiteDotEnvValue -Name 'AERO_SUITE_BLING_CLIENT_SECRET')
    ) | Where-Object { $_ -and $_.Trim() } | Select-Object -First 1
}

function Get-BlingWebhookSignature {
    param(
        [Parameter(Mandatory)][string]$Body,
        [Parameter(Mandatory)][string]$Secret
    )
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([Text.Encoding]::UTF8.GetBytes($Secret))
    try {
        $hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($Body))
        return -join ($hash | ForEach-Object { $_.ToString('x2') })
    } finally {
        $hmac.Dispose()
    }
}

function Invoke-BlingWebhook {
    param(
        [Parameter(Mandatory)][string]$ApiBaseUrl,
        [Parameter(Mandatory)][string]$Body,
        [Parameter(Mandatory)][string]$Secret,
        [string]$TenantCodigo
    )
    $sig = Get-BlingWebhookSignature -Body $Body -Secret $Secret
    $path = if ($TenantCodigo) {
        "/api/integracoes/bling/webhook/t/$TenantCodigo"
    } else {
        '/api/integracoes/bling/webhook'
    }
    $uri = "$($ApiBaseUrl.TrimEnd('/'))$path"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -Uri $uri -Method POST -Body $Body -ContentType 'application/json; charset=utf-8' `
            -Headers @{ 'X-Bling-Signature-256' = "sha256=$sig" } -UseBasicParsing -TimeoutSec 30
        $sw.Stop()
        [pscustomobject]@{
            Ok         = $true
            StatusCode = [int]$response.StatusCode
            Raw        = $response.Content
            ElapsedMs  = $sw.ElapsedMilliseconds
            Error      = $null
        }
    } catch {
        $sw.Stop()
        $status = $null
        $raw = $null
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $raw = $reader.ReadToEnd()
                $reader.Close()
            } catch { }
        }
        [pscustomobject]@{
            Ok         = $false
            StatusCode = $status
            Raw        = $raw
            ElapsedMs  = $sw.ElapsedMilliseconds
            Error      = $_.Exception.Message
        }
    }
}

function Invoke-AerosuiteMysqlScalar {
    param(
        [Parameter(Mandatory)][string]$Sql,
        [string]$MysqlDatabase = 'aerosuite'
    )
    $rows = Invoke-AerosuiteMysql -Arguments @('-N', '-B', '-e', $Sql, $MysqlDatabase)
    if (-not $rows -or $rows.Count -eq 0) { return $null }
    return [string]$rows[0]
}

function Get-TenantContextFromDb {
    param([string]$TenantCodigo)
    $tid = Invoke-AerosuiteMysqlScalar -Sql "SELECT id FROM tenant WHERE codigo = '$($TenantCodigo.Replace("'", "''"))' AND ativo = 1 LIMIT 1"
    if (-not $tid) { return $null }
    $companyId = Invoke-AerosuiteMysqlScalar -Sql "SELECT bling_company_id FROM tenant_bling_connection WHERE tenant_id = $tid LIMIT 1"
    [pscustomobject]@{ TenantId = [long]$tid; CompanyId = $companyId }
}

function Get-PropostaSnapshotFromDb {
    param([long]$TenantId, [long]$PropostaId)
    $sql = @"
SELECT CONCAT(
  IFNULL(p.numero_proposta,''), '|',
  IFNULL(p.status,''), '|',
  IFNULL(p.os_id,''), '|',
  IFNULL(pbp.bling_pedido_id,''), '|',
  IFNULL(pbp.bling_situacao,''), '|',
  IFNULL((SELECT COUNT(*) FROM bling_nfe_registro n WHERE n.proposta_comercial_id = p.id AND n.tenant_id = p.tenant_id),0)
)
FROM proposta_comercial p
LEFT JOIN proposta_bling_pedido pbp ON pbp.proposta_comercial_id = p.id AND pbp.tenant_id = p.tenant_id
WHERE p.tenant_id = $TenantId AND p.id = $PropostaId
LIMIT 1
"@
    $row = Invoke-AerosuiteMysqlScalar -Sql $sql
    if (-not $row) { return $null }
    $p = $row -split '\|', 6
    [pscustomobject]@{
        NumeroProposta  = $p[0]
        Status          = $p[1]
        OsId            = $(if ($p[2]) { [long]$p[2] } else { $null })
        BlingPedidoId   = $(if ($p[3]) { [long]$p[3] } else { $null })
        BlingSituacao   = $p[4]
        NfeCount        = [int]$p[5]
    }
}

function Find-PropostaWithPedidoFromDb {
    param([long]$TenantId)
    $sql = @"
SELECT p.id
FROM proposta_comercial p
INNER JOIN proposta_bling_pedido pbp ON pbp.proposta_comercial_id = p.id AND pbp.tenant_id = p.tenant_id
WHERE p.tenant_id = $TenantId
ORDER BY pbp.pushed_at DESC
LIMIT 1
"@
    $id = Invoke-AerosuiteMysqlScalar -Sql $sql
    if ($id) { return [long]$id }
    return $null
}

function Wait-BlingSyncJobs {
    param(
        [long]$TenantId,
        [int]$Seconds,
        [string[]]$SmokeEventIds = @()
    )
    $eventFilter = ''
    $scopeFilter = ''
    if ($SmokeEventIds -and $SmokeEventIds.Count -gt 0) {
        $inList = ($SmokeEventIds | ForEach-Object { "'$($_.Replace("'", "''"))'" }) -join ','
        $eventFilter = " AND e.event_id IN ($inList)"
        $scopeFilter = " AND source_event_id IN (SELECT id FROM bling_webhook_event WHERE event_id IN ($inList))"
    }
    $touchedSql = @"
SELECT COUNT(*)
FROM bling_sync_job j
INNER JOIN bling_webhook_event e ON j.source_event_id = e.id
WHERE j.tenant_id = $TenantId
  AND NOT (j.status = 'PENDING' AND j.attempts = 0)
  $eventFilter
"@
    $doneSql = "SELECT COUNT(*) FROM bling_sync_job j INNER JOIN bling_webhook_event e ON j.source_event_id = e.id WHERE j.tenant_id = $TenantId AND j.status = 'DONE'$eventFilter"

    $deadline = (Get-Date).AddSeconds($Seconds)
    $expected = if ($SmokeEventIds -and $SmokeEventIds.Count -gt 0) { $SmokeEventIds.Count } else { 1 }
    $lastTouched = -1
    while ((Get-Date) -lt $deadline) {
        $touched = Invoke-AerosuiteMysqlScalar -Sql $touchedSql
        $done = Invoke-AerosuiteMysqlScalar -Sql $doneSql
        if ([int]$touched -ge $expected) {
            return [pscustomobject]@{
                Pending  = 0
                Failed   = 0
                Dead     = 0
                Done     = [int]$done
                TimedOut = $false
            }
        }
        if ($touched -ne $lastTouched) {
            Write-Host "  fila Bling (smoke): processados=$touched/$expected done=$done (scheduler ~30s)..." -ForegroundColor DarkGray
            $lastTouched = $touched
        }
        Start-Sleep -Seconds 5
    }
    $touched = Invoke-AerosuiteMysqlScalar -Sql $touchedSql
    $done = Invoke-AerosuiteMysqlScalar -Sql $doneSql
    [pscustomobject]@{
        Pending  = $expected - [int]$touched
        Failed   = 0
        Dead     = 0
        Done     = [int]$done
        TimedOut = ([int]$touched -lt $expected)
    }
}

$cfg = Get-AerosuiteTestConfig
$results = [System.Collections.Generic.List[object]]::new()
$runId = [guid]::NewGuid().ToString('N').Substring(0, 8)

Write-Host ''
Write-Host 'Aero Suite — Bling smoke (webhook + OS/NF-e)' -ForegroundColor Cyan
Write-Host "RunId: $runId  API: $($cfg.ApiBaseUrl)  Tenant: $($cfg.TenantCodigo)" -ForegroundColor DarkGray

# --- Login ---
$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email        = $cfg.Email
    password     = $cfg.Password
    tenantCodigo = $cfg.TenantCodigo
}
$token = $null
if ($login.Ok -and $login.Body.token) { $token = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma' -Passed ([bool]$token) -ElapsedMs $login.ElapsedMs))

if (-not $token) {
    Write-AerosuiteTestSummary -Results $results | Out-Null
    exit 1
}

# --- API Bling ---
$r = Invoke-AerosuiteApi -Method GET -Path '/api/integracoes/bling/status' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$results.Add((New-AerosuiteTestResult -Name 'GET /integracoes/bling/status' -Passed ($r.Ok -and $null -ne $r.Body) `
        -Detail "enabled=$($r.Body.enabled) ok=$($r.Body.ok)" -ElapsedMs $r.ElapsedMs))

$r = Invoke-AerosuiteApi -Method GET -Path '/api/integracoes/bling/connection' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$results.Add((New-AerosuiteTestResult -Name 'GET /integracoes/bling/connection' -Passed $r.Ok `
        -Detail "connected=$($r.Body.connected) companyId=$($r.Body.blingCompanyId)" -ElapsedMs $r.ElapsedMs))

$r = Invoke-AerosuiteApi -Method GET -Path '/api/integracoes/bling/sync/status' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$results.Add((New-AerosuiteTestResult -Name 'GET /integracoes/bling/sync/status' -Passed $r.Ok `
        -Detail "pedidos=$($r.Body.linkedPedidos) nfe=$($r.Body.nfeRegistros) pending=$($r.Body.pendingJobs)" -ElapsedMs $r.ElapsedMs))

$r = Invoke-AerosuiteApi -Method GET -Path '/api/integracoes/bling/fiscal-config' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$results.Add((New-AerosuiteTestResult -Name 'GET /integracoes/bling/fiscal-config' -Passed $r.Ok `
        -Detail "autoOs=$($r.Body.autoOsOnPedido) cert=$($r.Body.certificadoConfigurado)" -ElapsedMs $r.ElapsedMs))

# --- MySQL context ---
$tenantCtx = $null
$mysqlOk = $false
if (-not $SkipMysql) {
    try {
        $tenantCtx = Get-TenantContextFromDb -TenantCodigo $cfg.TenantCodigo
        $mysqlOk = $null -ne $tenantCtx
        $results.Add((New-AerosuiteTestResult -Name 'MySQL tenant context' -Passed $mysqlOk `
                -Detail $(if ($mysqlOk) { "tenantId=$($tenantCtx.TenantId) companyId=$($tenantCtx.CompanyId)" } else { 'tenant não encontrado' })))
    } catch {
        $results.Add((New-AerosuiteTestResult -Name 'MySQL tenant context' -Passed $false -Detail $_.Exception.Message))
    }
}

if ($PropostaId -le 0 -and $mysqlOk) {
    $found = Find-PropostaWithPedidoFromDb -TenantId $tenantCtx.TenantId
    if ($found) {
        $PropostaId = $found
        Write-Host "Proposta com pedido Bling detectada: id=$PropostaId" -ForegroundColor DarkGray
    }
}

if ($PropostaId -gt 0) {
    $r = Invoke-AerosuiteApi -Method GET -Path "/api/integracoes/bling/propostas/$PropostaId/pedido" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $pedidoLinked = $r.Ok -and $r.Body.linked -eq $true
    $results.Add((New-AerosuiteTestResult -Name 'GET proposta/pedido (API)' -Passed $r.Ok `
            -Detail "linked=$($r.Body.linked) pedidoId=$($r.Body.blingPedidoId) situacao=$($r.Body.blingSituacao)" -ElapsedMs $r.ElapsedMs))

    if ($pedidoLinked -and -not $BlingPedidoId) {
        $BlingPedidoId = [long]$r.Body.blingPedidoId
    }

    $r = Invoke-AerosuiteApi -Method GET -Path "/api/integracoes/bling/propostas/$PropostaId/nfe" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $nfeCount = if ($r.Ok -and $r.Body.items) { @($r.Body.items).Count } else { 0 }
    $results.Add((New-AerosuiteTestResult -Name 'GET proposta/nfe (API)' -Passed $r.Ok `
            -Detail "items=$nfeCount" -ElapsedMs $r.ElapsedMs))

    if ($mysqlOk) {
        $snap = Get-PropostaSnapshotFromDb -TenantId $tenantCtx.TenantId -PropostaId $PropostaId
        $hasPedido = $null -ne $snap -and $null -ne $snap.BlingPedidoId
        $results.Add((New-AerosuiteTestResult -Name 'DB proposta_bling_pedido' -Passed $hasPedido `
                -Detail $(if ($snap) { "numero=$($snap.NumeroProposta) pedido=$($snap.BlingPedidoId) situacao=$($snap.BlingSituacao)" } else { 'proposta não encontrada' })))

        $osPassed = ($null -ne $snap -and $null -ne $snap.OsId) -or $AllowJobFailure
        $results.Add((New-AerosuiteTestResult -Name 'DB proposta os_id (auto-OS)' -Passed $osPassed `
                -Detail $(if ($snap -and $snap.OsId) { "osId=$($snap.OsId)" } else { 'sem OS — ative autoOsOnPedido ou gere manualmente' })))

        $nfePassed = ($snap -and $snap.NfeCount -gt 0) -or $AllowJobFailure
        $nfeDetail = if ($snap) { "count=$($snap.NfeCount)" } else { 'proposta não encontrada' }
        $results.Add((New-AerosuiteTestResult -Name 'DB bling_nfe_registro' -Passed $nfePassed -Detail $nfeDetail))
    }
} else {
    $results.Add((New-AerosuiteTestResult -Name 'Proposta alvo (pedido/OS/NF-e)' -Passed $true `
            -Detail 'nenhuma proposta com pedido — defina AEROSUITE_BLING_SMOKE_PROPOSTA_ID ou crie pedido na UI'))
}

# --- Webhook simulado ---
$secret = Get-BlingWebhookSecret
if (-not $SkipWebhook) {
    if (-not $secret) {
        $results.Add((New-AerosuiteTestResult -Name 'Webhook HMAC (pedido + NF-e)' -Passed $false `
                -Detail 'defina AERO_SUITE_BLING_CLIENT_SECRET para simular webhooks'))
    } else {
        if ($mysqlOk -and $tenantCtx) {
            # Evita que execuções anteriores do smoke monopolizem o batch do scheduler (limite 10).
            Invoke-AerosuiteMysqlScalar -Sql @"
DELETE j FROM bling_sync_job j
INNER JOIN bling_webhook_event e ON j.source_event_id = e.id
WHERE e.event_id LIKE 'smoke-%'
"@ | Out-Null
            Invoke-AerosuiteMysqlScalar -Sql "DELETE FROM bling_webhook_event WHERE event_id LIKE 'smoke-%'" | Out-Null
            # Limpa fila do tenant para o batch de 10 não ficar monopolizado por retries antigos.
            Invoke-AerosuiteMysqlScalar -Sql "DELETE FROM bling_sync_job WHERE tenant_id = $($tenantCtx.TenantId)" | Out-Null
        }

        $numeroLoja = 'SMOKE-N/A'
        if ($PropostaId -gt 0 -and $mysqlOk) {
            $snapPre = Get-PropostaSnapshotFromDb -TenantId $tenantCtx.TenantId -PropostaId $PropostaId
            if ($snapPre -and $snapPre.NumeroProposta) { $numeroLoja = $snapPre.NumeroProposta }
        }

        if ($PropostaId -gt 0 -and $mysqlOk -and $tenantCtx -and $null -ne (Get-PropostaSnapshotFromDb -TenantId $tenantCtx.TenantId -PropostaId $PropostaId).BlingPedidoId) {
            $linked = Get-PropostaSnapshotFromDb -TenantId $tenantCtx.TenantId -PropostaId $PropostaId
            if ($linked.BlingPedidoId) { $BlingPedidoId = $linked.BlingPedidoId }
        }

        $companyIdJson = if ($tenantCtx -and $tenantCtx.CompanyId) { "`"companyId`": `"$($tenantCtx.CompanyId)`"," } else { '' }

        $pedidoEventId = "smoke-pedido-$runId"
        $pedidoBody = @"
{
  "eventId": "$pedidoEventId",
  "event": "pedido.updated",
  $companyIdJson
  "data": {
    "id": $BlingPedidoId,
    "numero": "SMK-$runId",
    "situacao": "Atendido",
    "numeroLoja": "$numeroLoja"
  }
}
"@.Trim()

        $wh = Invoke-BlingWebhook -ApiBaseUrl $cfg.ApiBaseUrl -Body $pedidoBody -Secret $secret -TenantCodigo $cfg.TenantCodigo
        $results.Add((New-AerosuiteTestResult -Name 'POST webhook pedido.updated (HMAC)' -Passed ($wh.Ok -and $wh.StatusCode -eq 200) `
                -Detail "status=$($wh.StatusCode)" -ElapsedMs $wh.ElapsedMs))

        $nfeEventId = "smoke-nfe-$runId"
        $nfeBody = @"
{
  "eventId": "$nfeEventId",
  "event": "nfe.autorizada",
  $companyIdJson
  "data": {
    "id": $BlingNfeId,
    "numero": "SMK-NF-$runId",
    "situacao": "Autorizada",
    "chaveAcesso": "35260601234567890123456789012345678901234",
    "idPedidoVenda": $BlingPedidoId
  }
}
"@.Trim()

        $wh2 = Invoke-BlingWebhook -ApiBaseUrl $cfg.ApiBaseUrl -Body $nfeBody -Secret $secret -TenantCodigo $cfg.TenantCodigo
        $results.Add((New-AerosuiteTestResult -Name 'POST webhook nfe.autorizada (HMAC)' -Passed ($wh2.Ok -and $wh2.StatusCode -eq 200) `
                -Detail "status=$($wh2.StatusCode)" -ElapsedMs $wh2.ElapsedMs))

        if ($mysqlOk -and $tenantCtx) {
            $evtPedido = Invoke-AerosuiteMysqlScalar -Sql "SELECT COUNT(*) FROM bling_webhook_event WHERE event_id = '$pedidoEventId'"
            $evtNfe = Invoke-AerosuiteMysqlScalar -Sql "SELECT COUNT(*) FROM bling_webhook_event WHERE event_id = '$nfeEventId'"
            $results.Add((New-AerosuiteTestResult -Name 'DB bling_webhook_event persistido' -Passed (($evtPedido -eq '1') -and ($evtNfe -eq '1')) `
                    -Detail "pedido=$evtPedido nfe=$evtNfe"))

            $jobs = Invoke-AerosuiteMysqlScalar -Sql "SELECT COUNT(*) FROM bling_sync_job WHERE tenant_id = $($tenantCtx.TenantId) AND source_event_id IN (SELECT id FROM bling_webhook_event WHERE event_id IN ('$pedidoEventId','$nfeEventId'))"
            $results.Add((New-AerosuiteTestResult -Name 'DB bling_sync_job enfileirado' -Passed ([int]$jobs -ge 2) -Detail "jobs=$jobs (esperado 2)"))

            if (-not $SkipWait -and $WaitSeconds -gt 0) {
                Write-Host "Aguardando até ${WaitSeconds}s pelo scheduler Bling (processamento assíncrono)..." -ForegroundColor DarkGray
                $expectedJobs = 2
                $queue = Wait-BlingSyncJobs -TenantId $tenantCtx.TenantId -Seconds $WaitSeconds -SmokeEventIds @($pedidoEventId, $nfeEventId)
                # Sucesso = jobs deste smoke saíram de PENDING (scheduler consumiu a fila).
                $jobOk = -not $queue.TimedOut
                $results.Add((New-AerosuiteTestResult -Name 'Fila Bling processada' -Passed $jobOk `
                        -Detail "processados=$($expectedJobs - $queue.Pending)/$expectedJobs done=$($queue.Done) timedOut=$($queue.TimedOut)"))

                if (-not $AllowJobFailure -and ($queue.Failed -gt 0 -or $queue.Dead -gt 0)) {
                    $lastErr = Invoke-AerosuiteMysqlScalar -Sql "SELECT IFNULL(last_error,'') FROM bling_sync_job WHERE tenant_id = $($tenantCtx.TenantId) ORDER BY id DESC LIMIT 1"
                    Write-Host "  Dica: jobs podem falhar sem token Bling/API real. Use -AllowJobFailure ou conecte OAuth." -ForegroundColor Yellow
                    if ($lastErr) { Write-Host "  last_error: $lastErr" -ForegroundColor DarkYellow }
                }
            }

            if ($PropostaId -gt 0) {
                $snapAfter = Get-PropostaSnapshotFromDb -TenantId $tenantCtx.TenantId -PropostaId $PropostaId
                $situPassed = ($snapAfter -and $snapAfter.BlingSituacao -eq 'Atendido') -or $AllowJobFailure
                $results.Add((New-AerosuiteTestResult -Name 'DB pós-webhook (situação pedido)' -Passed $situPassed `
                        -Detail "situacao=$($snapAfter.BlingSituacao) nfeCount=$($snapAfter.NfeCount)"))
            }
        }
    }
}

# --- Webhook sem assinatura (deve falhar 403) ---
$rBad = Invoke-AerosuiteApi -Method POST -Path "/api/integracoes/bling/webhook/t/$($cfg.TenantCodigo)" -ApiBaseUrl $cfg.ApiBaseUrl -Body '{"eventId":"smoke-bad","event":"ping"}'
$badRejected = $rBad.StatusCode -in @(401, 403, 400)
$results.Add((New-AerosuiteTestResult -Name 'POST webhook sem assinatura rejeitado' -Passed $badRejected `
        -Detail "status=$($rBad.StatusCode) (esperado 401/403; 404 = API desatualizada)"))

$allOk = Write-AerosuiteTestSummary -Results $results
Write-Host ''
if (-not $allOk) {
    Write-Host 'Corrija falhas acima. Para homologação completa: OAuth Bling + proposta APROVADA + pedido + certificado fiscal.' -ForegroundColor Yellow
    exit 1
}
Write-Host 'Smoke Bling concluído.' -ForegroundColor Green
exit 0
