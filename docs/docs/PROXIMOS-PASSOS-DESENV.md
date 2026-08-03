# Próximos passos — branch `desenv`

Ordem sugerida após fechar os 5 pilares de testes (menu i18n, smoke, stress, E2E, tenant).

## Fase A — Agora (Sprint 1 SaaS)

| # | Entrega | Estado | Como validar |
|---|---------|--------|----------------|
| A1 | **Centro de Organizações** (`/organizacoes`) | **Fechado** | API: `api-sprint1-organizacoes.ps1`; UI: E2E `e2e/tests/organizacoes-platform.spec.ts` |
| A2 | **Flyway V8–V40** | **Fechado** | `verify-flyway.ps1` / `sprint1-homologacao.ps1 -ApiOnly` |
| A3 | **Repositório remoto** | **Adiado** (sem `remote`) | [GUIA_GITHUB_INICIAL.md](./GUIA_GITHUB_INICIAL.md) quando houver URL |
| A4 | **Secrets CI** | **Adiado** (depende de A3) | [CI-SECRETS.md](./CI-SECRETS.md) |

## Fase B — P1 produto (código)

| # | Entrega | Estado |
|---|---------|--------|
| P1 | LGPD + billing mock + módulos tenant + signup trial | **Fechado** | `api-p1-smoke.ps1`, Flyway `V17` |

## Fase B — Próximas 2–4 semanas (P0/P1 legado)

| # | Entrega | Estado | Referência |
|---|---------|--------|------------|
| B1 | Login/forgot multi-tenant (`TENANT_REQUIRED`) | **Fechado** | UI + `GET /auth/login-tenants`; seed `db/scripts/seed_multi_tenant_login_test.sql`; `.\scripts\test\provision-multi-tenant-login-test.ps1` |
| B2 | RBAC servidor | **Fechado** | `@RequiresFuncionalidades` nos resources; `AuthExternoAccessGuard` em `/auth-externo/me/*`; `.\scripts\test\api-rbac-smoke.ps1` |
| B3 | i18n fora do comercial (OS, estoque, portal externo) | **Fechado (OS + estoque)** — portal externo já com ES/FR; novos ecrãs seguem `.cursor/rules/i18n-frontend.mdc` | `.cursor/rules/i18n-frontend.mdc` |
| B4 | White-label por tenant (branding na provisão) | **Feito** — `?tenant=` público + shell/login/estoque | `BrandingService`, `PublicSistemaEmpresaResource` |

## Fase D — Produto final (hospedagem e go-live)

| # | Entrega | Documento |
|---|---------|-----------|
| D1 | Escolher VPS (**Hetzner CPX31**) | **Decidido** — [DECISAO-VPS.md](./DECISAO-VPS.md), [HOSPEDAGEM-PRODUCAO.md](./HOSPEDAGEM-PRODUCAO.md) |
| D2 | Deploy Docker produção | [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md) + `docker-compose.production.yml` |
| D3 | Domínio + HTTPS | [CLOUDFLARE_TUNNEL.md](./CLOUDFLARE_TUNNEL.md) |
| D4 | Backups e operação | [OPERACAO-PRODUCAO.md](./OPERACAO-PRODUCAO.md) |
| D5 | Índice completo | [PRODUTO-FINAL-INDICE.md](./PRODUTO-FINAL-INDICE.md) |

```bash
# No servidor Linux
./scripts/deploy/bootstrap-linux.sh
cp .env.production.example .env.production
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml up -d --build
```

## Fase C — Comercial (código na suite)

| # | Entrega | Estado | Referência |
|---|---------|--------|------------|
| C1 | Decisões Bling/ERP MVP | **Fechado (MVP)** | [COMERCIALIZACAO-BLING-ESCOPO.md](./COMERCIALIZACAO-BLING-ESCOPO.md) |
| C2 | Stripe + webhook + LGPD job + auditoria | **Fechado** | Flyway `V18`; `api-comercial-smoke.ps1` |
| C3 | Calculadora ROI + landing comercial | **Feito (estático)** | [`marketing/landing-roi/index.html`](./marketing/landing-roi/index.html) + [CALCULADORA-ROI-MODELO.md](./CALCULADORA-ROI-MODELO.md) |
| — | API configurações admin (`V44`, `/api/sistema-config`) | **Fechado** | Tela Configurações (admin) |
| C4 | Bling fase 2 (import clientes na proposta) | **Fechado** | `BlingIntegrationResource`, UI proposta |
| P3 | LGPD tenant, logo tenant, Pagar.me stub, smokes P3 | **Fechado** | Flyway `V19`; `api-p3-smoke.ps1` |

## Fase P4 / P5 — Diferenciação MRO (código pós go-live infra)

**Não reabre P3 de infra.** Deploy (Fase D) e Stripe prod podem correr em paralelo ao produto.

| # | Entrega | Estado | Documento |
|---|---------|--------|-----------|
| P4.1 | **Proposta → OS** | **Fechado** (Flyway `V20`, `POST .../gerar-os`) | [PORTAL-CLIENTE-2-PROPOSTA-OS.md](./PORTAL-CLIENTE-2-PROPOSTA-OS.md) § A |
| P4.2 | **Portal cliente 2.0** | **Fechado** (Flyway `V21`, `/externo/propostas`) | § B do mesmo doc |
| P4.3 | **Kit go-live 30 dias** | **Fechado** (`V22`, `/go-live-migracao`) | [KIT-GOLIVE-30-DIAS.md](./KIT-GOLIVE-30-DIAS.md) |
| P4.4 | **Dossiê auditoria** | **Fechado** (`V23`, pacote ZIP) | [DOSSIE-AUDITORIA.md](./DOSSIE-AUDITORIA.md) |
| P5.1 | **Aero Studio** | **Fechado** (`V25`, `/studio`) | [AERO-STUDIO-MVP-ESCOPO.md](./AERO-STUDIO-MVP-ESCOPO.md) |
| P5.2 | **Hangar job card** | **Fechado** (`V33`/`V36`, `/hangar`) | [ROADMAP-CONFORMIDADE-REGULATORIA.md](./ROADMAP-CONFORMIDADE-REGULATORIA.md) B5 |
| P5.3 | **Quadro capacidade / AOG** | **Fechado** (`V38`–`V40`, drag, hangares, notificações, sync déficit) | [QUADRO-CAPACIDADE-P53.md](./QUADRO-CAPACIDADE-P53.md) |
| P5.5 | Bling webhooks | **MVP feito** (`V41`, homologação staging pendente) | [COMERCIALIZACAO-BLING-ESCOPO.md](./COMERCIALIZACAO-BLING-ESCOPO.md) |
| P4.2 v1.1 | Portal aditivos/anexos | **Fechado** (API + portal externo + aba Portal na proposta interna) | [PORTAL-CLIENTE-2-PROPOSTA-OS.md](./PORTAL-CLIENTE-2-PROPOSTA-OS.md) |
| Estoque | Invoice: detalhe + inativar/cancelar/restaurar + auditoria (`V43`) | **Fechado** | `api-estoque-invoice-smoke.ps1` |

Mapa completo de dores e pacotes: [ROADMAP-DIFERENCIACAO-MRO.md](./ROADMAP-DIFERENCIACAO-MRO.md).

## Comandos do dia a dia

```powershell
git checkout desenv
.\scripts\test\final-suite.ps1 -SkipDockerRebuild -SkipMaven   # regressão rápida
.\scripts\test\sprint1-homologacao.ps1                           # Fase A completa (suite + lembrete UI)
.\scripts\test\sprint1-homologacao.ps1 -ApiOnly                # Só Flyway + tenants + RBAC + isolamento
.\scripts\test\provision-multi-tenant-login-test.ps1             # B1: email em 2 tenants
.\scripts\test\api-rbac-smoke.ps1 -ProvisionDemoIfMissing      # B2: RBAC servidor
```

**D1 (VPS):** decisão em [DECISAO-VPS.md](./DECISAO-VPS.md) — executar [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md) ao criar o servidor.

## Próximo imediato (sem repositório remoto)

1. **Regressão** — `.\scripts\test\final-suite.ps1 -SkipDockerRebuild -SkipMaven` (Flyway V8+ auto, smokes P1/P3/comercial/conformidade).
2. **Merge** `desenv` → `master` após suite verde.
3. **D2 (infra)** — VPS + [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md) + `pre-deploy-check.ps1 -Strict`.
4. **Stripe em produção** — [STRIPE-PRODUCAO.md](./STRIPE-PRODUCAO.md) (`AERO_SUITE_BILLING_PROVIDER=stripe` + webhook).
5. **A3/A4** — quando existir GitHub: push + [CI-SECRETS.md](./CI-SECRETS.md).
6. **Backlog produto** — homologar Bling staging; deploy Fase D + Stripe prod; GitHub/CI quando houver `origin`. (ROI/landing: [`marketing/landing-roi/`](./marketing/landing-roi/))

Regressão rápida:

```powershell
Remove-Item Env:MYSQL_PORT -ErrorAction SilentlyContinue
.\scripts\test\final-suite.ps1 -SkipDockerRebuild -SkipMaven -SkipStress
```

## Merge para `master`

`final-suite` verde → integrar `desenv` em `master` (local; push quando houver `origin`):

```powershell
git checkout master
git merge desenv
```
