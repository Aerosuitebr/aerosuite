# Script de Reinicialização - Windows PowerShell
# Aero Suite Aeronáutica - Ambiente de Produção

Write-Host "Reiniciando sistema..." -ForegroundColor Yellow
& "$PSScriptRoot\stop.ps1"
Start-Sleep -Seconds 2
& "$PSScriptRoot\start.ps1"

