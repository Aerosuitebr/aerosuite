# Helpers para scripts de deploy (Docker Compose + PowerShell no Windows).
# Docker escreve progresso em stderr; scripts usam $ErrorActionPreference = 'Continue'.

$AeroComposeRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Invoke-AeroDockerComposeRaw {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$ComposeArgs
    )

    $prevNative = $null
    if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue) {
        $prevNative = $PSNativeCommandUseErrorActionPreference
        $PSNativeCommandUseErrorActionPreference = $false
    }

    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'

    $exitCode = 1
    Push-Location $AeroComposeRoot
    try {
        & docker compose @ComposeArgs 2>&1 | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) {
                Write-Host $_.ToString()
            } else {
                Write-Host $_
            }
        }
        $exitCode = $LASTEXITCODE
    } finally {
        Pop-Location
        $ErrorActionPreference = $prevEap
        if ($null -ne $prevNative) {
            $PSNativeCommandUseErrorActionPreference = $prevNative
        }
    }

    return $exitCode
}

function Invoke-AeroDockerComposeSilent {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$ComposeArgs
    )

    $dockerArgs = @('compose') + @($ComposeArgs)
    $escaped = ($dockerArgs | ForEach-Object {
        if ($_ -match '[\s"]') { '"' + ($_ -replace '"', '\"') + '"' } else { $_ }
    }) -join ' '

    $command = "cd /d `"$AeroComposeRoot`" && docker $escaped >nul 2>&1"
    if ($env:AEROSUITE_DEPLOY_DEBUG -eq '1') {
        Write-Host "DEBUG: $command" -ForegroundColor DarkYellow
    }
    $proc = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', $command) -Wait -PassThru -NoNewWindow
    return $proc.ExitCode
}

function Invoke-AeroDockerComposeUp {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Service,
        [string]$Profile
    )

    if ($Profile) {
        return (Invoke-AeroDockerComposeSilent -ComposeArgs @('--profile', $Profile, 'up', '-d', '--no-attach', '--no-deps', $Service))
    }
    return (Invoke-AeroDockerComposeSilent -ComposeArgs @('up', '-d', '--no-attach', '--no-deps', $Service))
}

function Assert-DockerRunning {
    & docker info 1>$null 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'ERRO: Docker nao esta disponivel. Abra o Docker Desktop e tente novamente.' -ForegroundColor Red
        exit 1
    }
}

function Wait-TcpPortFree {
    param(
        [int]$Port = 8081,
        [int]$TimeoutSec = 45
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $inUse = $false
        try {
            $client = New-Object System.Net.Sockets.TcpClient
            $client.Connect('127.0.0.1', $Port)
            $client.Close()
            $inUse = $true
        } catch {
            return $true
        }
        if ($inUse) {
            Start-Sleep -Milliseconds 400
        }
    }
    return $false
}

function Test-WebEndpoint {
    param(
        [string]$Url = 'http://127.0.0.1:8081/',
        [int[]]$ExpectedStatus = @(200, 503)
    )

    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        return $ExpectedStatus -contains $r.StatusCode
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__) {
            $code = [int]$_.Exception.Response.StatusCode.value__
            return $ExpectedStatus -contains $code
        }
        return $false
    }
}

function Start-AeroMaintenancePage {
    $maintRunning = $false
    try {
        $maintRunning = (docker inspect -f '{{.State.Running}}' aerosuite-maintenance 2>$null) -eq 'true'
    } catch {
        $maintRunning = $false
    }

    if ($maintRunning -and (Test-WebEndpoint -ExpectedStatus @(503))) {
        Write-Host 'OK: pagina de manutencao ja ativa em http://127.0.0.1:8081' -ForegroundColor Green
        return
    }

    Write-Host 'Parando frontend...' -ForegroundColor DarkGray
    Invoke-AeroDockerComposeRaw -ComposeArgs @('stop', 'web') | Out-Null
    Invoke-AeroDockerComposeRaw -ComposeArgs @('rm', '-f', 'web') | Out-Null

    Write-Host 'Removendo container de manutencao anterior (se existir)...' -ForegroundColor DarkGray
    Invoke-AeroDockerComposeRaw -ComposeArgs @('--profile', 'maintenance', 'stop', 'maintenance') | Out-Null
    Invoke-AeroDockerComposeRaw -ComposeArgs @('--profile', 'maintenance', 'rm', '-f', 'maintenance') | Out-Null

    if (-not (Wait-TcpPortFree -Port 8081)) {
        Write-Host 'ERRO: porta 8081 ainda ocupada apos parar os containers' -ForegroundColor Red
        Write-Host 'Verifique: docker ps --filter publish=8081' -ForegroundColor DarkGray
        exit 1
    }

    Write-Host 'Subindo pagina de manutencao na porta 8081...' -ForegroundColor DarkGray
    $upCode = Invoke-AeroDockerComposeUp -Service maintenance -Profile maintenance
    if ($upCode -ne 0) {
        Write-Host 'ERRO: nao foi possivel subir o container de manutencao' -ForegroundColor Red
        exit 1
    }

    Start-Sleep -Seconds 2
    if (-not (Test-WebEndpoint -ExpectedStatus @(503))) {
        Write-Host 'AVISO: manutencao subiu mas http://127.0.0.1:8081 ainda nao responde - aguarde alguns segundos' -ForegroundColor Yellow
    } else {
        Write-Host 'OK: pagina de manutencao ativa em http://127.0.0.1:8081' -ForegroundColor Green
    }
}

function Stop-AeroMaintenancePage {
    Invoke-AeroDockerComposeRaw -ComposeArgs @('--profile', 'maintenance', 'stop', 'maintenance') | Out-Null
    Invoke-AeroDockerComposeRaw -ComposeArgs @('--profile', 'maintenance', 'rm', '-f', 'maintenance') | Out-Null
}

function Complete-AeroDeployScript {
    param([int]$ExitCode = 0)
    if ($env:AEROSUITE_DEPLOY_PAUSE -eq '1') {
        Write-Host ''
        Write-Host 'Pressione Enter para fechar...' -ForegroundColor DarkGray
        Read-Host | Out-Null
    }
    exit $ExitCode
}
