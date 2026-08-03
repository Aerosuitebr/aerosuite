# Script PowerShell para verificar logs de email do backend

Write-Host "=== Verificando logs de email do backend ===" -ForegroundColor Cyan
Write-Host ""

# Verificar últimos 200 logs e filtrar por email/mail/sendgrid
$logs = docker logs aerosuite-backend --tail 200 2>&1
$emailLogs = $logs | Select-String -Pattern "email|mail|sendgrid|smtp" -CaseSensitive:$false

if ($emailLogs) {
    $emailLogs | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "Nenhum log de email encontrado nos últimos 200 registros" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Para ver todos os logs de email, execute: ===" -ForegroundColor Cyan
Write-Host "docker logs aerosuite-backend 2>&1 | Select-String -Pattern 'email|mail|sendgrid|smtp'" -ForegroundColor White
