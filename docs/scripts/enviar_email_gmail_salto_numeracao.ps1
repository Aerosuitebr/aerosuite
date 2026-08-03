# =============================================================================
#  Aero Suite - Envio do esclarecimento sobre o salto na numeração de OS
# =============================================================================
[CmdletBinding()]
param(
    [string]$GmailUser     = 'wellemlyra@gmail.com',
    [string]$GmailPass     = 'qqsjorxtowaguqpx',
    [string]$CorpoHtmlPath = 'D:\aerosuite-fullstack-pro\docs\email-suprimento\CORPO_HTML_SALTO_NUMERACAO.html',
    # Suprimento (que levantou a questão) vai no TO
    [string[]]$Destinatarios = @(
        'erica@aerosuite.app',
        'gabriel@aerosuite.app'
    ),
    # Diretor + Admin em CC
    [string[]]$Copias = @(
        'timmaia@aerosuite.app',
        'carloscano@aerosuite.app',
        'elciopecanha@aerosuite.app',
        'elciopecanha@aerosuitecontrols.com',
        'thaiana@aerosuite.app',
        'danielfelipe.l.lyra@gmail.com',
        'admin@aerosuite.com',
        'thiagolyra18@gmail.com',
        'athenagata16@gmail.com'
    )
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $CorpoHtmlPath)) { throw "Arquivo de corpo nao encontrado: $CorpoHtmlPath" }

$Assunto = "[Aero Suite - TI] Esclarecimento sobre o salto na numeração de OS (2347 → 2363)"
$Html    = Get-Content -LiteralPath $CorpoHtmlPath -Raw -Encoding UTF8

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

$msg = New-Object System.Net.Mail.MailMessage
$msg.From = New-Object System.Net.Mail.MailAddress($GmailUser, 'Aero Suite Controls - TI')
foreach ($d in $Destinatarios) { $msg.To.Add($d) }
foreach ($c in $Copias)         { $msg.CC.Add($c) }
$msg.Subject         = $Assunto
$msg.SubjectEncoding = [System.Text.Encoding]::UTF8
$msg.IsBodyHtml      = $true
$msg.BodyEncoding    = [System.Text.Encoding]::UTF8
$msg.Body            = $Html

$smtp = New-Object System.Net.Mail.SmtpClient('smtp.gmail.com', 587)
$smtp.EnableSsl   = $true
$smtp.Credentials = New-Object System.Net.NetworkCredential($GmailUser, $GmailPass)
$smtp.Timeout     = 60000

Write-Host "De:    $GmailUser (Gmail SMTP)"
Write-Host "Para:  $($Destinatarios -join ', ')"
Write-Host "Cc:    $($Copias -join ', ')"
Write-Host "Total destinatarios: $(($Destinatarios + $Copias).Count)"

try {
    $smtp.Send($msg)
    Write-Host "OK - e-mail de esclarecimento enviado com sucesso." -ForegroundColor Green
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
    $smtp.Dispose()
}
