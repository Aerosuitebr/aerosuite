<#
.SYNOPSIS
  Pipeline completo: clone bellows -> aerosuite + schema + admin + .env

.PARAMETER DockerContainer
  Contentor MySQL (padrao: bellows-mysql-local ou aerosuite-mysql-local).

.EXAMPLE
  .\Setup-AerosuiteFromBellows.ps1 -Password root -DockerContainer bellows-mysql-local
#>
[CmdletBinding()]
param(
    [string] $Password = 'root',
    [string] $User = 'root',
    [string] $DockerContainer = 'bellows-mysql-local',
    [switch] $SkipClone,
    [switch] $RecreateApi
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$clone = Join-Path $PSScriptRoot 'Clone-BellowsDatabaseToAerosuite.ps1'

if (-not $SkipClone) {
    & $clone -UseDocker -DockerContainer $DockerContainer -Password $Password -DropTarget
}

Write-Host "Importando tabelas de dominio (EstruturaBanco + scripts)..." -ForegroundColor Cyan
$imports = @(
    (Join-Path $root 'backend\EstruturaBanco\aerosuite_fabricante.sql'),
    (Join-Path $root 'backend\EstruturaBanco\aerosuite_product.sql'),
    (Join-Path $root 'backend\EstruturaBanco\aerosuite_fcu.sql'),
    (Join-Path $root 'backend\EstruturaBanco\aerosuite_os.sql'),
    (Join-Path $root 'backend\EstruturaBanco\aerosuite_associacao_fcu.sql'),
    (Join-Path $root 'backend\EstruturaBanco\aerosuite_tipo_servico.sql'),
    (Join-Path $root 'db\scripts\create_proposta_comercial.sql'),
    (Join-Path $root 'db\scripts\create_cliente_proposta.sql'),
    (Join-Path $root 'db\scripts\create_chat_tables.sql'),
    (Join-Path $root 'db\scripts\create_chamada_table.sql'),
    (Join-Path $root 'db\scripts\create_ticket_suporte.sql'),
    (Join-Path $root 'db\scripts\create_publicacoes_tecnicas.sql'),
    (Join-Path $root 'db\scripts\bootstrap_estoque_tables.sql'),
    (Join-Path $root 'db\init\usuario_externo.sql')
)
foreach ($f in $imports) {
    if (Test-Path $f) {
        Write-Host "  -> $(Split-Path $f -Leaf)"
        Get-Content $f -Raw -Encoding UTF8 | docker exec -i $DockerContainer mysql "-u$User" "-p$Password" aerosuite 2>$null | Out-Null
    }
}

Get-Content (Join-Path $PSScriptRoot 'post_clone_aerosuite_rebrand.sql') -Raw | docker exec -i $DockerContainer mysql "-u$User" "-p$Password" aerosuite 2>$null | Out-Null

docker exec $DockerContainer mysql "-u$User" "-p$Password" aerosuite -e @"
ALTER TABLE lote ADD COLUMN codigo_lote VARCHAR(100) NULL;
ALTER TABLE item_estoque ADD COLUMN codigo_rastreio VARCHAR(100) NULL;
ALTER TABLE product ADD COLUMN codigo_barras VARCHAR(100) NULL;
"@ 2>$null | Out-Null

docker exec $DockerContainer mysql "-u$User" "-p$Password" aerosuite -e @"
INSERT INTO usuario (nome,email,senha,perfil_id,ativo,data_cadastro,tenant_id,precisa_trocar_senha)
VALUES ('Administrador','admin@aerosuite.com','admin123',1,1,CURDATE(),1,0)
ON DUPLICATE KEY UPDATE senha='admin123', ativo=1, tenant_id=1;
"@ 2>$null | Out-Null

$envExample = Join-Path $root '.env.example'
$envFile = Join-Path $root '.env'
if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
}
(Get-Content $envFile -Raw) -replace '/bellows', '/aerosuite' -replace 'host\.docker\.internal', 'mysql' | Set-Content $envFile -Encoding UTF8
# Se API fora da rede compose, use host.docker.internal:
# (Get-Content $envFile) -replace 'jdbc:mysql://mysql:', 'jdbc:mysql://host.docker.internal:' | Set-Content $envFile

Write-Host "Base aerosuite preparada. Reinicie a API para Flyway V9-V16." -ForegroundColor Green
Write-Host "Login: admin@aerosuite.com / admin123 / tenant default"

if ($RecreateApi) {
    Set-Location $root
    docker compose -p bellows-fullstack-pro --env-file .env up -d api --force-recreate
}
