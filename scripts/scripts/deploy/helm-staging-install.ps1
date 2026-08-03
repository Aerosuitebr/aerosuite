# Instala ou actualiza Aero Suite em cluster K8s (staging) via Helm.
param(
    [string]$ReleaseName = "aerosuite-staging",
    [string]$Namespace = "aerosuite-staging",
    [string]$ImageTag = "staging",
    [string]$ChartPath = "",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $ChartPath) {
    $ChartPath = Join-Path $repoRoot "deploy\helm\aerosuite"
}

$valuesBase = Join-Path $ChartPath "values.yaml"
$valuesStaging = Join-Path $ChartPath "values-staging.yaml"

foreach ($p in @($ChartPath, $valuesBase, $valuesStaging)) {
    if (-not (Test-Path $p)) {
        Write-Error "Ficheiro em falta: $p"
    }
}

helm version | Out-Null
kubectl version --client=true 2>$null | Out-Null

kubectl get namespace $Namespace 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "A criar namespace $Namespace ..."
    kubectl create namespace $Namespace
}

$helmArgs = @(
    "upgrade", "--install", $ReleaseName, $ChartPath,
    "-f", $valuesBase,
    "-f", $valuesStaging,
    "--namespace", $Namespace,
    "--set", "api.image.tag=$ImageTag",
    "--set", "web.image.tag=$ImageTag"
)
if ($DryRun) {
    $helmArgs += "--dry-run"
}

Write-Host "helm $($helmArgs -join ' ')"
& helm @helmArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "OK — release $ReleaseName no namespace $Namespace (tag $ImageTag)."
Write-Host "Confirme secret aerosuite-staging-api-env e targets Prometheus antes do smoke."
if (-not $DryRun) {
    kubectl -n $Namespace get pods,svc,ingress,servicemonitor 2>$null
}
