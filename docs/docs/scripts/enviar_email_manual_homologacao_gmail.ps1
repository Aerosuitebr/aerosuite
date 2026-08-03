# =============================================================================
#  Aero Suite - Manual de Homologacao via Gmail SMTP (mesmo canal dos e-mails operacionais)
#  Uso: powershell -ExecutionPolicy Bypass -File docs/scripts/enviar_email_manual_homologacao_gmail.ps1
# =============================================================================
[CmdletBinding()]
param(
    [string]$RepoRoot = '',
    [string]$GmailUser = 'wellemlyra@gmail.com',
    [string]$GmailPass = 'Gmailwell1970',
    [string]$Destinatario = 'rafaellanottesconsultoria@gmail.com',
    [string[]]$Copias = @('timmaia@bellowscontrols.com.br', 'wellemlyra@gmail.com')
)

$ErrorActionPreference = 'Stop'

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $RepoRoot -or $RepoRoot -eq '') {
    $RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..\..')).Path
}

$PreviewPath = Join-Path $RepoRoot 'docs\manual-homologacao\email-preview.html'
$HtmlTemplate = Join-Path $RepoRoot 'docs\manual-homologacao\email-homologacao.html'
$PdfManual = Join-Path $RepoRoot 'manuals\Manual_Aero_Suite_Homologacao.pdf'
$LogoPath = Join-Path $RepoRoot 'frontend\src\assets\LOGO_LETRA_LIGHT.png'

if (-not (Test-Path -LiteralPath $PdfManual)) {
    throw "PDF nao encontrado: $PdfManual"
}

# Garante preview com logo embutido (mesmo fluxo do Node)
if (-not (Test-Path -LiteralPath $PreviewPath) -or -not (Test-Path -LiteralPath $HtmlTemplate)) {
    throw 'Template/preview ausente. Execute: node scripts/send-homologacao-email.mjs --dry-run'
}

if (-not (Test-Path -LiteralPath $PreviewPath)) {
    $LogoB64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($LogoPath))
    $LogoUri = 'data:image/png;base64,' + $LogoB64
    $Html = [System.IO.File]::ReadAllText($HtmlTemplate, [System.Text.Encoding]::UTF8)
    $Html = $Html.Replace('{{LOGO_DATA_URI}}', $LogoUri)
    $Html = $Html.Replace('{{PDF_SIZE_MB}}', [string][math]::Round((Get-Item $PdfManual).Length / 1MB, 2))
    $Html = $Html.Replace('{{DATA_ENVIO}}', (Get-Date).ToString('dd/MM/yyyy'))
    $Html = $Html.Replace('{{COPYRIGHT_YEAR}}', [string](Get-Date).Year)
    [System.IO.File]::WriteAllText($PreviewPath, $Html, [System.Text.Encoding]::UTF8)
}

$Assunto = '[Aero Suite] Manual de Homologacao - Pacote oficial para validacao do sistema'
$HtmlBody = [System.IO.File]::ReadAllText($PreviewPath, [System.Text.Encoding]::UTF8)

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$msg = New-Object System.Net.Mail.MailMessage
$msg.From = New-Object System.Net.Mail.MailAddress($GmailUser, 'Equipe de Sistemas Aero Suite')
$msg.To.Add($Destinatario)
foreach ($c in $Copias) { $msg.CC.Add($c) }
$msg.Subject = $Assunto
$msg.SubjectEncoding = [System.Text.Encoding]::UTF8
$msg.IsBodyHtml = $true
$msg.BodyEncoding = [System.Text.Encoding]::UTF8
$msg.Body = $HtmlBody

$att = New-Object System.Net.Mail.Attachment($PdfManual)
$att.ContentDisposition.FileName = 'Manual_Aero_Suite_Homologacao.pdf'
$att.ContentType = New-Object System.Net.Mime.ContentType('application/pdf')
$msg.Attachments.Add($att)

$smtp = New-Object System.Net.Mail.SmtpClient('smtp.gmail.com', 587)
$smtp.EnableSsl = $true
$smtp.Credentials = New-Object System.Net.NetworkCredential($GmailUser, $GmailPass)
$smtp.Timeout = 120000

Write-Host "De:            $GmailUser (Gmail SMTP)"
Write-Host "Enviando para: $Destinatario"
Write-Host "Em copia:      $($Copias -join ', ')"
Write-Host "Anexo:         $PdfManual"

try {
    $smtp.Send($msg)
    Write-Host 'OK - e-mail enviado com sucesso pelo Gmail.' -ForegroundColor Green
} catch {
    Write-Host 'ERRO ao enviar:' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $inner = $_.Exception.InnerException
    while ($inner) {
        Write-Host "  -> $($inner.Message)" -ForegroundColor Yellow
        $inner = $inner.InnerException
    }
    throw
} finally {
    $msg.Dispose()
    $att.Dispose()
    $smtp.Dispose()
}
