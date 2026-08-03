# Gera payload JSON para deploy no WordPress (base64 dos assets)
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $PSScriptRoot 'deploy-payload.json'
$items = @(
  @{ key = 'css'; path = Join-Path $PSScriptRoot 'aerosuite-premium.css'; mime = 'text/css'; name = 'aerosuite-premium.css' },
  @{ key = 'js'; path = Join-Path $PSScriptRoot 'aerosuite-phone-mask.js'; mime = 'application/javascript'; name = 'aerosuite-phone-mask.js' },
  @{ key = 'showcase'; path = Join-Path $PSScriptRoot 'snippets\showcase-modules.html'; mime = 'text/html'; name = 'showcase.html' },
  @{ key = 'cta'; path = Join-Path $PSScriptRoot 'snippets\cta-band.html'; mime = 'text/html'; name = 'cta-band.html' },
  @{ key = 'logo'; path = Join-Path $root '..\frontend\src\assets\Pictureandletter.png'; mime = 'image/png'; name = 'aerosuite-pictureandletter.png' },
  @{ key = 'logoMark'; path = Join-Path $root '..\frontend\src\assets\LOGO_AERO.png'; mime = 'image/png'; name = 'aerosuite-logo-aero.png' },
  @{ key = 'bg'; path = Join-Path $root '..\frontend\src\assets\aero-suite-bg-deco.svg'; mime = 'image/svg+xml'; name = 'aerosuite-bg-deco.svg' }
)
$obj = @{}
foreach ($it in $items) {
  if (-not (Test-Path $it.path)) { Write-Warning "Missing: $($it.path)"; continue }
  $bytes = [IO.File]::ReadAllBytes($it.path)
  $obj[$it.key] = @{
    name = $it.name
    mime = $it.mime
    b64 = [Convert]::ToBase64String($bytes)
    size = $bytes.Length
  }
}
$obj | ConvertTo-Json -Depth 5 -Compress | Set-Content -Path $out -Encoding UTF8
Write-Host "Wrote $out ($((Get-Item $out).Length) bytes)"
