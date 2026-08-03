# Implementação alinhada ao plano de comercialização (SaaS / MRO-first)

**Nome comercial da UI:** **Aero Suite** (`frontend/src/assets/branding.json`). Em textos use *Aero Suite*; em variáveis de ambiente e ficheiros de config use o prefixo técnico `AERO_SUITE_*` / `aero.suite.*`.

Este arquivo cruza o plano estratégico com o que já está no repositório e o backlog técnico.

## Onda 1 — Cloud single-tenant (documento)

- Modelo B: stack Docker por cliente em VPS — já suportado por `docker-compose.yml`.
- **Staging:** `docker-compose.staging.yml` + `.env.staging.example` → `docs/OPERACAO-STAGING.md`.
- **Produção:** `docker-compose.production.yml` + `.env.production.example` → `docs/DEPLOY-PRODUCAO.md`, `docs/HOSPEDAGEM-PRODUCAO.md`, `docs/OPERACAO-PRODUCAO.md`.
- **Índice go-live:** `docs/PRODUTO-FINAL-INDICE.md`.
- Subdomínio / SSL: `docs/CLOUDFLARE_TUNNEL.md`.

## P0 — Fundação (plano: 8–12 semanas)

| Item plano | Estado neste repo | Notas |
|------------|-------------------|--------|
| Flyway versionado | **Feito (repo)** | `V2__`…`V63__`. Validação automática: `.\scripts\test\verify-flyway.ps1` (descobre V8+). Playbook: [P0-P1-EXECUCAO.md](./P0-P1-EXECUCAO.md). Estado consolidado: [P0-PLATFORM-STATUS.md](./P0-PLATFORM-STATUS.md). |
| JWT HS256 + bcrypt | **Feito** | Login emite JWT HS256; token interno Base64 legado **desligado** (`aero.suite.auth.allow-legacy-internal-base64=false`); token externo `EXT:` mantido; BCrypt em `AuthService`. |
| `@RolesAllowed` / RBAC servidor | **Feito (modelo funcionalidade)** | `@RequiresFuncionalidades` + filtros JWT/permissão — decisão: não migrar para `@RolesAllowed` no curto prazo. [P0-PLATFORM-STATUS.md](./P0-PLATFORM-STATUS.md). |
| `tenant_id` + filtro Hibernate | **Fase 1–3 (activo)** | `V8__`–`V15__`; `TenantDataAccess`; DISCRIMINATOR + `@TenantId` (`String`); `Usuario`/`UsuarioExterno` com `orgTenantId`; HQL nativo com `:filterTid`. |
| CI/CD | **Iniciado** | `.github/workflows/ci.yml` — backend `mvn verify`, frontend `build` + `test:unit` (Vitest) + `a11y:axe`. |
| Auditoria de acesso | **Feito (MVP)** | `acesso_auditoria`: login, RBAC 403, AUTH_UNAUTHORIZED (401). Ver [P0-PLATFORM-STATUS.md](./P0-PLATFORM-STATUS.md). |
| Backup + restore testado | Operação | Automatizar e registar testes de restore. |
| Remover `/api/test-*`, `/api/fix` em produção | **Feito** | `@UnlessBuildProfile("prod")` em recursos de teste; `FixController` / `TestController` / email+WhatsApp test; `AuthResource` `/test` e `/refresh-oauth2-token` retornam 404 em `LaunchMode.NORMAL`; `/api/os-auditoria/teste` idem. **Perfil:** `QUARKUS_PROFILE=prod` no `Dockerfile` e `docker-compose` (serviço `api`). |

## P1 — Pronto para vender (plano)

| Item | Estado |
|------|--------|
| White-label (logo, nome, cores, e-mail) | **Feito** — branding por tenant (`BrandingService`, provisão, login `?tenant=`). |
| i18n completo (suite global) | **Feito** — comercial + OS + estoque + portal externo ES/FR; P1 UI em `p1-i18n.ts`. |
| LGPD (termos, aceite, exclusão) | **Feito** — `V17`/`V18`, aceite + job EXPORT/DELETE + download `/api/lgpd/solicitacoes/{id}/download`. |
| Onboarding self-service | **Feito** — wizard empresa + `/cadastro-trial` (`POST /api/public/signup/trial`). |
| Billing (Stripe / Pagar.me) | **Feito** — mock + `StripeBillingGateway` (Checkout + webhook assinado); env `AERO_SUITE_STRIPE_*`. |
| Feature flags por tenant (módulo MRO) | **Feito** — `tenant.modulos_habilitados`, filtro menu `/meu-menu`. |
| Feature flags finas (custom por cliente) | **Feito** — `tenant_feature`, `TenantFeatureCatalog`, `/api/tenant/features`, Angular `TenantFeatureService` + guard; ver [TENANT-FEATURES.md](./TENANT-FEATURES.md). |
| OpenAPI | Já exposto (`/q/openapi`, Swagger) |

**Teste:** `.\scripts\test\api-p1-smoke.ps1` (incluído em `verify-covered-suite.ps1`).

## P2 — Enterprise (plano)

**Playbook:** [P2-ENTERPRISE-EXECUCAO.md](./P2-ENTERPRISE-EXECUCAO.md).

| Item | Estado neste repo |
|------|-------------------|
| Observabilidade (Prometheus/Grafana/OTel) | **Iniciado** — `/q/metrics`, `docker-compose.observability.yml`, OTel via `AERO_SUITE_OTEL_ENABLED` |
| K8s/Helm | **Iniciado** — chart + `values-staging.yaml` + [HELM-STAGING-K8S.md](./HELM-STAGING-K8S.md) + ServiceMonitor |
| SSO (SAML/OIDC) | **Roadmap** — bridge OIDC → JWT; ver P2 doc §4 |
| API pública com rate limit | **Iniciado** — `PublicApiRateLimitFilter` em `/api/public/*` |
| App mobile nativo | **Roadmap** — PWA actual; Capacitor sugerido no P2 doc |
| Testes ~60 % | **Iniciado** — JaCoCo fase 1 (25 % CI); perfis `-Pcoverage-phase2/3` (40 %/60 %) |
| Certificações (SOC 2, ISO…) | **Roadmap** — matriz de controlos no P2 doc §7 |

## Git / ramos (plano)

- Recomendação do documento: branch `saas/foundation` para P0 isolado da `main` operacional. Executar no Git conforme processo interno.

## Módulo comercial / proposta (adequação operacional ao plano)

Cruzamento com `docs/PLANO-COMERCIALIZACAO-SUITE.html` (Onda 1 + operação de venda) e com o repositório atual.

| Capacidade | Estado | Onde / notas |
|------------|--------|----------------|
| Secção Comercial no menu + permissões SQL | **Feito** | `db/scripts/create_secao_comercial.sql`, `create_proposta_comercial.sql` |
| CRUD propostas + itens + status | **Feito** | `PropostaComercial`, `PropostaComercialResource`, `PropostaComercialService` |
| Lista / filtros de propostas | **Feito** | `proposta-comercial-list.component.ts` |
| UI completa (tabs produto, cliente, preview, totais, desconto, USD/BRL) | **Feito** | `comercial/proposta-comercial.component.ts` |
| Templates de produto/serviço | **Feito** | `TemplateProdutoServicoResource`, rota `/templates-proposta` |
| Cadastro de clientes de proposta + autocomplete | **Feito** | `ClientePropostaResource`, `cliente-proposta.service.ts` |
| **i18n comercial (PT/EN/ES/FR)** na proposta + listagens associadas | **Feito** | `commercial-proposta-i18n.ts`; `resolver-pendencias-i18n.ts`; `listing-comercial-i18n.ts` |
| Envio por e-mail (corpo / anexo PDF) + assinatura | **Feito** | `PropostaComercialService` + DTOs de envio |
| Envio / link WhatsApp | **Parcial** | `WhatsAppService` + envio em `PropostaComercialService`; depende de `whatsapp.api.enabled` e credenciais |
| Cotação dólar na proposta | **Feito** | `CotacaoService` integrado na UI |
| Branding Aero Suite (nome, logos) | **Parcial+** | `BrandingService` + tenant API; `brand-stack` usa logo do tenant; auth tagline/cor; e-mails transacionais com `withBrand` |
| **Integração Bling / ERP fiscal** | **Fase 1–2 + webhook MVP** | `GET .../status` + import contatos na proposta; `POST /api/integracoes/bling/webhook` (`V41`); homologação em staging pendente ([COMERCIALIZACAO-BLING-ESCOPO.md](./COMERCIALIZACAO-BLING-ESCOPO.md)). |
| **Proposta → OS (P4.1)** | **Feito** | `V20`, `PropostaComercialOsBridgeService`, UI + API `gerar-os`. |
| **Portal cliente 2.0 (P4.2)** | **Feito** | `V21`, `/externo/propostas`, aprovar/rejeitar. |
| **Quadro capacidade / AOG (P5.3)** | **Feito** | `V38`–`V40`, `/capacidade`, `/capacidade/hangares`, portal `/externo/capacidade`, notificações — [QUADRO-CAPACIDADE-P53.md](./QUADRO-CAPACIDADE-P53.md). |
| **API configurações admin** (`V44`) | **Feito** | `GET/PUT /api/sistema-config` — persistência por tenant na tela Configurações. |
| **Calculadora de ROI** + **landing** (plano §12 passos 5 e 8) | **Fora do monólito** | Modelo: `docs/CALCULADORA-ROI-MODELO.md` (material comercial, não confundir com API de config). |
| Contratos / LGPD / termos self-service (P1) | **Feito** | `V17`, `/api/public/lgpd/*`, `/cadastro-trial`, `/termos`, `/privacidade` |

**Próximo passo sugerido (operação):** (1) Homologar Bling em staging (token + webhook no painel Bling). (2) Deploy Fase D + [STRIPE-PRODUCAO.md](./STRIPE-PRODUCAO.md). (3) ROI/landing via [CALCULADORA-ROI-MODELO.md](./CALCULADORA-ROI-MODELO.md) (fora do monólito).

## Próximos passos técnicos sugeridos

1. **Flyway em cópia de BD:** [P0-P1-EXECUCAO.md](./P0-P1-EXECUCAO.md) §1 (`V2`…`V63`, `SELECT` antes de `V4`, política `repair`).
2. RBAC: decisão documentada — [P0-PLATFORM-STATUS.md](./P0-PLATFORM-STATUS.md).
3. **Operação:** backup/restore testado; merge `desenv` → `master`; `pre-deploy-check.ps1 -Strict`.
4. **Backlog:** homologar Bling webhooks em staging; [P2 enterprise](./P2-ENTERPRISE-EXECUCAO.md) (métricas, Helm staging, subir JaCoCo); ROI/landing fora do monólito.
