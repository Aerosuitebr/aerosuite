# Publica Post #6 (conformidade) — abre pasta de mídia e copia texto para área de transferência.
# Uso: powershell -ExecutionPolicy Bypass -File docs/wordpress/publish-linkedin-conformidade.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$media = Join-Path $root 'docs\wordpress\static'
$desktop = Join-Path $env:USERPROFILE 'Desktop\aerosuite-linkedin-media'
$postSource = Join-Path $PSScriptRoot 'linkedin-post-conformidade.txt'
$commentSource = Join-Path $PSScriptRoot 'linkedin-comment-conformidade.txt'

if (-not (Test-Path $postSource)) { throw "Arquivo ausente: $postSource" }
if (-not (Test-Path $commentSource)) { throw "Arquivo ausente: $commentSource" }

$utf8 = New-Object System.Text.UTF8Encoding $false
$postText = [System.IO.File]::ReadAllText($postSource, $utf8).TrimEnd()
$commentText = [System.IO.File]::ReadAllText($commentSource, $utf8).TrimEnd()

function Set-ClipboardUnicode {
    param([string]$Text)
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.Clipboard]::SetText($Text, [System.Windows.Forms.TextDataFormat]::UnicodeText)
}

Set-ClipboardUnicode $postText
Write-Host 'Texto do post copiado para a area de transferencia.' -ForegroundColor Green

$slides = 1..4 | ForEach-Object {
    Join-Path $media "aerosuite-linkedin-carousel-conformidade-$_-1080.png"
}
foreach ($s in $slides) {
    if (-not (Test-Path $s)) { throw "Arquivo ausente: $s" }
}

if (-not (Test-Path $desktop)) { New-Item -ItemType Directory -Force -Path $desktop | Out-Null }

$utf8Bom = New-Object System.Text.UTF8Encoding $true
$textFile = Join-Path $desktop 'TEXTO-POST.txt'
$commentFile = Join-Path $desktop 'COMENTARIO-UTM.txt'
[System.IO.File]::WriteAllText($textFile, $postText, $utf8Bom)
[System.IO.File]::WriteAllText($commentFile, $commentText, $utf8Bom)

if (Test-Path $desktop) {
    explorer.exe $desktop
} else {
    explorer.exe '/select,' + $slides[0]
}

Start-Process 'https://www.linkedin.com/company/126884245/admin/page-posts/published/?share=true'

Write-Host ''
Write-Host '=== ROTEIRO RAPIDO ===' -ForegroundColor Cyan
Write-Host '1. Criar publicacao na Page aero-suite-mro'
Write-Host '2. Adicionar imagem -> selecionar os 4 PNG conformidade-1 a 4 (ordem)'
Write-Host '3. Colar texto (ja na area de transferencia) Ctrl+V'
Write-Host '4. Publicar'
Write-Host '5. Comentar e fixar:' -ForegroundColor Yellow
Write-Host $commentText
Write-Host ''
Write-Host 'Slides (ordem do carrossel):' -ForegroundColor DarkCyan
$slides | ForEach-Object { Write-Host "  $_" }
Write-Host ''
Write-Host 'Texto tambem em:' -ForegroundColor Yellow
Write-Host "  $textFile"
