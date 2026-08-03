# Portfólio — clientes no site

## Bellows — Serviços Aeronáuticos

| Campo | Valor |
|-------|--------|
| Nome no site | Bellows — Serviços Aeronáuticos |
| Razão social / marca | Bellows Controls |
| Site público | https://bellowscontrols.com.br/ |
| Página de caso | `/casos/bellows-servicos-aeronauticos/` |
| Índice | `/casos/` |

**Arquivo de configuração:** `aerosuite-clients.mjs` — altere textos, módulos e resumo aqui; depois rode o deploy.

**Deploy:**

```bash
cd docs/wordpress
node build-gaps-deploy.mjs
node run-gaps-deploy.mjs
```

## Checklist de alinhamento com o cliente

- [x] Confirmar com a Bellows o uso do nome e link para o site deles — **DE ACORDO** (Alberto, 2026-06-04)
- [x] Logo em `portfolio/bellows/logo_redondo.png` — upload: `node run-upload-bellows-logo.mjs`
- [x] Autorização por escrito para menção como “cliente em operação” — **DE ACORDO** (2026-06-04)

## King do Rio — Peças Aeronáuticas

| Campo | Valor |
|-------|--------|
| Nome no site | King do Rio — Peças Aeronáuticas |
| Site público | https://kingdorio.com/ |
| Página de caso | `/casos/king-do-rio-pecas-aeronauticas/` |
| Módulos destacados | Propostas comerciais, controle de estoque |

**Logo:** `portfolio/kingdorio/KingDoRioLogo.png` → cópia em `docs/wordpress/static/portfolio/kingdorio-logo.png` → `node run-upload-kingdorio-logo.mjs`

## Checklist de alinhamento — King do Rio

- [x] Autorização por escrito (nome, marca, logo) — **DE ACORDO** (`timmaia@kingdorio.com`, 2026-06-04)

## Adicionar outro cliente

1. Incluir objeto em `PORTFOLIO_CLIENTS` em `aerosuite-clients.mjs`
2. Criar `build…CaseContent()` em `aerosuite-portfolio.mjs` (padrão `buildCaseContent`)
3. Registrar página filha em `build-gaps-deploy.mjs` com `parentSlug: 'casos'`
4. Upload do logo: `run-upload-<cliente>-logo.mjs` + entrada em `aerosuite-portfolio-media.mjs`

---

*Junho/2026*
