# Script para criar instancia na Evolution API via API direta
$apiKey = "aerosuite-evolution-api-key-2024"
$baseUrl = "http://localhost:8082"

Write-Host "=== CRIAR INSTANCIA EVOLUTION API ===" -ForegroundColor Cyan
Write-Host ""

# Tentar diferentes formatos de criacao
$formats = @(
    @{ 
        name = "Formato 1: instanceName + token"
        body = '{"instanceName": "default", "token": "' + $apiKey + '"}'
    },
    @{ 
        name = "Formato 2: name + token"
        body = '{"name": "default", "token": "' + $apiKey + '"}'
    },
    @{ 
        name = "Formato 3: instanceName apenas"
        body = '{"instanceName": "default"}'
    },
    @{ 
        name = "Formato 4: name apenas"
        body = '{"name": "default"}'
    },
    @{ 
        name = "Formato 5: instanceName + qrcode"
        body = '{"instanceName": "default", "qrcode": true}'
    }
)

$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $apiKey
}

$instanciaCriada = $false

foreach ($format in $formats) {
    Write-Host "Tentando: $($format.name)" -ForegroundColor Yellow
    Write-Host "Body: $($format.body)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/instance/create" -Method POST -Headers $headers -Body $format.body -UseBasicParsing
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            Write-Host "SUCESSO! Status: $($response.StatusCode)" -ForegroundColor Green
            $responseContent = $response.Content | ConvertFrom-Json
            $responseContent | ConvertTo-Json -Depth 5 | Write-Host
            $instanciaCriada = $true
            break
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "ERRO Status: $statusCode" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            if ($responseBody) {
                Write-Host "Resposta: $responseBody" -ForegroundColor Yellow
            }
        }
    }
    Write-Host ""
}

if (-not $instanciaCriada) {
    Write-Host "Nenhum formato funcionou. Verificando se a instancia ja existe..." -ForegroundColor Yellow
    Write-Host ""
    
    # Verificar instancias existentes
    try {
        $instances = Invoke-RestMethod -Uri "$baseUrl/instance/fetchInstances" -Method GET -Headers @{ "apikey" = $apiKey }
        if ($instances -and $instances.Count -gt 0) {
            Write-Host "Instancias encontradas:" -ForegroundColor Green
            $instances | ConvertTo-Json -Depth 3 | Write-Host
        } else {
            Write-Host "Nenhuma instancia encontrada" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Erro ao verificar instancias: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Verifique os logs: docker-compose logs evolution-api" -ForegroundColor White
    Write-Host "   2. Tente criar manualmente pela interface web" -ForegroundColor White
    Write-Host "   3. Verifique a documentacao: https://doc.evolution-api.com" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "=== OBTENDO QR CODE ===" -ForegroundColor Cyan
    Write-Host ""
    
    Start-Sleep -Seconds 2
    
    try {
        $qrResponse = Invoke-RestMethod -Uri "$baseUrl/instance/connect/default" -Method GET -Headers @{ "apikey" = $apiKey }
        
        if ($qrResponse.base64) {
            Write-Host "QR Code obtido!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Para ver o QR Code:" -ForegroundColor Cyan
            Write-Host "   1. Copie o base64 abaixo" -ForegroundColor White
            Write-Host "   2. Acesse: https://base64.guru/converter/decode/image" -ForegroundColor White
            Write-Host "   3. Cole o base64 e converta para imagem" -ForegroundColor White
            Write-Host "   4. Escaneie com seu WhatsApp" -ForegroundColor White
            Write-Host ""
            Write-Host "Base64 (primeiros 200 caracteres):" -ForegroundColor Yellow
            Write-Host $qrResponse.base64.Substring(0, [Math]::Min(200, $qrResponse.base64.Length)) -ForegroundColor Gray
            Write-Host "..."
            Write-Host ""
            Write-Host "Base64 completo salvo em: qrcode-base64.txt" -ForegroundColor Cyan
            $qrResponse.base64 | Out-File -FilePath "qrcode-base64.txt" -Encoding UTF8
        } else {
            Write-Host "QR Code nao disponivel ainda. Resposta:" -ForegroundColor Yellow
            $qrResponse | ConvertTo-Json -Depth 3 | Write-Host
        }
    } catch {
        Write-Host "Erro ao obter QR Code: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   A instancia pode precisar de alguns segundos para inicializar" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== CONCLUSAO ===" -ForegroundColor Cyan
if ($instanciaCriada) {
    Write-Host "SUCESSO: Instancia default criada!" -ForegroundColor Green
    Write-Host "   Apos escanear o QR code, voce pode testar o envio de mensagens" -ForegroundColor White
} else {
    Write-Host "ERRO: Nao foi possivel criar a instancia automaticamente" -ForegroundColor Red
    Write-Host "   Tente criar manualmente pela interface web ou verifique os logs" -ForegroundColor White
}
