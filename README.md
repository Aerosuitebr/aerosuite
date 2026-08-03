# Aero Suite — Fullstack

Plataforma SaaS multi-tenant para gestão aeronáutica (MRO, OS, estoque, comercial, portal externo).

## Stack

- **Backend:** Quarkus 3, Java 21 (`com.aerosuite`)
- **Frontend:** Angular 18 (`aerosuite-frontend`)
- **Base de dados:** MySQL (`aerosuite`)

## Arranque rápido

```powershell
# Variáveis: copiar .env.example → .env
docker compose up -d api web

# Frontend em dev
cd frontend
npm install
npm start
```

Login plataforma (após seed): `admin@aerosuite.com` / tenant `default`.

## Git (branches)

| Branch | Uso |
|--------|-----|
| `master` | Linha estável; merges a partir de `desenv` quando uma entrega estiver pronta |
| `desenv` | Desenvolvimento diário (commits e PRs partem daqui) |

```powershell
git checkout desenv          # trabalhar
# ... commits ...
git checkout master
git merge desenv             # integrar entrega validada
```

## Testes e Sprint 1

```powershell
.\scripts\test\final-suite.ps1 -SkipDockerRebuild -SkipMaven
.\scripts\test\sprint1-homologacao.ps1
```

Roadmap da branch `desenv`: [`docs/PROXIMOS-PASSOS-DESENV.md`](docs/PROXIMOS-PASSOS-DESENV.md)

**Produto final (staging → produção):** [`docs/PRODUTO-FINAL-INDICE.md`](docs/PRODUTO-FINAL-INDICE.md)

## Documentação

- `docs/PRODUTO-FINAL-INDICE.md` — mapa de todos os documentos até go-live
- `docs/PROXIMOS-PASSOS-DESENV.md` — fases A/B/C/D (desenvolvimento e deploy)
- `docs/DEPLOY-PRODUCAO.md` — checklist deploy (Hetzner + Docker)
- `docs/HOSPEDAGEM-PRODUCAO.md` — plano CPX31 e arquitetura
- `docs/SPRINT1-ISOLAMENTO-TENANT.md` — multi-tenant e provisão de organizações
- `.env.example` — configuração de API, MySQL e e-mail

## Migração de nome (Bellows → Aero Suite)

Se a BD local ainda se chama `bellows` e tens dados para preservar:

```powershell
cd db\scripts
.\Clone-BellowsDatabaseToAerosuite.ps1 -Password root -DropTarget -UpdateEnvFile
```

Guia completo: `db/scripts/README-MIGRACAO-BD.md`

Utilizadores com sessão antiga no browser devem voltar a fazer login (chaves `localStorage` renomeadas para `aerosuite_*`).
