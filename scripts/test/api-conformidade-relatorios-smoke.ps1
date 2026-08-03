# P5.3/P5.4 — smoke API SMS indicadores + relatório SGQ exportável.
# Uso: .\scripts\test\api-conformidade-relatorios-smoke.ps1

param(
    [string]$ApiBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

Add-Type -AssemblyName System.IO.Compression.FileSystem

$cfg = Get-AerosuiteTestConfig @PSBoundParameters
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite — smoke conformidade SMS + relatórios SGQ (P5.3/P5.4)' -ForegroundColor Cyan

$rAnonSms = Invoke-AerosuiteApi -Method GET -Path '/api/conformidade/sms/indicadores' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET SMS indicadores sem JWT (401/403)' -Passed ($rAnonSms.StatusCode -in 400, 401, 403) -Detail "status=$($rAnonSms.StatusCode)"))

$rAnonZip = Invoke-AerosuiteApi -Method GET -Path '/api/conformidade/relatorios/sgq.zip' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET relatório SGQ sem JWT (401/403)' -Passed ($rAnonZip.StatusCode -in 400, 401, 403) -Detail "status=$($rAnonZip.StatusCode)"))

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body (New-AerosuiteLoginBody -Email $cfg.Email -Password $cfg.Password -TenantCodigo $cfg.TenantCodigo)
$token = $null
if ($login.Ok -and $login.Body.token) { $token = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma' -Passed ([bool]$token)))

if (-not $token) {
    Write-AerosuiteTestSummary -Results $results | Out-Null
    exit 1
}

$sms = Invoke-AerosuiteApi -Method GET -Path '/api/conformidade/sms/indicadores?dias=60' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$smsOk = $sms.Ok -and $null -ne $sms.Body
$smsFields = $false
if ($smsOk) {
    $smsFields = ($null -ne $sms.Body.diasJanela) -and
        ($null -ne $sms.Body.ncAbertas) -and
        ($null -ne $sms.Body.scoreRisco) -and
        ($null -ne $sms.Body.porSeveridade) -and
        ($null -ne $sms.Body.tendenciaMensal) -and
        ($sms.Body.tendenciaMensal.Count -ge 6)
}
$results.Add((New-AerosuiteTestResult -Name 'GET SMS indicadores — KPIs + tendência 6 meses' -Passed ($smsOk -and $smsFields) -Detail $(if ($smsOk) { "abertas=$($sms.Body.ncAbertas); score=$($sms.Body.scoreRisco)" } else { "status=$($sms.StatusCode)" })))

$zipPath = Join-Path $env:TEMP ("aerosuite-relatorio-sgq-{0}.zip" -f [Guid]::NewGuid().ToString('N'))
try {
    $headers = @{ Authorization = "Bearer $token" }
    $zipUri = "$($cfg.ApiBaseUrl)/api/conformidade/relatorios/sgq.zip?dias=60"
    Invoke-WebRequest -Uri $zipUri -Headers $headers -OutFile $zipPath -UseBasicParsing -TimeoutSec 120 | Out-Null
    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    $expected = @('resumo.csv', 'nao_conformidades.csv', 'documentos.csv', 'treinamentos.csv', 'calibracao.csv', 'subcontratacao.csv', 'asl.csv', 'snapshot.json', 'README.txt')
    $missing = @()
    foreach ($name in $expected) {
        $entry = $zip.Entries | Where-Object { $_.FullName -eq $name } | Select-Object -First 1
        if (-not $entry) { $missing += $name }
    }
    $csvHeader = ''
    $resumo = $zip.Entries | Where-Object { $_.FullName -eq 'resumo.csv' } | Select-Object -First 1
    if ($resumo) {
        $sr = New-Object System.IO.StreamReader($resumo.Open())
        $csvHeader = $sr.ReadLine()
        $sr.Close()
    }
    $zip.Dispose()
    $zipOk = ($missing.Count -eq 0) -and ($csvHeader -match 'categoria;identificador;status;detalhe')
    $results.Add((New-AerosuiteTestResult -Name 'Relatório SGQ ZIP — 9 arquivos + header resumo.csv' -Passed $zipOk -Detail $(if ($zipOk) { "header=$csvHeader" } else { "faltando: $($missing -join ', ')" })))
}
catch {
    $results.Add((New-AerosuiteTestResult -Name 'Relatório SGQ ZIP — 9 arquivos + header resumo.csv' -Passed $false -Detail $_.Exception.Message))
}
finally {
    if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue }
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
