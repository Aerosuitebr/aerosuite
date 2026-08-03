# Execução P2 — Enterprise

Guia operacional para o backlog **P2** do [IMPLEMENTACAO-PLANO-SAAS.md](./IMPLEMENTACAO-PLANO-SAAS.md) e do plano de comercialização (§ enterprise).

**Estado:** fundação iniciada no repositório (observabilidade, rate limit, Helm skeleton, JaCoCo). SSO, mobile nativo e certificações permanecem em roadmap.

---

## Matriz de estado

| Item P2 | Estado | Entregável neste repo |
|---------|--------|------------------------|
| **Observabilidade** (Prometheus / Grafana / OTel) | **Iniciado** | `quarkus-micrometer-registry-prometheus`, `/q/metrics`, `quarkus-opentelemetry` (off por omissão), `docker-compose.observability.yml`, `deploy/observability/` |
| **Kubernetes / Helm** | **Iniciado** | `deploy/helm/aerosuite/` (API + Web + Ingress opcional); health probes `/q/health/*` |
| **SSO corporativo** (SAML / OIDC) | **Roadmap** | Ver § SSO abaixo — JWT interno mantido; OIDC como perfil opcional futuro |
| **API pública com rate limit** | **Iniciado** | `PublicApiRateLimitFilter` em `/api/public/*`; env `AERO_SUITE_PUBLIC_API_RATE_LIMIT_*` |
| **App mobile nativo** | **Roadmap** | PWA Angular atual; app nativo = fase separada (Capacitor ou Flutter) |
| **Cobertura de testes ~60 %** | **Iniciado** | JaCoCo no `backend/pom.xml`; meta documentada; subir `jacoco.line.coverage.minimum` gradualmente |
| **Certificações** (SOC 2, ISO 27001, etc.) | **Roadmap** | Ver § Certificações |

---

## 1. Observabilidade

### Métricas Prometheus (activo)

- Endpoint: **`GET /q/metrics`** (público via regra `/q/*` no filtro JWT).
- Config: `application.properties` — `quarkus.micrometer.export.prometheus.*`
- Stack local:

```powershell
docker compose -f docker-compose.observability.yml up -d
```

- Prometheus scrape: `deploy/observability/prometheus.yml` → `host.docker.internal:8080`
- Grafana: http://localhost:3000 (credenciais em `GRAFANA_ADMIN_*`)

### OpenTelemetry (opcional)

```env
AERO_SUITE_OTEL_ENABLED=true
AERO_SUITE_OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```

Requer collector OTLP (Jaeger, Tempo, Datadog agent, etc.) na infraestrutura do cliente.

### Logs JSON

Já disponível: `quarkus-logging-json` no `pom.xml`. Em produção:

```properties
quarkus.log.console.json=true
```

(activar por perfil `prod` ou variável quando o agregador estiver pronto).

### Verificação rápida

```powershell
.\scripts\test\verify-p2-metrics.ps1
```

---

## 2. API pública — rate limiting

- **Âmbito:** paths ` /api/public/*` (signup, branding, LGPD, assets, estoque público).
- **Implementação:** janela fixa 1 minuto, contador em memória por **IP + prefixo** (`/api/public/signup`, `/api/public/lgpd`, …).
- **Resposta 429:** JSON + `Retry-After` + `X-RateLimit-Limit`.

| Variável | Default | Descrição |
|----------|---------|-----------|
| `AERO_SUITE_PUBLIC_API_RATE_LIMIT_ENABLED` | `true` | Liga/desliga |
| `AERO_SUITE_PUBLIC_API_RATE_LIMIT_RPM` | `120` | Pedidos/minuto por IP+prefixo |

**Cluster / multi-réplica:** substituir por Redis + gateway (Kong, NGINX `limit_req`, Cloudflare Rate Limiting).

**Próximo:** rate limit em `POST /api/auth/login` (anti brute-force) com bucket separado.

---

## 3. Kubernetes / Helm

**Guia completo staging:** [HELM-STAGING-K8S.md](./HELM-STAGING-K8S.md).

```bash
helm upgrade --install aerosuite-staging ./deploy/helm/aerosuite \
  -f deploy/helm/aerosuite/values.yaml \
  -f deploy/helm/aerosuite/values-staging.yaml \
  --namespace aerosuite-staging --create-namespace
```

Ou: `.\scripts\deploy\helm-staging-install.ps1 -ImageTag staging-YYYY-MM-DD`

**ServiceMonitor:** activo em `values-staging.yaml` (`metrics.serviceMonitor.enabled: true`); labels `release: kube-prometheus-stack` alinhados ao Prometheus Operator.

**Antes de produção K8s:**

1. Secrets para JDBC, `AERO_SUITE_JWT_SECRET`, mailer, Stripe/Pagar.me (`api.existingSecret`).
2. PVC ou object storage para `empresa-assets`, `os/`, backups.
3. Confirmar target Prometheus **UP** em `/q/metrics`.
4. MySQL gerido (RDS, Cloud SQL) — não embutido no chart v0.1.

---

## 4. SSO (OIDC / SAML) — roadmap

**Hoje:** login email/senha + JWT HS256 (`JwtTokenService`).

**Fase P2.1 (recomendada):**

1. Adicionar `quarkus-oidc` com perfil `%oidc` (não substituir JWT de imediato).
2. IdP alvo: Azure AD, Google Workspace, Okta (OIDC).
3. Fluxo: redirect OIDC → troca por JWT interno existente (bridge) para não reescrever RBAC.
4. SAML: via IdP que emite OIDC ou bridge externo (Keycloak).

**Variáveis previstas (não activas):**

```properties
# %oidc.quarkus.oidc.auth-server-url=https://login.microsoftonline.com/{tenant}/v2.0
# %oidc.quarkus.oidc.client-id=...
# %oidc.quarkus.oidc.credentials.secret=...
```

Documentar no onboarding do cliente enterprise: domínio de e-mail → tenant + IdP.

---

## 5. Mobile nativo — roadmap

| Opção | Esforço | Notas |
|-------|---------|-------|
| **PWA** (actual) | Baixo | Angular + service worker; offline limitado |
| **Capacitor** | Médio | Reutiliza frontend; push, câmara, biometria |
| **Flutter / RN** | Alto | Só se PWA/Capacitor insuficiente |

**MVP mobile sugerido:** Capacitor shell + rotas OS/capacidade/portal externo + push (FCM).

---

## 6. Cobertura de testes (~60 %)

### Backend (JaCoCo)

```powershell
cd backend
mvn -q verify                    # fase 1 — mínimo 25 %
mvn -q verify -Pcoverage-phase2  # fase 2 — 40 % (inclui service/*)
mvn -q verify -Pcoverage-phase3  # fase 3 — 60 %
# Relatório: backend/target/site/jacoco/index.html
```

| Fase | Perfil Maven | `jacoco.line.coverage.minimum` | Exclusões JaCoCo |
|------|--------------|-------------------------------|------------------|
| **1 (CI)** | *(default)* | **0.25** | domain, dto, api, controller, model, studio, **service** |
| **2** | `-Pcoverage-phase2` | **0.40** | sem `service` |
| **3** | `-Pcoverage-phase3` | **0.60** | só domain, dto, api, controller |

Quando fase 2 passar localmente/CI de forma estável, alterar `.github/workflows/ci.yml` para `mvn verify -Pcoverage-phase2`.

### Frontend

- Hoje: build + axe a11y + E2E Playwright (opcional).
- **Meta:** `ng test` + Karma coverage ou migrar testes críticos para Playwright; alvo 40 % UI nos módulos P0/P1.

### CI

Workflow `ci.yml` publica artefacto `jacoco-report` após `mvn verify`.

---

## 7. Certificações — roadmap

Não são “features de código”; exigem processo + evidências:

| Certificação | Pré-requisitos técnicos no produto |
|--------------|-------------------------------------|
| **SOC 2 Type II** | Auditoria de acesso, logs, backup testado, controlo de mudanças (CI), inventário de sub-processadores |
| **ISO 27001** | ISMS, gestão de risco, política de acesso, encriptação em trânsito (TLS) e repouso (BD/secrets) |
| **LGPD** | Já parcialmente coberto (P1) — reforçar DPA, registo de tratamento, DPO |

**Entregáveis sugeridos:** matriz de controlos ↔ funcionalidades Aero Suite; runbooks em `docs/OPERACAO-*.md`; pentest anual.

---

## Ordem de execução recomendada

1. ✅ Métricas + compose observabilidade + rate limit público (feito).
2. ✅ Helm staging + ServiceMonitor + [HELM-STAGING-K8S.md](./HELM-STAGING-K8S.md) (feito no repo; deploy no cluster é operação).
3. ✅ JaCoCo fase 1 (25 %) no CI; fases 2/3 via perfis Maven.
4. Alertas Prometheus (5xx, latência) no cluster staging.
5. Suites de integração Bling/billing/proposta para subir à fase 2 no CI.
4. Piloto OIDC com um tenant enterprise.
5. Capacitor MVP ou contrato SOC 2 readiness (paralelo comercial).

---

## Referências

- [IMPLEMENTACAO-PLANO-SAAS.md](./IMPLEMENTACAO-PLANO-SAAS.md)
- [P0-P1-EXECUCAO.md](./P0-P1-EXECUCAO.md)
- [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md)
- [OPERACAO-STAGING.md](./OPERACAO-STAGING.md)
