# Smoke automatizado da API e frontend (requer API + web a correr).
# Uso:
#   .\scripts\test\api-smoke.ps1
#   $env:AEROSUITE_TEST_PASSWORD='...'; .\scripts\test\api-smoke.ps1
# Variáveis: AEROSUITE_API_URL, AEROSUITE_WEB_URL, AEROSUITE_TEST_EMAIL,
#            AEROSUITE_TEST_PASSWORD, AEROSUITE_TEST_TENANT, AEROSUITE_TEST_MIN_MENU

param(
    [string]$ApiBaseUrl,
    [string]$WebBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo,
    [int]$MinMenuItems,
    [switch]$SkipTenantChecks
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig @PSBoundParameters
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite - API smoke' -ForegroundColor Cyan
Write-Host ('API: {0}; Web: {1}; Tenant: {2}' -f $cfg.ApiBaseUrl, $cfg.WebBaseUrl, $cfg.TenantCodigo) -ForegroundColor DarkGray

# 1 - Frontend estatico
$r = Invoke-AerosuiteApi -Method GET -Path $cfg.WebBaseUrl -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'Web (SPA shell)' -Passed ($r.Ok -and $r.StatusCode -eq 200) -Detail $(if (-not $r.Ok) { $r.Error } else { "HTTP $($r.StatusCode)" }) -ElapsedMs $r.ElapsedMs))

# 2 — Endpoint protegido sem token (usuarios externos — RBAC)
$r = Invoke-AerosuiteApi -Method GET -Path '/api/usuarios-externos?page=0&size=1' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET /api/usuarios-externos sem JWT (401)' -Passed ($r.StatusCode -eq 401) -Detail "status=$($r.StatusCode)" -ElapsedMs $r.ElapsedMs))

# 2b — Endpoint protegido sem token (me)
$r = Invoke-AerosuiteApi -Method GET -Path '/api/auth/me' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET /api/auth/me sem JWT (401)' -Passed ($r.StatusCode -eq 401) -Detail "status=$($r.StatusCode)" -ElapsedMs $r.ElapsedMs))

# 3 — Login inválido
$badLogin = @{ email = $cfg.Email; password = '___invalid___'; tenantCodigo = $cfg.TenantCodigo }
$r = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body $badLogin
$results.Add((New-AerosuiteTestResult -Name 'POST /api/auth/login credenciais invalidas (401)' -Passed ($r.StatusCode -eq 401) -Detail "status=$($r.StatusCode)" -ElapsedMs $r.ElapsedMs))

# 4 — Login válido
$loginBody = @{ email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo }
$r = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body $loginBody
$token = $null
if ($r.Ok -and $r.Body.token) { $token = [string]$r.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'POST /api/auth/login (token)' -Passed ([bool]$token) -Detail $(if (-not $token) { "status=$($r.StatusCode) $($r.Raw)" } else { 'token obtido' }) -ElapsedMs $r.ElapsedMs))

if (-not $token) {
    Write-AerosuiteTestSummary -Results $results | Out-Null
    exit 1
}

# 5 — JWT contém tid
try {
    $jwt = Get-JwtPayload -Token $token
    $tid = $jwt.tid
    if (-not $tid) { $tid = $jwt.tenantId }
    $results.Add((New-AerosuiteTestResult -Name 'JWT contém tenant (tid)' -Passed ($null -ne $tid -and "$tid" -ne '') -Detail "tid=$tid"))
} catch {
    $results.Add((New-AerosuiteTestResult -Name 'JWT contém tenant (tid)' -Passed $false -Detail $_.Exception.Message))
}

# 6 — /api/auth/me
$r = Invoke-AerosuiteApi -Method GET -Path '/api/auth/me' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$emailOk = $r.Ok -and $r.Body -and ($r.Body.email -eq $cfg.Email -or $r.Body.login -eq $cfg.Email)
$results.Add((New-AerosuiteTestResult -Name 'GET /api/auth/me' -Passed $emailOk -Detail $(if ($r.Ok) { "email=$($r.Body.email)" } else { "status=$($r.StatusCode)" }) -ElapsedMs $r.ElapsedMs))

# 7 — meu-menu (regressão IO thread / menu lateral)
$r = Invoke-AerosuiteApi -Method GET -Path '/api/funcionalidades/meu-menu' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$menuCount = 0
if ($r.Ok -and $r.Body) {
    if ($r.Body -is [System.Array]) { $menuCount = $r.Body.Count }
    elseif ($r.Body.Count -ne $null) { $menuCount = [int]$r.Body.Count }
}
$results.Add((New-AerosuiteTestResult -Name "GET /api/funcionalidades/meu-menu (>= $($cfg.MinMenuItems) itens)" -Passed ($r.Ok -and $menuCount -ge $cfg.MinMenuItems) -Detail "itens=$menuCount status=$($r.StatusCode)" -ElapsedMs $r.ElapsedMs))

# 8 — CORS preflight login
try {
    $preflight = Invoke-WebRequest -Uri "$($cfg.ApiBaseUrl)/api/auth/login" -Method OPTIONS -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    $cors = $preflight.Headers['Access-Control-Allow-Origin']
    $results.Add((New-AerosuiteTestResult -Name 'OPTIONS /api/auth/login (CORS)' -Passed ($preflight.StatusCode -eq 200) -Detail "Allow-Origin=$cors" -ElapsedMs 0))
} catch {
    $results.Add((New-AerosuiteTestResult -Name 'OPTIONS /api/auth/login (CORS)' -Passed $false -Detail $_.Exception.Message))
}

# 9 — Público sistema-empresa
$r = Invoke-AerosuiteApi -Method GET -Path '/api/public/sistema-empresa/branding' -ApiBaseUrl $cfg.ApiBaseUrl
$publicOk = $r.Ok -and ($r.StatusCode -eq 200 -or $r.StatusCode -eq 204)
$results.Add((New-AerosuiteTestResult -Name 'GET /api/public/sistema-empresa/branding' -Passed $publicOk -Detail "status=$($r.StatusCode)" -ElapsedMs $r.ElapsedMs))

# 10 — Tenants (plataforma)
if (-not $SkipTenantChecks) {
    $r = Invoke-AerosuiteApi -Method GET -Path '/api/tenants' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $tenantCount = 0
    if ($r.Ok -and $r.Body) {
        if ($r.Body -is [System.Array]) { $tenantCount = $r.Body.Count }
        elseif ($r.Body.items) { $tenantCount = @($r.Body.items).Count }
        elseif ($r.Body.Count -ne $null) { $tenantCount = [int]$r.Body.Count }
    }
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/tenants (admin plataforma)' -Passed ($r.Ok -and $tenantCount -ge 1) -Detail "organizações=$tenantCount status=$($r.StatusCode)" -ElapsedMs $r.ElapsedMs))

    $r = Invoke-AerosuiteApi -Method GET -Path '/api/tenants/check-codigo?codigo=default' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $results.Add((New-AerosuiteTestResult -Name 'GET /api/tenants/check-codigo' -Passed $r.Ok -Detail "status=$($r.StatusCode)" -ElapsedMs $r.ElapsedMs))
}

# 11 — login-tenants
$r = Invoke-AerosuiteApi -Method GET -Path "/api/auth/login-tenants?email=$([uri]::EscapeDataString($cfg.Email))" -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET /api/auth/login-tenants' -Passed $r.Ok -Detail "status=$($r.StatusCode)" -ElapsedMs $r.ElapsedMs))

# 12 — Amostra de endpoints autenticados (sem alterar dados)
$sampleGets = @(
    '/api/os?page=0&size=1',
    '/api/funcionalidades/meu-menu'
)
foreach ($path in $sampleGets) {
    $r = Invoke-AerosuiteApi -Method GET -Path $path -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $ok = $r.Ok -and $r.StatusCode -ge 200 -and $r.StatusCode -lt 300
    $results.Add((New-AerosuiteTestResult -Name "GET $path" -Passed $ok -Detail "status=$($r.StatusCode)" -ElapsedMs $r.ElapsedMs))
}

$allOk = Write-AerosuiteTestSummary -Results $results
if (-not $allOk) { exit 1 }
exit 0
