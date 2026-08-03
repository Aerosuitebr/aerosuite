# Instala Aero Suite Print Bridge (atalho na inicializacao do Windows)
$ErrorActionPreference = 'Stop'

$SourceScript = $PSScriptRoot
$BridgeScript = Join-Path $SourceScript 'aero-print-bridge.ps1'
if (-not (Test-Path $BridgeScript)) {
  throw "Arquivo nao encontrado: $BridgeScript"
}

$InstallDir = Join-Path $env:LOCALAPPDATA 'AeroSuite\PrintBridge'
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Copy-Item -Path $BridgeScript -Destination (Join-Path $InstallDir 'aero-print-bridge.ps1') -Force

$printerDefault = 'ELGIN L42PRO FULL'
$existing = Get-Printer -ErrorAction SilentlyContinue | Where-Object { $_.Name -like '*L42*' -or $_.Name -like '*ELGIN*' } | Select-Object -First 1
if ($existing) { $printerDefault = $existing.Name }

$config = @{
  port        = 19428
  printerName = $printerDefault
}
$config | ConvertTo-Json | Set-Content -Path (Join-Path $InstallDir 'config.json') -Encoding UTF8

$launcher = Join-Path $InstallDir 'start-bridge.vbs'
$psPath = (Get-Command powershell.exe).Source
$vbs = @"
Set shell = CreateObject("WScript.Shell")
shell.Environment("PROCESS")("AERO_PRINT_BRIDGE_DIR") = "$($InstallDir.Replace('\', '\\'))"
shell.Run """$psPath"" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$($InstallDir)\aero-print-bridge.ps1""", 0, False
"@
Set-Content -Path $launcher -Value $vbs -Encoding ASCII

$startup = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startup 'Aero Suite Print Bridge.lnk'
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath = 'wscript.exe'
$sc.Arguments = "`"$launcher`""
$sc.WorkingDirectory = $InstallDir
$sc.Description = 'Aero Suite — impressao termica PPLB'
$sc.Save()

# Inicia agora
Start-Process -FilePath 'wscript.exe' -ArgumentList "`"$launcher`"" -WindowStyle Hidden

Write-Host ""
Write-Host "Aero Suite Print Bridge instalado." -ForegroundColor Green
Write-Host "  Pasta: $InstallDir"
Write-Host "  Impressora padrao: $printerDefault"
Write-Host "  URL: http://127.0.0.1:19428/health"
Write-Host ""
Write-Host "Reinicie o navegador e imprima uma etiqueta no Aero Suite."
