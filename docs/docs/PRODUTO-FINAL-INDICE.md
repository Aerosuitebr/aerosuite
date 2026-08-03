# Aero Suite — índice documental (produto final)

Mapa dos documentos por fase do ciclo de vida. Use este ficheiro como porta de entrada.

## 1. Desenvolvimento (branch `desenv`)

| Documento | Conteúdo |
|-----------|----------|
| [PROXIMOS-PASSOS-DESENV.md](./PROXIMOS-PASSOS-DESENV.md) | Fases A/B/C: Sprint 1, RBAC, i18n, comercial |
| [SPRINT1-ISOLAMENTO-TENANT.md](./SPRINT1-ISOLAMENTO-TENANT.md) | Multi-tenant, `/organizacoes`, testes de isolamento |
| [P0-P1-EXECUCAO.md](./P0-P1-EXECUCAO.md) | Flyway, RBAC, tenant Hibernate |
| [P0-PLATFORM-STATUS.md](./P0-PLATFORM-STATUS.md) | Estado P0 plataforma (JWT, auditoria, Flyway, testes UI) |
| [PRE-AUDITORIA-WCAG-CHECKLIST.md](./PRE-AUDITORIA-WCAG-CHECKLIST.md) | Checklist WCAG 2.2 AA pré-auditoria externa |
| [WCAG-CERTIFICACAO-ROTEIRO.md](./WCAG-CERTIFICACAO-ROTEIRO.md) | Roteiro em 4 fases até VPAT 2.5 externo |
| [IMPLEMENTACAO-PLANO-SAAS.md](./IMPLEMENTACAO-PLANO-SAAS.md) | Matriz P0/P1/P2 vs código |
| [README.md](../README.md) | Arranque local, Git, testes |

**Testes:** `scripts/test/final-suite.ps1`, `sprint1-homologacao.ps1`

## 2. Staging (homologação)

| Documento | Conteúdo |
|-----------|----------|
| [OPERACAO-STAGING.md](./OPERACAO-STAGING.md) | Dump de produção, `.env.staging`, Flyway repair |
| `.env.staging.example` | Variáveis típicas de staging |

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
```

## 3. Hospedagem e produção

| Documento | Conteúdo |
|-----------|----------|
| [HOSPEDAGEM-PRODUCAO.md](./HOSPEDAGEM-PRODUCAO.md) | Provedor (Hetzner CPX31), firewall, dimensionamento |
| [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md) | Checklist deploy passo a passo |
| [OPERACAO-PRODUCAO.md](./OPERACAO-PRODUCAO.md) | Backups, monitorização, atualizações, rollback |
| [CLOUDFLARE_TUNNEL.md](./CLOUDFLARE_TUNNEL.md) | HTTPS sem abrir portas públicas |
| `.env.production.example` | Variáveis de produção |

```bash
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml up -d --build
```

## 4. Comercial e go-to-market (paralelo)

| Documento | Conteúdo |
|-----------|----------|
| [COMERCIALIZACAO-BLING-ESCOPO.md](./COMERCIALIZACAO-BLING-ESCOPO.md) | Integração ERP |
| [BILLING-PAGARME.md](./BILLING-PAGARME.md) | Pagar.me (checkout + webhook implementados) |
| [CALCULADORA-ROI-MODELO.md](./CALCULADORA-ROI-MODELO.md) | ROI e landing |
| `docs/PLANO-COMERCIALIZACAO-SUITE.html` | Plano estratégico completo |

## 4b. Diferenciação MRO (P4 / P5 — pós go-live código)

| Documento | Conteúdo |
|-----------|----------|
| [ROADMAP-DIFERENCIACAO-MRO.md](./ROADMAP-DIFERENCIACAO-MRO.md) | Dores do setor, mapa competitivo, prioridades P4/P5 |
| [QUADRO-CAPACIDADE-P53.md](./QUADRO-CAPACIDADE-P53.md) | P5.3 — quadro capacidade / AOG (MVP) |
| [PORTAL-CLIENTE-2-PROPOSTA-OS.md](./PORTAL-CLIENTE-2-PROPOSTA-OS.md) | Killer feature: Proposta → OS + Portal cliente 2.0 |
| [AERO-STUDIO-MVP-ESCOPO.md](./AERO-STUDIO-MVP-ESCOPO.md) | Materiais promocionais (templates, sangria, export) |

## 4c. Conformidade ANAC / Part 145 (submissão)

| Documento | Conteúdo |
|-----------|----------|
| [anac-conformidade/README.md](./anac-conformidade/README.md) | **Dossiê regulatório** — matriz, planos, checklist, roteiro ANAC |
| [ROADMAP-CONFORMIDADE-REGULATORIA.md](./ROADMAP-CONFORMIDADE-REGULATORIA.md) | Funcionalidades de conformidade no produto (Ondas A–D, P1–P5) |
| [DOSSIE-AUDITORIA.md](./DOSSIE-AUDITORIA.md) | Export PDF/ZIP para auditorias |

**Verificação:** `.\scripts\test\anac-conformidade-evidencias.ps1` → `docs/anac-conformidade/evidencias/ultima-execucao.json`

## 5. Repositório e CI

| Documento | Conteúdo |
|-----------|----------|
| [GUIA_GITHUB_INICIAL.md](./GUIA_GITHUB_INICIAL.md) | Remote, push, branches |
| `.github/workflows/ci.yml` | Build backend/frontend + audit menu |
| `.github/workflows/covered-suite.yml` | Stack Docker + run-all (manual) |
| `.github/workflows/integration-smoke.yml` | Smoke HTTP contra API em execução |

## Ordem recomendada até go-live

1. Fechar Sprint 1 (testes + `/organizacoes`) — Fase A em `PROXIMOS-PASSOS-DESENV.md`
2. Staging com dump — `OPERACAO-STAGING.md`
3. Servidor Hetzner — `HOSPEDAGEM-PRODUCAO.md`
4. Deploy — `DEPLOY-PRODUCAO.md`
5. Cloudflare + domínio — `CLOUDFLARE_TUNNEL.md`
6. Operação contínua — `OPERACAO-PRODUCAO.md`
7. Merge `desenv` → `master` e tag de release
8. Implementar P4.1 → P4.2 — [PORTAL-CLIENTE-2-PROPOSTA-OS.md](./PORTAL-CLIENTE-2-PROPOSTA-OS.md) (infra D em paralelo se necessário)
