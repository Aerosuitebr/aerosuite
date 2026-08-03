# Smoke P2: endpoint Prometheus da API.
param(
    [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$uri = "$BaseUrl/q/metrics"
Write-Host "GET $uri"

try {
    $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 15
} catch {
    Write-Error "Falha ao obter métricas. API a correr em $BaseUrl ? ($_)"
    exit 1
}

if ($r.StatusCode -ne 200) {
    Write-Error "Status inesperado: $($r.StatusCode)"
    exit 1
}

$body = $r.Content
if ($body -notmatch "jvm_" -and $body -notmatch "http_server") {
    Write-Warning "Resposta 200 mas sem métricas JVM/HTTP esperadas — verificar Micrometer."
}

Write-Host "OK — métricas Prometheus acessíveis ($($body.Length) bytes)."
exit 0
