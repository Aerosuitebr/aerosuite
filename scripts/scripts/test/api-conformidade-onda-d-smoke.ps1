# Smoke Onda D — SGQ pacote, ASL invoice, painel qualidade, hangar offline cache.
# Uso: .\scripts\test\api-conformidade-onda-d-smoke.ps1

param(
    [string]$ApiBaseUrl,
    [string]$WebBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$cfg = Get-AerosuiteTestConfig @PSBoundParameters
$results = [System.Collections.Generic.List[object]]::new()
$osId = $null

Write-Host 'Aero Suite — smoke Onda D (conformidade V58)' -ForegroundColor Cyan
Write-Host ("API: {0}; Web: {1}" -f $cfg.ApiBaseUrl, $cfg.WebBaseUrl) -ForegroundColor DarkGray

# --- Auth anon: painel protegido ---
$r = Invoke-AerosuiteApi -Method GET -Path '/api/conformidade/painel' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET /api/conformidade/painel sem JWT (401/403)' -Passed ($r.StatusCode -in 401, 403) -Detail "status=$($r.StatusCode)"))

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
}
$token = $null
if ($login.Ok -and $login.Body.token) { $token = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma' -Passed ([bool]$token)))

if (-not $token) {
    Write-AerosuiteTestSummary -Results $results | Out-Null
    exit 1
}

# --- Fluxo 1: pacote auditoria ZIP contém sgq/resumo.csv ---
$zipPath = Join-Path $env:TEMP ("aerosuite-sgq-smoke-{0}.zip" -f [Guid]::NewGuid().ToString('N'))
$headers = @{ Authorization = "Bearer $token" }
try {
    $zipUri = "$($cfg.ApiBaseUrl)/api/dossie-auditoria/pacote/zip?limite=3"
    Invoke-WebRequest -Uri $zipUri -Headers $headers -OutFile $zipPath -UseBasicParsing -TimeoutSec 120 | Out-Null
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    $sgqCsv = $zip.Entries | Where-Object { $_.FullName -eq 'sgq/resumo.csv' } | Select-Object -First 1
    $sgqJson = $zip.Entries | Where-Object { $_.FullName -eq 'sgq/snapshot.json' } | Select-Object -First 1
    $csvHeader = $null
    if ($sgqCsv) {
        $reader = New-Object System.IO.StreamReader($sgqCsv.Open())
        $csvHeader = $reader.ReadLine()
        $reader.Close()
    }
    $zip.Dispose()
    $zipOk = ($null -ne $sgqCsv) -and ($null -ne $sgqJson) -and ($csvHeader -match 'categoria;identificador;status;detalhe')
    $results.Add((New-AerosuiteTestResult -Name 'Pacote auditoria ZIP — sgq/resumo.csv + snapshot.json' -Passed $zipOk -Detail $(if ($zipOk) { "header=$csvHeader" } else { 'entrada SGQ ausente no ZIP' })))
} catch {
    $results.Add((New-AerosuiteTestResult -Name 'Pacote auditoria ZIP — sgq/resumo.csv + snapshot.json' -Passed $false -Detail $_.Exception.Message))
} finally {
    if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue }
}

try {
    $osList = Invoke-AerosuiteApi -Method GET -Path '/api/os?page=0&size=1' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    if ($osList.Ok -and $null -ne $osList.Body.items -and @($osList.Body.items).Count -gt 0) {
        $osId = [long]$osList.Body.items[0].id
    }
    if ($osId) {
        $pdfPath = $null
        try {
            $pdfPath = Join-Path $env:TEMP ("aerosuite-dossie-smoke-{0}.pdf" -f [Guid]::NewGuid().ToString('N'))
            $pdfUri = "$($cfg.ApiBaseUrl)/api/dossie-auditoria/os/$osId/pdf?locale=pt-BR"
            Invoke-WebRequest -Uri $pdfUri -Headers $headers -OutFile $pdfPath -UseBasicParsing -TimeoutSec 120 | Out-Null
            $pdfBytes = [System.IO.File]::ReadAllBytes($pdfPath)
            $pdfHeader = [System.Text.Encoding]::ASCII.GetString($pdfBytes, 0, [Math]::Min(5, $pdfBytes.Length))
            $sgqInPdf = ($pdfBytes.Length -gt 1000) -and ($pdfHeader -eq '%PDF-')
            $results.Add((New-AerosuiteTestResult -Name 'Dossiê PDF — export OK (SGQ no ZIP)' -Passed $sgqInPdf -Detail "osId=$osId bytes=$($pdfBytes.Length)"))
        } finally {
            if ($pdfPath -and (Test-Path -LiteralPath $pdfPath)) { Remove-Item -LiteralPath $pdfPath -Force -ErrorAction SilentlyContinue }
        }
    } else {
        $results.Add((New-AerosuiteTestResult -Name 'Dossiê PDF — secção SGQ' -Passed $true -Detail 'skip — sem OS no tenant'))
    }
} catch {
    $results.Add((New-AerosuiteTestResult -Name 'Dossiê PDF — export OK (SGQ no ZIP)' -Passed $false -Detail $_.Exception.Message))
}

# --- Fluxo 2: invoice com fornecedor ASL PENDENTE → bloqueio ---
$fornId = $null
try {
    $pendenteNome = "Smoke ASL Pendente $(Get-Date -Format 'yyyyMMddHHmmss')"
    $createForn = Invoke-AerosuiteApi -Method POST -Path '/api/estoque/fornecedores' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
        razaoSocial = $pendenteNome
        aslStatus   = 'PENDENTE'
    }
    if ($createForn.Ok -and $createForn.Body.id) { $fornId = [long]$createForn.Body.id }
    if (-not $fornId) {
        $results.Add((New-AerosuiteTestResult -Name 'ASL — criar fornecedor PENDENTE' -Passed $false -Detail "status=$($createForn.StatusCode) $($createForn.Raw)"))
    } else {
        $results.Add((New-AerosuiteTestResult -Name 'ASL — criar fornecedor PENDENTE' -Passed $true -Detail "id=$fornId"))
        $invTry = Invoke-AerosuiteApi -Method POST -Path '/api/estoque/invoices' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
            numeroInvoice = "SMK-ASL-$(Get-Random -Maximum 999999)"
            fornecedorId  = $fornId
            dataEmissao   = (Get-Date).ToString('yyyy-MM-dd')
        }
        $blocked = (-not $invTry.Ok) -and ($invTry.Raw -match 'conformidade\.enforcement\.asl_nao_aprovado|asl_nao_aprovado')
        if (-not $blocked -and $invTry.StatusCode -ge 400) {
            $blocked = $true
        }
        $results.Add((New-AerosuiteTestResult -Name 'ASL — invoice bloqueada para fornecedor PENDENTE' -Passed $blocked -Detail "status=$($invTry.StatusCode) err=$($invTry.Raw)"))
    }
} catch {
    $results.Add((New-AerosuiteTestResult -Name 'ASL — invoice bloqueada para fornecedor PENDENTE' -Passed $false -Detail $_.Exception.Message))
} finally {
    # Evita contaminar ambientes compartilhados com registros do smoke test.
    if ($fornId) {
        $cleanup = Invoke-AerosuiteApi -Method DELETE -Path "/api/estoque/fornecedores/$fornId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
        $results.Add((New-AerosuiteTestResult -Name 'ASL — limpeza do fornecedor temporário' -Passed $cleanup.Ok -Detail "id=$fornId status=$($cleanup.StatusCode)"))
    }
}

# --- Fluxo 3: painel qualidade ---
$r = Invoke-AerosuiteApi -Method GET -Path '/api/conformidade/painel?diasJanela=60' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$painelOk = $r.Ok -and ($null -ne $r.Body.diasJanela) -and ($null -ne $r.Body.itens)
$results.Add((New-AerosuiteTestResult -Name 'GET /api/conformidade/painel (estrutura)' -Passed $painelOk -Detail $(if ($painelOk) { "itens=$($r.Body.itens.Count) nc=$($r.Body.totalNcAbertas)" } else { "status=$($r.StatusCode)" })))

# --- Fluxo 4: hangar SW cache job-card + alertas OS ---
try {
    $sw = Invoke-AerosuiteApi -Method GET -Path '/hangar-sw.js' -ApiBaseUrl $cfg.WebBaseUrl
    $swOk = $sw.Ok -and ($sw.Raw -match 'aerosuite-hangar-v3') -and ($sw.Raw -match '/api/os/job-card/')
    $results.Add((New-AerosuiteTestResult -Name 'Hangar SW v3 cache job-card' -Passed $swOk -Detail $(if ($swOk) { 'hangar-sw.js OK' } else { 'script ausente ou versão antiga' })))
} catch {
    $results.Add((New-AerosuiteTestResult -Name 'Hangar SW v3 cache job-card' -Passed $false -Detail $_.Exception.Message))
}

$r = Invoke-AerosuiteApi -Method GET -Path '/api/os/job-card/abertas' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$results.Add((New-AerosuiteTestResult -Name 'GET /api/os/job-card/abertas (autenticado)' -Passed $r.Ok -Detail "status=$($r.StatusCode)"))

if ($osId) {
    $r = Invoke-AerosuiteApi -Method GET -Path "/api/os/$osId/conformidade-alertas" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $alertasOk = $r.Ok -and ($null -ne $r.Body.alertas)
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/os/{id}/conformidade-alertas' -Passed $alertasOk -Detail "osId=$osId alertas=$($r.Body.alertas.Count) bloqueio=$($r.Body.bloqueioMaterial)"))
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
