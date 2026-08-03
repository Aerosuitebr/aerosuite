# Garante pelo menos uma OS aberta para E2E hangar offline (P5.2).
# Uso: .\scripts\test\provision-e2e-hangar-os.ps1

param(
    [string]$ApiBaseUrl,
    [string]$Email,
    [string]$Password,
    [string]$TenantCodigo
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here 'Test-ApiHelpers.ps1')

$cfg = Get-AerosuiteTestConfig @PSBoundParameters

Write-Host 'Aero Suite - provision OS aberta (E2E hangar)' -ForegroundColor Cyan

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body @{
    email = $cfg.Email; password = $cfg.Password; tenantCodigo = $cfg.TenantCodigo
}
if (-not ($login.Ok -and $login.Body.token)) {
    Write-Host 'Login falhou.' -ForegroundColor Red
    exit 1
}
$token = [string]$login.Body.token

$list = Invoke-AerosuiteApi -Method GET -Path '/api/os/job-card/abertas?limite=3' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
if ($list.Ok -and $list.Body.itens -and $list.Body.itens.Count -gt 0) {
    $n = $list.Body.itens[0].numeroOs
    Write-Host "OK: $($list.Body.itens.Count) OS aberta(s); primeira numeroOs=$n" -ForegroundColor Green
    exit 0
}

$page = Invoke-AerosuiteApi -Method GET -Path '/api/os?page=0&size=25' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
$items = @()
if ($page.Ok -and $page.Body.content) { $items = @($page.Body.content) }
elseif ($page.Ok -and $page.Body.items) { $items = @($page.Body.items) }

foreach ($os in $items) {
    if (-not $os.id) { continue }
    $open = ($null -eq $os.dataFechamento) -and ($os.isActive -ne $false)
    if ($open) {
        Write-Host "OK: OS id=$($os.id) idOs=$($os.idOs) ja aberta (revalidar filtros hangar)." -ForegroundColor Green
        exit 0
    }
    $patch = @{
        id          = $os.id
        idOs        = $os.idOs
        dtAbertura  = if ($os.dtAbertura) { $os.dtAbertura } else { (Get-Date).ToString('yyyy-MM-dd') }
        isActive    = $true
        dataFechamento = $null
        serialNumber   = if ($os.serialNumber) { $os.serialNumber } else { 'E2E-HANGAR' }
        partNumber     = if ($os.partNumber) { $os.partNumber } else { 'PN-E2E' }
        clienteNome    = if ($os.clienteNome) { $os.clienteNome } else { 'Homologacao E2E' }
    }
    if ($os.idFabricanteId) { $patch['idFabricanteId'] = $os.idFabricanteId }
    elseif ($os.idFabricante -and $os.idFabricante.id) { $patch['idFabricanteId'] = $os.idFabricante.id }

    $put = Invoke-AerosuiteApi -Method PUT -Path "/api/os/$($os.id)" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body $patch
    if ($put.Ok) {
        Start-Sleep -Seconds 1
        $recheck = Invoke-AerosuiteApi -Method GET -Path '/api/os/job-card/abertas?limite=1' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
        if ($recheck.Ok -and $recheck.Body.itens -and $recheck.Body.itens.Count -gt 0) {
            Write-Host "OK: OS id=$($os.id) reaberta para hangar E2E." -ForegroundColor Green
            exit 0
        }
    }
}

Write-Host 'AVISO: nenhuma OS aberta disponivel; E2E hangar offline pode skip.' -ForegroundColor Yellow
exit 0
