# Provisiona (ou reutiliza) o tenant "demo" via API e exporta credenciais para testes.
# Uso: .\scripts\test\provision-tenant-demo.ps1
# Saida: define $env:AEROSUITE_DEMO_EMAIL e $env:AEROSUITE_DEMO_PASSWORD na sessao atual.

param(
    [string]$DemoCodigo = 'demo',
    [string]$DemoAdminEmail = 'admin@demo.local',
    [string]$DemoAdminPassword = 'DemoAdmin123!',
    [switch]$ResetPasswordIfExists
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig
Write-Host 'Aero Suite - provision tenant demo' -ForegroundColor Cyan

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body (New-AerosuiteLoginBody -Email $cfg.Email -Password $cfg.Password -TenantCodigo $cfg.TenantCodigo)
if (-not $login.Ok -or -not $login.Body.token) {
    Write-Host "Login plataforma falhou: status=$($login.StatusCode) $($login.Raw)" -ForegroundColor Red
    exit 1
}
$token = [string]$login.Body.token

$check = Invoke-AerosuiteApi -Method GET -Path "/api/tenants/check-codigo?codigo=$DemoCodigo" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$available = $false
if ($check.Ok -and $check.Body) {
    $available = [bool]$check.Body.available
}

$password = $DemoAdminPassword

if ($available) {
    Write-Host "Codigo '$DemoCodigo' disponivel - a criar organizacao..." -ForegroundColor DarkGray
    $createBody = @{
        codigo           = $DemoCodigo
        nome             = 'Organizacao Demo'
        adminEmail       = $DemoAdminEmail
        adminNome        = 'Admin Demo'
        displayName      = 'Demo MRO'
        supportEmail     = 'suporte@demo.local'
        adminSenha       = $DemoAdminPassword
        sendWelcomeEmail = $false
    }
    $created = Invoke-AerosuiteApi -Method POST -Path '/api/tenants' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body $createBody
    if (-not $created.Ok) {
        Write-Host "POST /api/tenants falhou: status=$($created.StatusCode) $($created.Raw)" -ForegroundColor Red
        exit 1
    }
    if ($created.Body.adminSenhaTemporaria) {
        $password = [string]$created.Body.adminSenhaTemporaria
    }
    Write-Host "Tenant criado (id=$($created.Body.tenant.id))." -ForegroundColor Green
} else {
    Write-Host "Codigo '$DemoCodigo' ja existe." -ForegroundColor DarkYellow
    $probe = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
        email        = $DemoAdminEmail
        password     = $DemoAdminPassword
        tenantCodigo = $DemoCodigo
    }
    if ($probe.Ok -and $probe.Body.token) {
        Write-Host 'Login demo OK com senha configurada.' -ForegroundColor Green
        $password = $DemoAdminPassword
    } elseif ($ResetPasswordIfExists) {
        $list = Invoke-AerosuiteApi -Method GET -Path '/api/tenants' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
        $tenantId = $null
        if ($list.Ok -and $list.Body.items) {
            foreach ($t in $list.Body.items) {
                if ($t.codigo -eq $DemoCodigo) { $tenantId = $t.id; break }
            }
        }
        if (-not $tenantId) {
            Write-Host 'Tenant demo nao encontrado na listagem.' -ForegroundColor Red
            exit 1
        }
        $welcome = Invoke-AerosuiteApi -Method POST -Path "/api/tenants/$tenantId/welcome-email" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
            adminEmail           = $DemoAdminEmail
            resetAdminPassword   = $true
        }
        if ($welcome.Ok -and $welcome.Body.adminSenhaTemporaria) {
            $password = [string]$welcome.Body.adminSenhaTemporaria
            Write-Host "Senha temporaria gerada (mostrada uma vez)." -ForegroundColor Yellow
        } else {
            Write-Host "Reenvio welcome falhou: $($welcome.Raw)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host 'Use -ResetPasswordIfExists ou defina AEROSUITE_DEMO_PASSWORD com a senha correta.' -ForegroundColor Red
        exit 1
    }
}

$verify = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email        = $DemoAdminEmail
    password     = $password
    tenantCodigo = $DemoCodigo
}
if (-not $verify.Ok) {
    if ($verify.Body -and $verify.Body.code -eq 'MUST_CHANGE_PASSWORD') {
        Write-Host 'Admin demo deve trocar senha no primeiro login (esperado se senha temporaria).' -ForegroundColor Yellow
    } else {
        Write-Host "Verificacao login demo falhou: status=$($verify.StatusCode) $($verify.Raw)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host 'Verificacao login demo: OK' -ForegroundColor Green
}

$env:AEROSUITE_DEMO_EMAIL = $DemoAdminEmail
$env:AEROSUITE_DEMO_PASSWORD = $password
$env:AEROSUITE_DEMO_TENANT = $DemoCodigo

Write-Host ''
Write-Host 'Credenciais exportadas para a sessao:' -ForegroundColor Cyan
Write-Host "  AEROSUITE_DEMO_EMAIL=$DemoAdminEmail"
Write-Host "  AEROSUITE_DEMO_PASSWORD=$password"
Write-Host "  AEROSUITE_DEMO_TENANT=$DemoCodigo"
exit 0
