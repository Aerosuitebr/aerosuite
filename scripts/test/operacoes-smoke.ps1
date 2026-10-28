param([string]$BaseUrl='http://localhost:8081',[string]$Email='admin@aerosuite.com',[string]$Password=$env:AEROSUITE_TEST_PASSWORD)
$ErrorActionPreference='Stop'
if (-not $Password) { throw 'Defina AEROSUITE_TEST_PASSWORD ou informe -Password.' }
$login=Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/auth/login" -ContentType 'application/json' -Body (@{email=$Email;password=$Password}|ConvertTo-Json)
$headers=@{Authorization="Bearer $($login.token)"}
$context=Invoke-RestMethod "$BaseUrl/api/operacoes/contexto" -Headers $headers
if (-not $context.custosPermitidos) { throw 'Use um perfil de teste com CUSTOS_OPERACIONAIS.' }
$modules=@('impedimentos','materiais','compras','prontidao','custos','planejamento','ferramentas','retornos')
foreach($module in $modules){$null=Invoke-RestMethod "$BaseUrl/api/operacoes/$module" -Headers $headers;Write-Output "OK GET $module"}
if($context.os.Count){$os=$context.os[0];$null=Invoke-RestMethod "$BaseUrl/api/operacoes/os/$($os.id)/resumo" -Headers $headers;Write-Output 'OK resumo da OS'}
$invalid=@{modulo='compras';titulo='Validacao de estado';status='CONSUMIDO'}|ConvertTo-Json
try { $null=Invoke-RestMethod -Method Post "$BaseUrl/api/operacoes/compras" -Headers $headers -ContentType 'application/json' -Body $invalid;throw 'Estado inválido aceito.' }catch {if([int]$_.Exception.Response.StatusCode -ne 400){throw};Write-Output 'OK rejeita estado inválido'}
try { $null=Invoke-RestMethod "$BaseUrl/api/operacoes/impedimentos";throw 'Acesso anônimo aceito.' }catch {if([int]$_.Exception.Response.StatusCode -notin @(401,403)){throw};Write-Output 'OK bloqueia acesso anônimo'}
Write-Output 'Smoke operacional concluído sem consumir estoque ou alterar OS.'
