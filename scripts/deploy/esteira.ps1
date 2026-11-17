param(
    [Parameter(Position=0)]
    [ValidateSet('start','stop','status','logs','check','deploy','prod-status','help')]
    [string]$Action = 'help',
    [string]$ProductionHost = '216.238.102.195',
    [string]$SshUser = 'root',
    [string]$IdentityFile = "$env:USERPROFILE/.ssh/aerosuite_ed25519",
    [switch]$LocalMysql
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
function Run([string]$Program, [string[]]$Arguments) {
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program falhou (codigo $LASTEXITCODE)." }
}
function Wait-Health([string]$Url) {
    for ($attempt=0; $attempt -lt 60; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5
            if ($response.StatusCode -eq 200) { return }
        } catch { }
        Start-Sleep -Seconds 5
    }
    throw "Servico indisponivel: $Url"
}
Push-Location $root
try {
    if ($Action -eq 'help') {
        Write-Host 'esteira.cmd start|stop|status|logs|check|deploy|prod-status'
        Write-Host 'Local usa .env e MySQL configurado nele. Para MySQL Docker: start -LocalMysql (use tambem nos comandos seguintes).'
        Write-Host 'Deploy publica o commit HEAD; exige arvore rastreada limpa e SSH. Nao envia .env nem dados locais.'
        exit 0
    }
    $sshArgs = @('-i', $IdentityFile, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15')
    $target = "${SshUser}@${ProductionHost}"
    if ($Action -eq 'prod-status') {
        Run 'ssh' ($sshArgs + @($target, 'curl -fsS http://127.0.0.1:8080/q/health && curl -fsSI http://127.0.0.1:8081/'))
    } elseif ($Action -eq 'deploy') {
        Run 'git' @('diff','--exit-code','HEAD','--','backend','frontend','docker-compose.yml','docker-compose.local-mysql.yml','docker-compose.production.yml','scripts/deploy/vultr-deploy.sh')
        if (!(Test-Path -LiteralPath $IdentityFile)) { throw 'Chave SSH ausente.' }
        $bundle = Join-Path ([IO.Path]::GetTempPath()) ("aerosuite-" + [guid]::NewGuid().ToString('N') + '.tgz')
        $deployScript = "$bundle.sh"
        try {
            # Somente codigo e configuracao versionados necessarios ao build.
            Run 'git' @('archive','--format=tar.gz',"--output=$bundle",'HEAD','backend','frontend','docker','docker-compose.yml','docker-compose.local-mysql.yml','docker-compose.production.yml')
            Run 'scp' ($sshArgs + @($bundle, "${target}:/tmp/aerosuite-repo.tgz"))
            $scriptText = [IO.File]::ReadAllText((Join-Path $root 'scripts/deploy/vultr-deploy.sh')).Replace("`r`n", "`n")
            $releaseSha = (& git rev-parse HEAD).Trim()
            if ($releaseSha -notmatch '^[0-9a-f]{40}$') { throw 'Commit invalido.' }
            $scriptText = $scriptText.Replace('echo "==> Validar compose"', "echo '$releaseSha' > backend/src/main/resources/deployment-sha.txt`n" + 'echo "==> Validar compose"')
            [IO.File]::WriteAllText($deployScript, $scriptText, (New-Object Text.UTF8Encoding($false)))
            Run 'scp' ($sshArgs + @($deployScript, "${target}:/tmp/vultr-deploy.sh"))
            Run 'ssh' ($sshArgs + @($target, 'INSTALL_DIR=/opt/aerosuite TARBALL=/tmp/aerosuite-repo.tgz bash /tmp/vultr-deploy.sh'))
            Wait-Health 'https://prod.aerosuite.com.br/'
            Wait-Health 'https://prod.aerosuite.com.br/api/public/deployment'
            Write-Host 'Deploy em producao concluido e verificado.' -ForegroundColor Green
        } finally {
            if (Test-Path -LiteralPath $bundle) { Remove-Item -LiteralPath $bundle }
            if (Test-Path -LiteralPath $deployScript) { Remove-Item -LiteralPath $deployScript }
        }
    } else {
        if (!(Test-Path '.env')) { throw 'Crie .env a partir de .env.example e configure o banco.' }
        Run 'docker' @('info','--format','{{.ServerVersion}}')
        $compose = @('compose','-f','docker-compose.yml')
        if ($LocalMysql) { $compose += @('-f','docker-compose.local-mysql.yml') }
        Run 'docker' ($compose + @('config','-q'))
        switch ($Action) {
            'start' {
                Run 'docker' ($compose + @('build','api','web'))
                Run 'docker' ($compose + @('up','-d','api','web'))
                Wait-Health 'http://127.0.0.1:8080/q/health'
                Wait-Health 'http://127.0.0.1:8081/'
                Write-Host 'Disponivel em http://localhost:8081' -ForegroundColor Green
            }
            'stop' { Run 'docker' ($compose + @('stop')) }
            'status' { Run 'docker' ($compose + @('ps')) }
            'logs' { Run 'docker' ($compose + @('logs','--tail','150','-f','api','web')) }
            'check' {
                Wait-Health 'http://127.0.0.1:8080/q/health'
                Wait-Health 'http://127.0.0.1:8081/'
                Write-Host 'API e frontend saudaveis.'
            }
        }
    }
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally { Pop-Location }
