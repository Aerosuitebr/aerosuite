# Aguarda API responder em POST /api/auth/login.
param(
    [string]$ApiBaseUrl = 'http://localhost:8080',
    [string]$Email = 'admin@aerosuite.com',
    [string]$Password = 'admin123',
    [string]$TenantCodigo = 'default',
    [int]$MaxAttempts = 40,
    [int]$SleepSec = 3
)

$body = @{ email = $Email; password = $Password; tenantCodigo = $TenantCodigo } | ConvertTo-Json
for ($i = 0; $i -lt $MaxAttempts; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "$ApiBaseUrl/api/auth/login" -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 8
        if ($r.token) {
            Write-Host "API pronta (tentativa $($i + 1))." -ForegroundColor Green
            exit 0
        }
    } catch {}
    Start-Sleep -Seconds $SleepSec
}
Write-Host 'API nao respondeu a tempo.' -ForegroundColor Red
exit 1
