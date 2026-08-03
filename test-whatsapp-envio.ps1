# Script para testar envio de mensagem WhatsApp via Evolution API
$apiUrl = "http://localhost:8082"
$apiKey = "aerosuite-evolution-api-key-2024"
$instance = "default"
$phoneNumber = "5521990403514"  # 21 990403514 formatado com código do país
$message = "Teste de envio via Evolution API - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Write-Host "=== TESTE DE ENVIO VIA EVOLUTION API ===" -ForegroundColor Cyan
Write-Host "URL: $apiUrl" -ForegroundColor Yellow
Write-Host "Instance: $instance" -ForegroundColor Yellow
Write-Host "Telefone: $phoneNumber" -ForegroundColor Yellow
Write-Host "Mensagem: $message" -ForegroundColor Yellow
Write-Host ""

# Verificar se a API está acessível
Write-Host "1. Verificando se a API está acessível..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-WebRequest -Uri "$apiUrl" -Method GET -ErrorAction Stop
    Write-Host "   ✅ API está acessível (Status: $($healthCheck.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Endpoint raiz não disponível, mas continuando..." -ForegroundColor Yellow
}

# Verificar instâncias
Write-Host ""
Write-Host "2. Verificando instâncias disponíveis..." -ForegroundColor Cyan
try {
    $headers = @{
        "apikey" = $apiKey
    }
    $instances = Invoke-RestMethod -Uri "$apiUrl/instance/fetchInstances" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "   ✅ Instâncias encontradas:" -ForegroundColor Green
    $instances | ConvertTo-Json -Depth 3 | Write-Host
    
    # Se não houver instâncias, tentar criar
    if (-not $instances -or $instances.Count -eq 0) {
        Write-Host ""
        Write-Host "   ⚠️ Nenhuma instância encontrada. Tentando criar instância 'default'..." -ForegroundColor Yellow
        try {
            $createBody = @{
                instanceName = $instance
                token = $apiKey
            } | ConvertTo-Json
            
            $createResponse = Invoke-RestMethod -Uri "$apiUrl/instance/create" -Method POST -Headers $headers -Body $createBody -ContentType "application/json" -ErrorAction Stop
            Write-Host "   ✅ Instância criada com sucesso!" -ForegroundColor Green
            $createResponse | ConvertTo-Json -Depth 3 | Write-Host
        } catch {
            Write-Host "   ❌ Erro ao criar instância: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ⚠️ Erro ao buscar instâncias: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Tentando continuar mesmo assim..." -ForegroundColor Yellow
}

# Enviar mensagem de texto
Write-Host ""
Write-Host "3. Enviando mensagem de texto..." -ForegroundColor Cyan
try {
    $body = @{
        number = $phoneNumber
        text = $message
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "apikey" = $apiKey
    }

    $response = Invoke-RestMethod -Uri "$apiUrl/message/sendText/$instance" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "   ✅ Mensagem enviada com sucesso!" -ForegroundColor Green
    Write-Host "   Resposta:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "   ❌ Erro ao enviar mensagem: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Detalhes do erro: $responseBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "=== TESTE CONCLUÍDO ===" -ForegroundColor Cyan
