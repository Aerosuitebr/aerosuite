# Helm — staging em Kubernetes

Deploy da Aero Suite em cluster K8s de **staging** com **ServiceMonitor** (Prometheus Operator) e secrets externos.

Relacionado: [P2-ENTERPRISE-EXECUCAO.md](./P2-ENTERPRISE-EXECUCAO.md), [OPERACAO-STAGING.md](./OPERACAO-STAGING.md).

---

## Pré-requisitos

| Componente | Notas |
|------------|--------|
| **kubectl** + contexto do cluster staging | |
| **Helm 3** | |
| **MySQL** | Instância gerida ou in-cluster (dump de staging restaurado) |
| **Prometheus Operator** (opcional mas recomendado) | ex. `kube-prometheus-stack` |
| **Ingress controller** | NGINX + cert-manager para TLS |
| **Imagens** | API e Web publicadas no registry (`ghcr.io/...` ou ECR) |

---

## 1. Secret da API (não commitar)

Crie o secret com variáveis sensíveis **antes** do `helm install`:

```bash
kubectl create namespace aerosuite-staging

kubectl -n aerosuite-staging create secret generic aerosuite-staging-api-env \
  --from-literal=QUARKUS_DATASOURCE_JDBC_URL='jdbc:mysql://mysql-staging:3306/aerosuite?...' \
  --from-literal=QUARKUS_DATASOURCE_USERNAME='aerosuite' \
  --from-literal=QUARKUS_DATASOURCE_PASSWORD='***' \
  --from-literal=AERO_SUITE_JWT_SECRET='***-min-32-chars' \
  --from-literal=QUARKUS_MAILER_PASSWORD='' \
  --from-literal=FRONTEND_URL='https://staging.aerosuite.app'
```

O chart referencia `api.existingSecret: aerosuite-staging-api-env` em `values-staging.yaml`.

---

## 2. Instalar / actualizar

Na raiz do repositório:

```bash
helm upgrade --install aerosuite-staging ./deploy/helm/aerosuite \
  -f deploy/helm/aerosuite/values.yaml \
  -f deploy/helm/aerosuite/values-staging.yaml \
  --namespace aerosuite-staging \
  --set api.image.tag=staging-2026-06-06 \
  --set web.image.tag=staging-2026-06-06
```

PowerShell (equivalente):

```powershell
.\scripts\deploy\helm-staging-install.ps1 -ImageTag staging-2026-06-06
```

---

## 3. ServiceMonitor (Prometheus)

Com `metrics.serviceMonitor.enabled: true` em `values-staging.yaml`:

- CRD `ServiceMonitor` aponta ao Service da API na porta `http`, path `/q/metrics`.
- `metrics.serviceMonitor.additionalLabels.release` deve coincidir com o label que o **Prometheus** do operator usa para descobrir ServiceMonitors (ex. `kube-prometheus-stack`).

Verificar no Prometheus UI → Status → Targets: job `aerosuite-staging-api` deve estar **UP**.

Se não tiver Operator, desligue ServiceMonitor e use anotações `prometheus.io/*` no Pod (fallback em `values.yaml`).

---

## 4. Smoke pós-deploy

```bash
kubectl -n aerosuite-staging get pods
kubectl -n aerosuite-staging port-forward svc/aerosuite-staging-api 8080:8080
curl -s http://localhost:8080/q/health/ready
curl -s http://localhost:8080/q/metrics | head
```

Script local (API já exposta):

```powershell
.\scripts\test\verify-p2-metrics.ps1 -BaseUrl https://staging.aerosuite.app
```

Fluxo funcional: login, menu, proposta ou OS crítica — alinhado a [OPERACAO-STAGING.md](./OPERACAO-STAGING.md) §4.

---

## 5. Cobertura JaCoCo (fases)

| Fase | Comando | Mínimo linhas | Âmbito |
|------|---------|---------------|--------|
| **1 (CI default)** | `mvn verify` | **25 %** | Exclui domain/dto/api/controller/model/studio/service |
| **2** | `mvn verify -Pcoverage-phase2` | **40 %** | Inclui `service/*` |
| **3** | `mvn verify -Pcoverage-phase3` | **60 %** | Só exclui domain/dto/api/controller |

Relatório: `backend/target/site/jacoco/index.html` — artefacto `jacoco-report` no GitHub Actions.

Quando a fase 2 estiver estável no CI, altere o workflow para `mvn verify -Pcoverage-phase2`.

---

## 6. Desinstalar

```bash
helm uninstall aerosuite-staging -n aerosuite-staging
```

PVCs e secrets não são removidos automaticamente.
