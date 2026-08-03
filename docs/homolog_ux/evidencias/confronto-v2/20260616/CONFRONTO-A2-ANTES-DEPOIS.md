# Confronto A2 — Antes e Depois (homolog/dev)

Data da ação: 16/06/2026  
Ambiente: `https://app.aerosuite.com.br` (mesma base dev)

## Resultado executivo

- Situação inicial (antes): **3 organizações duplicadas** para o mesmo e-mail no login.
- Situação final (depois): **1 organização ativa** para o e-mail da consultora.
- Status A2 após correção e limpeza: **Resolvido no ambiente**.

## Evidências de antes

- UI (dropdown com 3 entradas): `antes-login-tenant-dropdown.png`
- API: `api-antes-a2.json`
  - `tenantCount = 3`
  - IDs: `16`, `17`, `18`

## Ação corretiva executada

- Script SQL executado: `db/scripts/cleanup-duplicate-tenants-consultora-homolog.sql`
- Ajuste para schema real:
  - `usuario.tenant_id` (em vez de `org_tenant_id`)
  - `tenant` sem coluna `updated_at`
- Decisão de dados:
  - Manter `tenant id = 16` ativo
  - Inativar `tenant id = 17` e `tenant id = 18`
  - Inativar usuários associados às organizações duplicadas

## Evidências de depois

- UI (dropdown sem duplicidade): `depois-login-tenant-dropdown.png`
- API (estado final): `verificacao-homolog.json`
  - `tenantCount = 1`
  - `a2Status = "OK_DADOS"`
  - Tenant restante: `id=16`, `codigo=rafaella-nottes-consultoria`

## Métricas de reincidência (relatório consolidado A1–A61)

- Total de achados no consolidado: **61**
- Reincidência confirmada no momento do incidente: **1 (A2)**
- Percentual de reincidência no incidente:
  - **1 / 61 = 1,64%**
- Após ação corretiva nesta base:
  - **0 / 61 = 0,00%** (A2 sanado no ambiente validado)

## Observação de governança

Para o confronto completo de **todos os A1–A61**, manter o mesmo padrão desta pasta:
- captura antes (UI + API/log),
- evidência da ação,
- captura depois (UI + API/log),
- status final por item.
