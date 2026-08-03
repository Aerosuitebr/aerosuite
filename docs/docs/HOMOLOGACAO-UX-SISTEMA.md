# Homologação UX — Sistema (app)

Checklist derivado do **Relatório Técnico UX** (`Relatorio_Tecnico_UX_AeroSuite_1.pdf`), **§3.5 e §7** — apontamentos visíveis em `app.aerosuite.com.br`.

> **Não confundir** com `docs/wordpress/verify-report-items.mjs`, que valida apenas o **site** WordPress.

## Pré-requisitos

1. App acessível (`AEROSUITE_APP_URL`, default `http://localhost:8081`)
2. Credenciais: `AEROSUITE_APP_EMAIL`, `AEROSUITE_APP_PASSWORD`, `AEROSUITE_APP_TENANT` (ou `docs/wordpress/aerosuite-site-secrets.local.mjs`)
3. Playwright (`playwright-core` já usado em `docs/wordpress/`)

## 1. Sanitizar dados do tenant (banco)

Substitui clientes reais, registros smoke e corrige `Servico` / encoding `??` no tenant de homologação (default = id 1):

```bash
mysql -u root -p aerosuite < db/scripts/sanitize-demo-tenant-homologacao.sql
```

**MySQL Workbench:** abra o arquivo, confirme o schema `aerosuite`, **Ctrl+A** e execute o script **inteiro** (Ctrl+Shift+Enter). Não execute só um `SELECT` do meio — é preciso rodar o `SET @tenant_id` e `SQL_SAFE_UPDATES` do início.

Outro tenant:

```sql
SET @tenant_id = (SELECT id FROM tenant WHERE codigo = 'demo' LIMIT 1);
SOURCE db/scripts/sanitize-demo-tenant-homologacao.sql;
```

## 2. Verificar apontamentos no app

```bash
node scripts/verify-system-ux-report.mjs
```

Produção:

```bash
AEROSUITE_APP_URL=https://app.aerosuite.com.br node scripts/verify-system-ux-report.mjs
```

Saída JSON: `scripts/.verify-system-ux-report.json`  
Exit code **1** se algum item falhar.

## Itens verificados

| ID | Rota | Apontamento |
|----|------|-------------|
| 3.5.3 | `/conformidade/painel` | Botão não deve exibir `common.actions.refresh` |
| 3.5.5 | `/conformidade/nao-conformidades` | Fase CAPA traduzida (não `CONTENCAO` cru) |
| 3.5.1 | `/os` | Sem clientes reais (FARROUPIL, QUICK MNT, AXIAL, `??`) |
| 3.5.2 | `/propostas-comerciais` | Sem smoke / “Cliente Smoke” |
| 3.5.4 | `/propostas-comerciais` | Sem “Servico” sem cedilha |
| 3.5.6 | `/os` | Sem caracteres `??` (encoding) |
| conf.* | `/conformidade/*` | Sem enums CAPA/i18n vazados nas rotas SGQ |

## Itens verificados (conformidade SGQ)

| ID | Rota | Apontamento |
|----|------|-------------|
| conf.documentos | `/conformidade/documentos` | Sem `CONTENCAO` / chaves i18n |
| conf.treinamentos | `/conformidade/treinamentos` | Idem |
| conf.calibracao | `/conformidade/calibracao` | Idem |
| conf.subcontratacao | `/conformidade/subcontratacao` | Idem |
| conf.habilitacoes | `/conformidade/habilitacoes` | Idem |
| conf.treinObrig | `/conformidade/treinamentos-obrigatorios` | Idem |

## Fluxo recomendado antes de demo / capturas

```powershell
.\scripts\run-homologacao-ux-sistema.ps1
```

Ou manualmente:

1. `sanitize-demo-tenant-homologacao.sql`
2. `verify-system-ux-report.mjs` → **12/12 OK** (6 itens §3.5 + 6 rotas conformidade)
3. `node scripts/build-ux-relatorio-sistema-pdf.mjs` → PDF em `manuals/Relatorio_Executivo_UX_AeroSuite_Sistema.pdf`
4. `node docs/wordpress/run-send-ux-sistema-relatorio-email.mjs` → e-mail (mesmos destinatários do site)
5. (Opcional) `docs/wordpress/recapture-all-screenshots.mjs` para atualizar imagens do site

## Código vs dados

| Tipo | Onde |
|------|------|
| i18n (`common.actions.refresh`, CAPA) | `frontend` — chaves em `listings-common-i18n.ts`, `conformidade-sgq-i18n.ts` |
| Nomes de clientes / smoke | **Banco** — script SQL acima |
| Encoding | **Banco** — UTF-8 + script SQL |
