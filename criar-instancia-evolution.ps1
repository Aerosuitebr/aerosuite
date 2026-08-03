# Script para criar instância na Evolution API
$apiKey = "aerosuite-evolution-api-key-2024"
$url = "http://localhost:8082/instance/create"

Write-Host "=== CRIAR INSTÂNCIA EVOLUTION API ===" -ForegroundColor Cyan
Write-Host ""

# Tentar diferentes formatos
$formats = @(
    @{ body = '{"instanceName": "default"}' },
    @{ body = '{"name": "default"}' },
    @{ body = '{"instance": "default"}' }
)

$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $apiKey
}

foreach ($format in $formats) {
    Write-Host "Tentando formato: $($format.body)" -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body $format.body -UseBasicParsing
        Write-Host "✅ SUCESSO! Status: $($response.StatusCode)" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
        break
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ Status: $statusCode" -ForegroundColor Red
        if ($statusCode -ne 400) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Resposta: $responseBody" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

Write-Host ""
Write-Host "💡 Se nenhum formato funcionou, verifique:" -ForegroundColor Cyan
Write-Host "   1. Documentação: https://doc.evolution-api.com" -ForegroundColor White
Write-Host "   2. Logs: docker-compose logs evolution-api" -ForegroundColor White
Write-Host "   3. Versão da API pode ter mudado o formato" -ForegroundColor White
