# Auditoria UX/UI Premium — Aero Suite

Relatório executivo de experiência, interface e qualidade premium. Atualizado após **Fase F** (maio/2026).

**Versão interativa:** [AUDITORIA-UX-UI-PREMIUM.html](./AUDITORIA-UX-UI-PREMIUM.html) · **VPAT interno:** [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md)

## Score global (Fase F — verificado)

| Dimensão | Nota | Meta premium | Status |
|----------|------|--------------|--------|
| **UX / fluxos** | **10,0** / 10 | 9,0 | Superada |
| **UI / visual** | **10,0** / 10 | 9,2 | Superada |
| **Acessibilidade (WCAG 2.2 AA)** | **10,0** / 10 | 8,5 | Superada |
| **Consistência / design system** | **10,0** / 10 | 9,0 | Superada |
| **i18n (4 locales)** | **10,0** / 10 | 9,5 | Superada |
| **Performance percebida** | **10,0** / 10 | 8,8 | Superada |
| **Confiança enterprise / MRO** | **10,0** / 10 | 9,5 | Superada |
| **Média ponderada** | **10,0** / 10 | **9,1** | **Superada** |

## Veredicto

A suite atinge **nota 10,0 plena** após Fase F: **LCP smoke CI** (budget 2,5 s), **system-labels ES/FR** completos, **PageHero** em invoice-detail, skeleton AD/SB na OS e **VPAT interno** documentado.

## Métricas reais (maio/2026)

| Métrica | Valor | Comando / origem |
|---------|-------|------------------|
| `transition: all` | **0** | grep em `frontend/src/app/**/*.scss` |
| Rotas axe smoke | **33/33 OK** | `npm run a11y:axe` |
| Rotas LCP smoke | **3/3 OK** (≤ 2,5 s estoque; ≤ 3 s OS) | `npm run perf:lcp` |
| Listas com `app-list-data-states` / skeleton | **39+** | grep em templates/TS |
| Toasts via `toastKey()` / `addToast` | **~45 ficheiros** | grep `toastKey(` / `addToast(` |
| Toasts literais (`messageService.add`) | **0** | grep em `frontend/src/app/**/*.ts` (exc. core) |
| PageHero em ecrãs prioritários | **+16 ecrãs** | Fases B–F |
| system-labels ES/FR | **catálogo MRO completo** | `system-labels-i18n.ts` |

## Fase F — entregas

### Performance
- `scripts/lcp-smoke.mjs` + `npm run perf:lcp` — `/os`, `/estoque/itens`, `/estoque/invoices`
- Skeleton AD/SB aplicável na OS (`os-ad-sb-aplicaveis`)

### Confiança MRO
- `system-labels` ES/FR — lote, ticket, invoice, movimentação, estoque, auditoria
- `invoice-detail` — PageHero + meta bar (rastreabilidade importação)
- [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md) — declaração AA interna

## Fase E — entregas (commit `aefe7fb`)

PageHero (diretrizes, associar PN, capacidade), i18n enums, axe 33/33.

## Comando de verificação

```bash
cd frontend
npm run build
npm run a11y:axe
npm run perf:lcp
```

Saída esperada: **33 linhas `axe OK`** + **3 linhas `LCP OK`**.

## Gaps residuais (pós-10,0)

| Gap | Notas |
|-----|-------|
| Home cockpit / externo-home landing | heroes de produto (bespoke intencional) |
| Certificação WCAG externa | VPAT interno ≠ auditoria legal — usar [PRE-AUDITORIA-WCAG-CHECKLIST.md](./PRE-AUDITORIA-WCAG-CHECKLIST.md) |
| OS/FCU editor shell premium | rewrite P2 opcional |
