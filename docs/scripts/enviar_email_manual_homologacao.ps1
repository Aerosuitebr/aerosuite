# =============================================================================
#  Aero Suite - Envio do Manual de Homologacao (PDF anexo)
#  Uso: powershell -ExecutionPolicy Bypass -File docs/scripts/enviar_email_manual_homologacao.ps1
# =============================================================================
[CmdletBinding()]
param(
    [string]$RepoRoot = '',
    [string]$ApiKey = '',
    [switch]$DryRun,
    [string]$Destinatario = 'rafaellanottesconsultoria@gmail.com',
    [string[]]$Copias = @('timmaia@bellowscontrols.com.br', 'wellemlyra@gmail.com')
)

$ErrorActionPreference = 'Stop'

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot -or $RepoRoot -eq '') {
    $RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..\..')).Path
}

$EnvFile    = Join-Path $RepoRoot '.env'
$PdfManual  = Join-Path $RepoRoot 'manuals\Manual_Aero_Suite_Homologacao.pdf'
$LogoPath   = Join-Path $RepoRoot 'frontend\src\assets\LOGO_LETRA_LIGHT.png'
$HtmlTemplate = Join-Path $RepoRoot 'docs\manual-homologacao\email-homologacao.html'

function Read-EnvVar {
    param([string]$Path, [string]$Name)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    Get-Content -LiteralPath $Path | ForEach-Object {
        if ($_ -match "^\s*$([Regex]::Escape($Name))\s*=\s*(.+)\s*$") { return $Matches[1] }
    } | Select-Object -First 1
}

$From   = Read-EnvVar -Path $EnvFile -Name 'QUARKUS_MAILER_FROM'
if (-not $ApiKey) {
    $ApiKey = Read-EnvVar -Path $EnvFile -Name 'QUARKUS_MAILER_PASSWORD'
}
if (-not $ApiKey -and $env:QUARKUS_MAILER_PASSWORD) {
    $ApiKey = $env:QUARKUS_MAILER_PASSWORD
}

if (-not $From) { $From = 'noreply@mail.aerosuite.app' }
if (-not $ApiKey -or $ApiKey -match 'sua_api_key|placeholder|changeme') {
    if ($DryRun) {
        Write-Host 'DryRun: API Key ausente - preview gerado, envio omitido.' -ForegroundColor Yellow
        exit 0
    }
    throw "Configure QUARKUS_MAILER_PASSWORD (SendGrid API Key SG.*) em $EnvFile ou passe -ApiKey"
}
if ($ApiKey -notlike 'SG.*') {
    throw 'QUARKUS_MAILER_PASSWORD deve ser API Key SendGrid (prefixo SG.).'
}
if (-not (Test-Path -LiteralPath $PdfManual)) {
    throw "PDF nao encontrado: $PdfManual. Execute: node scripts/build-manual-pdf.mjs"
}
if (-not (Test-Path -LiteralPath $LogoPath)) {
    throw "Logo nao encontrado: $LogoPath"
}
if (-not (Test-Path -LiteralPath $HtmlTemplate)) {
    throw "Template HTML nao encontrado: $HtmlTemplate"
}

$LogoB64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($LogoPath))
$LogoDataUri = 'data:image/png;base64,' + $LogoB64
$DataEnvio = (Get-Date).ToString('dd/MM/yyyy')
$PdfSizeMb = [math]::Round((Get-Item -LiteralPath $PdfManual).Length / 1MB, 2)
$CopyrightYear = (Get-Date).Year

$Assunto = '[Aero Suite] Manual de Homologação — Pacote oficial para validação do sistema'

$Html = [System.IO.File]::ReadAllText($HtmlTemplate, [System.Text.Encoding]::UTF8)
$Html = $Html.Replace('{{LOGO_DATA_URI}}', $LogoDataUri)
$Html = $Html.Replace('{{PDF_SIZE_MB}}', [string]$PdfSizeMb)
$Html = $Html.Replace('{{DATA_ENVIO}}', $DataEnvio)
$Html = $Html.Replace('{{COPYRIGHT_YEAR}}', [string]$CopyrightYear)

$PreviewPath = Join-Path $RepoRoot 'docs\manual-homologacao\email-preview.html'
[System.IO.File]::WriteAllText($PreviewPath, $Html, [System.Text.Encoding]::UTF8)
Write-Host "Preview HTML: $PreviewPath"

function ConvertTo-Base64File {
    param([string]$Path)
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    return [Convert]::ToBase64String($bytes)
}

$tos = @(@{ email = $Destinatario })
$ccs = @($Copias | ForEach-Object { @{ email = $_ } })

$payload = @{
    personalizations = @(@{
            to      = $tos
            cc      = $ccs
            subject = $Assunto
        })
    from    = @{ email = $From; name = 'Equipe de Sistemas Aero Suite' }
    subject = $Assunto
    content = @(@{ type = 'text/html'; value = $Html })
    attachments = @(@{
            content     = (ConvertTo-Base64File -Path $PdfManual)
            type        = 'application/pdf'
            filename    = 'Manual_Aero_Suite_Homologacao.pdf'
            disposition = 'attachment'
        })
}

$jsonBody = $payload | ConvertTo-Json -Depth 8

Write-Host "Enviando para: $Destinatario"
Write-Host "Em copia:      $($Copias -join ', ')"
Write-Host "De:            $From"
Write-Host "Anexo:         $PdfManual ($PdfSizeMb MB)"
Write-Host 'Provedor:      SendGrid HTTP API'

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

try {
    $resp = Invoke-WebRequest -Method Post -Uri 'https://api.sendgrid.com/v3/mail/send' `
        -Headers @{ Authorization = "Bearer $ApiKey"; 'Content-Type' = 'application/json' } `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($jsonBody)) `
        -UseBasicParsing
    Write-Host ("OK - HTTP {0} - e-mail enviado com sucesso." -f $resp.StatusCode) -ForegroundColor Green
    if ($resp.Headers['X-Message-Id']) {
        Write-Host ("Message-Id: {0}" -f $resp.Headers['X-Message-Id'])
    }
} catch {
    Write-Host 'ERRO ao chamar SendGrid:' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            $body   = $reader.ReadToEnd()
            Write-Host 'Resposta da API:' -ForegroundColor Yellow
            Write-Host $body
        }
    }
    throw
}
