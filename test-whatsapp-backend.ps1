# Script para testar envio de mensagem WhatsApp via backend
$backendUrl = "http://localhost:8080"
$phoneNumber = "5521990403514"  # 21 990403514 formatado com código do país
$message = "Teste de envio via Evolution API - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "=== TESTE DE ENVIO VIA BACKEND ===" -ForegroundColor Cyan
Write-Host "URL: $backendUrl" -ForegroundColor Yellow
Write-Host "Telefone: $phoneNumber" -ForegroundColor Yellow
Write-Host "Mensagem: $message" -ForegroundColor Yellow
Write-Host ""

# Enviar mensagem de texto
Write-Host "Enviando mensagem de texto via backend..." -ForegroundColor Cyan
try {
    $encodedMessage = [System.Uri]::EscapeDataString($message)
    $url = "$backendUrl/api/test/whatsapp/send-text?phone=$phoneNumber&message=$encodedMessage"
    
    $response = Invoke-RestMethod -Uri $url -Method POST -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✅ Mensagem enviada com sucesso!" -ForegroundColor Green
    Write-Host "Resposta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host "❌ Erro ao enviar mensagem: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $responseBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "=== TESTE CONCLUÍDO ===" -ForegroundColor Cyan
