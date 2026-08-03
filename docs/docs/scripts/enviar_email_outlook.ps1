# Fallback: envio via Outlook instalado (conta padrao do Windows)
# Usado quando SendGrid nao esta configurado.
param(
    [Parameter(Mandatory = $true)][string]$To,
    [Parameter(Mandatory = $true)][string[]]$Cc,
    [Parameter(Mandatory = $true)][string]$Subject,
    [Parameter(Mandatory = $true)][string]$HtmlPath,
    [Parameter(Mandatory = $true)][string]$AttachmentPath
)

$outlook = New-Object -ComObject Outlook.Application
$mail = $outlook.CreateItem(0)
$mail.To = $To
$mail.CC = ($Cc -join ';')
$mail.Subject = $Subject
$mail.HTMLBody = [System.IO.File]::ReadAllText($HtmlPath, [System.Text.Encoding]::UTF8)
$mail.Attachments.Add($AttachmentPath) | Out-Null
$mail.Send()
Write-Host "Enviado via Outlook para $To" -ForegroundColor Green
