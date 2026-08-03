# P1/P4 — smoke API enforcement SGQ: flags tenant + bloqueio operacional (hangar).
# Uso: .\scripts\test\api-conformidade-enforcement-smoke.ps1

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
$results = [System.Collections.Generic.List[object]]::new()

Write-Host 'Aero Suite — smoke conformidade enforcement (P1/P4)' -ForegroundColor Cyan

function Get-ApiErrorText {
    param($Response)
    if (-not $Response) { return '' }
    if ($Response.Body) {
        if ($Response.Body.message) { return [string]$Response.Body.message }
        if ($Response.Body.error) { return [string]$Response.Body.error }
    }
    return [string]$Response.Raw
}

function Invoke-EnforcementApontamento {
    param(
        [string]$Token,
        [long]$OsId,
        [string]$ToolTag = '',
        [string]$Descricao = 'Smoke enforcement'
    )
    $body = @{
        trabalhoEm = (Get-Date).ToString('yyyy-MM-dd')
        horas      = 0.25
        descricao  = $Descricao
    }
    if ($ToolTag) { $body['ferramentaIdentificador'] = $ToolTag }
    return Invoke-AerosuiteApi -Method POST -Path "/api/os/job-card/$OsId/apontamentos" -ApiBaseUrl $cfg.ApiBaseUrl -Token $Token -Body $body
}

function Restore-EnforcementDefaults {
    param([string]$Token)
    $off = @{
        bloquearCalibracaoVencida     = $false
        bloquearTreinoObrigatorio     = $false
        bloquearSubcontratacaoVencida = $false
    }
    Invoke-AerosuiteApi -Method PUT -Path '/api/conformidade/enforcement' -ApiBaseUrl $cfg.ApiBaseUrl -Token $Token -Body $off | Out-Null
}

$rAnon = Invoke-AerosuiteApi -Method GET -Path '/api/conformidade/enforcement' -ApiBaseUrl $cfg.ApiBaseUrl
$results.Add((New-AerosuiteTestResult -Name 'GET enforcement sem JWT (401/403)' -Passed ($rAnon.StatusCode -in 400, 401, 403) -Detail "status=$($rAnon.StatusCode)"))

$login = Invoke-AerosuiteApi -Method POST -Path '/api/auth/login' -ApiBaseUrl $cfg.ApiBaseUrl -Body (New-AerosuiteLoginBody -Email $cfg.Email -Password $cfg.Password -TenantCodigo $cfg.TenantCodigo)
$token = $null
if ($login.Ok -and $login.Body.token) { $token = [string]$login.Body.token }
$results.Add((New-AerosuiteTestResult -Name 'Login plataforma' -Passed ([bool]$token)))

if (-not $token) {
    Write-AerosuiteTestSummary -Results $results | Out-Null
    exit 1
}

try {
    $get = Invoke-AerosuiteApi -Method GET -Path '/api/conformidade/enforcement' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $getOk = $get.Ok -and $null -ne $get.Body
    $defaultsOk = $false
    if ($getOk) {
        $defaultsOk = ($get.Body.bloquearCalibracaoVencida -eq $false) -and
            ($get.Body.bloquearTreinoObrigatorio -eq $false) -and
            ($get.Body.bloquearSubcontratacaoVencida -eq $false)
    }
    $results.Add((New-AerosuiteTestResult -Name 'GET enforcement — defaults desligados' -Passed ($getOk -and $defaultsOk) -Detail $(if ($getOk) { "calib=$($get.Body.bloquearCalibracaoVencida)" } else { "status=$($get.StatusCode)" })))

    $putBody = @{
        bloquearCalibracaoVencida     = $true
        bloquearTreinoObrigatorio     = $false
        bloquearSubcontratacaoVencida = $true
    }
    $put = Invoke-AerosuiteApi -Method PUT -Path '/api/conformidade/enforcement' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body $putBody
    $putOk = $put.Ok -and $put.Body -and ($put.Body.bloquearCalibracaoVencida -eq $true) -and ($put.Body.bloquearSubcontratacaoVencida -eq $true)
    $results.Add((New-AerosuiteTestResult -Name 'PUT enforcement — persiste flags' -Passed $putOk -Detail $(if ($putOk) { 'calib+sub ON' } else { "status=$($put.StatusCode)" })))

    # --- Bloqueio E2E: ferramenta vencida + flag ON → apontamento hangar recusado ---
    $toolId = $null
    $toolTag = "SMOKE-ENF-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $yesterday = (Get-Date).AddDays(-1).ToString('yyyy-MM-dd')
    $createTool = Invoke-AerosuiteApi -Method POST -Path '/api/conformidade/calibracao' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
        identificador           = $toolTag
        descricao               = 'Ferramenta smoke enforcement P1'
        dataProximaCalibracao   = $yesterday
        ativo                   = $true
    }
    if ($createTool.Ok -and $createTool.Body.id) { $toolId = [long]$createTool.Body.id }

    $list = Invoke-AerosuiteApi -Method GET -Path '/api/os/job-card/abertas?limite=5' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $osId = $null
    if ($list.Ok -and $list.Body.itens -and $list.Body.itens.Count -gt 0) {
        $osId = [long]$list.Body.itens[0].osId
    }

    if ($toolId -and $osId) {
        Invoke-AerosuiteApi -Method PUT -Path '/api/conformidade/enforcement' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
            bloquearCalibracaoVencida     = $true
            bloquearTreinoObrigatorio     = $false
            bloquearSubcontratacaoVencida = $false
        } | Out-Null

        $block = Invoke-EnforcementApontamento -Token $token -OsId $osId -ToolTag $toolTag -Descricao 'Smoke enforcement calibracao vencida'
        $msg = Get-ApiErrorText $block
        if ($block.Ok -and $block.Body.message) { $msg = [string]$block.Body.message }
        $blocked = ($block.StatusCode -eq 400) -and ($msg -match 'calibracao')
        $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — bloqueia calibracao vencida (flag ON)' -Passed $blocked -Detail "status=$($block.StatusCode) tool=$toolTag osId=$osId"))

        Invoke-AerosuiteApi -Method PUT -Path '/api/conformidade/enforcement' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
            bloquearCalibracaoVencida = $false
        } | Out-Null

        $allow = Invoke-EnforcementApontamento -Token $token -OsId $osId -ToolTag $toolTag -Descricao 'Smoke enforcement calibracao flag OFF'
        $allowOk = $allow.Ok -and $allow.Body -and $allow.Body.id
        $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — permitido com flag OFF' -Passed $allowOk -Detail $(if ($allowOk) { "id=$($allow.Body.id)" } else { "status=$($allow.StatusCode)" })))
    } else {
        $detail = @()
        if (-not $toolId) { $detail += 'criar ferramenta calibracao falhou' }
        if (-not $osId) { $detail += 'sem OS aberta' }
        $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — bloqueia calibracao vencida (flag ON)' -Passed $false -Detail ($detail -join '; ')))
        $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — permitido com flag OFF' -Passed $false -Detail 'pre-requisito ausente'))
    }

    if ($toolId) {
        Invoke-AerosuiteApi -Method DELETE -Path "/api/conformidade/calibracao/$toolId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token | Out-Null
    }

    # --- Bloqueio subcontratação vencida na OS ---
    $numeroOs = $null
    if ($list.Ok -and $list.Body.itens -and $list.Body.itens.Count -gt 0) {
        $numeroOs = [int]$list.Body.itens[0].numeroOs
    }
    $subId = $null
    if ($osId -and $numeroOs) {
        Invoke-AerosuiteApi -Method PUT -Path '/api/conformidade/enforcement' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
            bloquearCalibracaoVencida     = $false
            bloquearTreinoObrigatorio     = $false
            bloquearSubcontratacaoVencida = $true
        } | Out-Null

        $yesterday = (Get-Date).AddDays(-1).ToString('yyyy-MM-dd')
        $createSub = Invoke-AerosuiteApi -Method POST -Path '/api/conformidade/subcontratacao' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
            razaoSocial           = 'Sub smoke enforcement P1'
            certificadoPart145    = 'BR.145.SMOKE'
            validadeCertificado = $yesterday
            osId                  = $numeroOs
            status                = 'ATIVO'
        }
        if ($createSub.Ok -and $createSub.Body.id) { $subId = [long]$createSub.Body.id }

        if ($subId) {
            $blockSub = Invoke-EnforcementApontamento -Token $token -OsId $osId -Descricao 'Smoke enforcement subcontratacao vencida'
            $msgSub = Get-ApiErrorText $blockSub
            $blockedSub = ($blockSub.StatusCode -eq 400) -and ($msgSub -match 'subcontratacao')
            $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — bloqueia subcontratacao vencida (flag ON)' -Passed $blockedSub -Detail "status=$($blockSub.StatusCode) osNum=$numeroOs"))
        } else {
            $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — bloqueia subcontratacao vencida (flag ON)' -Passed $false -Detail 'criar subcontratacao falhou'))
        }
    } else {
        $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — bloqueia subcontratacao vencida (flag ON)' -Passed $false -Detail 'sem OS aberta'))
    }

    if ($subId) {
        Invoke-AerosuiteApi -Method DELETE -Path "/api/conformidade/subcontratacao/$subId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token | Out-Null
    }

    # --- Bloqueio treino obrigatório ---
    $treinoReqId = $null
    $me = Invoke-AerosuiteApi -Method GET -Path '/api/auth/me' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token
    $perfilCodigo = $null
    if ($me.Ok -and $me.Body.perfil -and $me.Body.perfil.codigo) {
        $perfilCodigo = [string]$me.Body.perfil.codigo
    }
    if ($osId -and $perfilCodigo) {
        $cursoSmoke = "Curso smoke enforcement $(Get-Date -Format 'HHmmss')"
        Invoke-AerosuiteApi -Method PUT -Path '/api/conformidade/enforcement' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
            bloquearCalibracaoVencida     = $false
            bloquearTreinoObrigatorio     = $true
            bloquearSubcontratacaoVencida = $false
        } | Out-Null

        $createReq = Invoke-AerosuiteApi -Method POST -Path '/api/conformidade/treinamentos-obrigatorios' -ApiBaseUrl $cfg.ApiBaseUrl -Token $token -Body @{
            funcaoCodigo   = $perfilCodigo
            curso          = $cursoSmoke
            validadeMeses  = 24
            ativo          = $true
        }
        if ($createReq.Ok -and $createReq.Body.id) { $treinoReqId = [long]$createReq.Body.id }

        if ($treinoReqId) {
            $blockTreino = Invoke-EnforcementApontamento -Token $token -OsId $osId -Descricao 'Smoke enforcement treino obrigatorio'
            $msgTreino = Get-ApiErrorText $blockTreino
            $blockedTreino = ($blockTreino.StatusCode -eq 400) -and ($msgTreino -match 'treino')
            $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — bloqueia treino obrigatorio (flag ON)' -Passed $blockedTreino -Detail "status=$($blockTreino.StatusCode) perfil=$perfilCodigo"))
        } else {
            $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — bloqueia treino obrigatorio (flag ON)' -Passed $false -Detail 'criar treino obrigatorio falhou'))
        }
    } else {
        $detailTreino = @()
        if (-not $osId) { $detailTreino += 'sem OS aberta' }
        if (-not $perfilCodigo) { $detailTreino += 'perfil codigo ausente em /auth/me' }
        $results.Add((New-AerosuiteTestResult -Name 'POST apontamento — bloqueia treino obrigatorio (flag ON)' -Passed $false -Detail ($detailTreino -join '; ')))
    }

    if ($treinoReqId) {
        Invoke-AerosuiteApi -Method DELETE -Path "/api/conformidade/treinamentos-obrigatorios/$treinoReqId" -ApiBaseUrl $cfg.ApiBaseUrl -Token $token | Out-Null
    }
} finally {
    if ($token) { Restore-EnforcementDefaults -Token $token }
}

Write-AerosuiteTestSummary -Results $results | Out-Null
if ($results | Where-Object { -not $_.Passed }) { exit 1 }
