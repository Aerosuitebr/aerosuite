# =============================================================================
#  Aero Suite - Envio do e-mail de equalizacao via Gmail SMTP
# =============================================================================
[CmdletBinding()]
param(
    [string]$GmailUser       = 'wellemlyra@gmail.com',
    [string]$GmailPass       = 'Gmailwell1970',
    [string]$CsvDiscrepancia = 'D:\aerosuite-fullstack-pro\docs\produtos-discrepancia-estoque.csv',
    [string]$CsvDuplicados   = 'D:\aerosuite-fullstack-pro\docs\produtos-duplicados-catalogo.csv',
    [string]$CorpoHtmlPath   = 'D:\aerosuite-fullstack-pro\docs\email-suprimento\CORPO_HTML.html',
    [string[]]$Destinatarios = @('erica@aerosuite.app','gabriel@aerosuite.app'),
    [string[]]$Copias        = @('wellemlyra@gmail.com')
)

$ErrorActionPreference = 'Stop'

foreach ($f in @($CsvDiscrepancia,$CsvDuplicados,$CorpoHtmlPath)) {
    if (-not (Test-Path -LiteralPath $f)) { throw "Arquivo nao encontrado: $f" }
}

$Assunto = "[Aero Suite] Equalizacao de Estoque (Catalogo x Modulo de Estoque) - Acao necessaria do Suprimento"
$Html    = Get-Content -LiteralPath $CorpoHtmlPath -Raw -Encoding UTF8

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$msg = New-Object System.Net.Mail.MailMessage
$msg.From = New-Object System.Net.Mail.MailAddress($GmailUser, 'Aero Suite Controls - Sistema Aero Suite')
foreach ($d in $Destinatarios) { $msg.To.Add($d) }
foreach ($c in $Copias)         { $msg.CC.Add($c) }
$msg.Subject         = $Assunto
$msg.SubjectEncoding = [System.Text.Encoding]::UTF8
$msg.IsBodyHtml      = $true
$msg.BodyEncoding    = [System.Text.Encoding]::UTF8
$msg.Body            = $Html

$att1 = New-Object System.Net.Mail.Attachment($CsvDiscrepancia)
$att1.ContentDisposition.FileName = 'produtos-discrepancia-estoque.csv'
$att1.ContentType = New-Object System.Net.Mime.ContentType('text/csv; charset=utf-8')
$msg.Attachments.Add($att1)

$att2 = New-Object System.Net.Mail.Attachment($CsvDuplicados)
$att2.ContentDisposition.FileName = 'produtos-duplicados-catalogo.csv'
$att2.ContentType = New-Object System.Net.Mime.ContentType('text/csv; charset=utf-8')
$msg.Attachments.Add($att2)

$smtp = New-Object System.Net.Mail.SmtpClient('smtp.gmail.com', 587)
$smtp.EnableSsl    = $true
$smtp.Credentials  = New-Object System.Net.NetworkCredential($GmailUser, $GmailPass)
$smtp.Timeout      = 60000

Write-Host "De:            $GmailUser (Gmail SMTP)"
Write-Host "Enviando para: $($Destinatarios -join ', ')"
Write-Host "Em copia:      $($Copias -join ', ')"

try {
    $smtp.Send($msg)
    Write-Host "OK - e-mail enviado com sucesso pelo Gmail." -ForegroundColor Green
} catch {
    Write-Host "ERRO ao enviar:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $inner = $_.Exception.InnerException
    while ($inner) {
        Write-Host "  -> $($inner.GetType().FullName): $($inner.Message)" -ForegroundColor Yellow
        if ($inner -is [System.Net.Mail.SmtpException]) {
            Write-Host "     StatusCode = $($inner.StatusCode)" -ForegroundColor Yellow
        }
        $inner = $inner.InnerException
    }
    throw
} finally {
    $msg.Dispose()
    $att1.Dispose()
    $att2.Dispose()
    $smtp.Dispose()
}
