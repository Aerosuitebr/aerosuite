# Valida POST /api/tenants (provisao) e login no tenant criado.
# Uso: .\scripts\test\verify-tenant-provision.ps1
#      .\scripts\test\verify-tenant-provision.ps1 -IncludeMultiTenant

param(
    [switch]$IncludeMultiTenant
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $here 'provision-tenant-demo.ps1') -ResetPasswordIfExists
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:AEROSUITE_DEMO_EMAIL = if ($env:AEROSUITE_DEMO_EMAIL) { $env:AEROSUITE_DEMO_EMAIL } else { 'admin@demo.local' }
$env:AEROSUITE_DEMO_PASSWORD = if ($env:AEROSUITE_DEMO_PASSWORD) { $env:AEROSUITE_DEMO_PASSWORD } else { 'DemoAdmin123!' }

if ($IncludeMultiTenant -or $env:AEROSUITE_TEST_MULTI_TENANT_EMAIL) {
    if (-not $env:AEROSUITE_TEST_MULTI_TENANT_EMAIL) {
        & (Join-Path $here 'provision-multi-tenant-login-test.ps1')
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
}

& (Join-Path $here 'api-tenant-isolation.ps1')
exit $LASTEXITCODE
