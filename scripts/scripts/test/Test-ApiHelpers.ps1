# Funções partilhadas pelos scripts de smoke/stress da API Aero Suite.
#Requires -Version 5.1

function Get-AerosuiteRepoRoot {
    # Este ficheiro vive em scripts/test — dois níveis acima é a raiz do repo.
    (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

function Get-AerosuiteDotEnvValue {
    param(
        [Parameter(Mandatory)][string]$Name,
        [string]$EnvFile = $(Join-Path (Get-AerosuiteRepoRoot) '.env')
    )
    $fromEnv = [Environment]::GetEnvironmentVariable($Name)
    if ($fromEnv -and $fromEnv.Trim()) { return $fromEnv.Trim() }
    if (-not (Test-Path $EnvFile)) { return $null }
    foreach ($line in Get-Content -LiteralPath $EnvFile -Encoding UTF8) {
        $t = $line.Trim()
        if (-not $t -or $t.StartsWith('#')) { continue }
        if ($t -match '^\s*export\s+') { $t = $t -replace '^\s*export\s+', '' }
        if ($t -notmatch '^([^=]+)=(.*)$') { continue }
        $key = $Matches[1].Trim()
        if ($key -ne $Name) { continue }
        $val = $Matches[2].Trim()
        if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
            $val = $val.Substring(1, $val.Length - 2)
        }
        if ($val) { return $val }
    }
    return $null
}

function Get-AerosuiteTestConfig {
    param(
        [string]$ApiBaseUrl,
        [string]$WebBaseUrl,
        [string]$Email,
        [string]$Password,
        [string]$TenantCodigo,
        [int]$MinMenuItems
    )
    if (-not $ApiBaseUrl -or -not $ApiBaseUrl.Trim()) {
        $ApiBaseUrl = $(if ($env:AEROSUITE_API_URL) { $env:AEROSUITE_API_URL } else { 'http://localhost:8080' })
    }
    if (-not $WebBaseUrl -or -not $WebBaseUrl.Trim()) {
        $WebBaseUrl = $(if ($env:AEROSUITE_WEB_URL) { $env:AEROSUITE_WEB_URL } else { 'http://localhost:8081' })
    }
    if (-not $Email -or -not $Email.Trim()) {
        $Email = $(if ($env:AEROSUITE_TEST_EMAIL) { $env:AEROSUITE_TEST_EMAIL } else { 'admin@aerosuite.com' })
    }
    if (-not $Password -or -not $Password.Trim()) {
        $Password = $(if ($env:AEROSUITE_TEST_PASSWORD) { $env:AEROSUITE_TEST_PASSWORD } else { 'admin123' })
    }
    if (-not $TenantCodigo) {
        $TenantCodigo = $(if ($env:AEROSUITE_TEST_TENANT) { $env:AEROSUITE_TEST_TENANT } else { '' })
    }
    if (-not $MinMenuItems) {
        $MinMenuItems = $(if ($env:AEROSUITE_TEST_MIN_MENU) { [int]$env:AEROSUITE_TEST_MIN_MENU } else { 35 })
    }
    [pscustomobject]@{
        ApiBaseUrl   = $ApiBaseUrl.TrimEnd('/')
        WebBaseUrl   = $WebBaseUrl.TrimEnd('/')
        Email        = $Email
        Password     = $Password
        TenantCodigo = $TenantCodigo
        MinMenuItems = $MinMenuItems
    }
}

function Wait-AerosuiteApiReady {
    param(
        [string]$ApiBaseUrl = 'http://localhost:8080',
        [int]$MaxWaitSec = 120,
        [int]$PollSec = 3
    )
    $base = $ApiBaseUrl.TrimEnd('/')
    $deadline = (Get-Date).AddSeconds($MaxWaitSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $health = Invoke-RestMethod -Uri "$base/q/health" -TimeoutSec 8
            if ($health.status -eq 'UP') {
                $cfg = Get-AerosuiteTestConfig -ApiBaseUrl $base
                $login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $base -Body (New-AerosuiteLoginBody -Email $cfg.Email -Password $cfg.Password -TenantCodigo $cfg.TenantCodigo) -TimeoutSec 45
                if ($login.Ok -and $login.Body.token) { return $true }
            }
        } catch {
            # API ainda a subir (ex.: após Maven IT a stressar MySQL)
        }
        Start-Sleep -Seconds $PollSec
    }
    throw "API indisponível em $base após ${MaxWaitSec}s"
}

function New-AerosuiteLoginBody {
    param(
        [Parameter(Mandatory)][string]$Email,
        [Parameter(Mandatory)][string]$Password,
        [string]$TenantCodigo
    )
    $body = @{ email = $Email; password = $Password }
    if ($TenantCodigo -and $TenantCodigo.Trim()) {
        $body['tenantCodigo'] = $TenantCodigo.Trim()
    }
    return $body
}

function Invoke-AerosuiteApi {
    param(
        [Parameter(Mandatory)][string]$Method,
        [Parameter(Mandatory)][string]$Path,
        [string]$ApiBaseUrl,
        [string]$Token,
        [object]$Body,
        [int]$TimeoutSec = 45,
        [int]$MaxRetries = 3
    )
    $uri = if ($Path -match '^https?://') { $Path } else { "$($ApiBaseUrl.TrimEnd('/'))$Path" }
    $headers = @{}
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }
    $params = @{
        Uri         = $uri
        Method      = $Method
        TimeoutSec  = $TimeoutSec
        ErrorAction = 'Stop'
    }
    if ($headers.Count -gt 0) { $params['Headers'] = $headers }
    if ($null -ne $Body) {
        $params['ContentType'] = 'application/json; charset=utf-8'
        if ($Body -is [string]) { $params['Body'] = $Body }
        else { $params['Body'] = ($Body | ConvertTo-Json -Compress -Depth 8) }
    }

    $last = $null
    for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $response = Invoke-WebRequest @params -UseBasicParsing
            $sw.Stop()
            $parsed = $null
            if ($response.Content) {
                try { $parsed = $response.Content | ConvertFrom-Json } catch { $parsed = $response.Content }
            }
            return [pscustomobject]@{
                Ok           = $true
                StatusCode   = [int]$response.StatusCode
                Body         = $parsed
                Raw          = $response.Content
                Headers      = $response.Headers
                ElapsedMs    = $sw.ElapsedMilliseconds
                Error        = $null
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
                if ([string]::IsNullOrWhiteSpace($raw) -and $_.ErrorDetails.Message) {
                    $raw = $_.ErrorDetails.Message
                }
            }
            $parsedErr = $null
            if ($raw) {
                try { $parsedErr = $raw | ConvertFrom-Json } catch { $parsedErr = $raw }
            }
            $last = [pscustomobject]@{
                Ok           = $false
                StatusCode   = $status
                Body         = $parsedErr
                Raw          = $raw
                Headers      = $null
                ElapsedMs    = $sw.ElapsedMilliseconds
                Error        = $_.Exception.Message
            }
            # Só reintenta falhas de transporte (sem HTTP status)
            if ($null -ne $status -or $attempt -ge $MaxRetries) {
                return $last
            }
            Start-Sleep -Seconds (2 * $attempt)
        }
    }
    return $last
}

function Get-JwtPayload {
    param([Parameter(Mandatory)][string]$Token)
    $parts = $Token -split '\.'
    if ($parts.Count -lt 2) { throw 'JWT inválido' }
    $payload = $parts[1]
    $pad = 4 - ($payload.Length % 4)
    if ($pad -lt 4) { $payload += ('=' * $pad) }
    $bytes = [Convert]::FromBase64String($payload.Replace('-', '+').Replace('_', '/'))
    [Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json
}

function New-AerosuiteTestResult {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$Detail = '',
        [int]$ElapsedMs = 0
    )
    [pscustomobject]@{
        Name      = $Name
        Passed    = $Passed
        Detail    = $Detail
        ElapsedMs = $ElapsedMs
    }
}

function Write-AerosuiteTestSummary {
    param([array]$Results)
    $failed = @($Results | Where-Object { -not $_.Passed })
    $passed = @($Results | Where-Object { $_.Passed })
    Write-Host ''
    Write-Host "Resumo: $($passed.Count) OK, $($failed.Count) falha(s), $($Results.Count) total" -ForegroundColor $(if ($failed.Count -eq 0) { 'Green' } else { 'Red' })
    foreach ($r in $Results) {
        $color = if ($r.Passed) { 'Green' } else { 'Red' }
        $mark = if ($r.Passed) { '[OK]' } else { '[FAIL]' }
        $ms = if ($r.ElapsedMs -gt 0) { " ($($r.ElapsedMs) ms)" } else { '' }
        Write-Host "$mark $($r.Name)$ms" -ForegroundColor $color
        if (-not $r.Passed -and $r.Detail) {
            Write-Host "      $($r.Detail)" -ForegroundColor DarkRed
        }
    }
    return ($failed.Count -eq 0)
}
