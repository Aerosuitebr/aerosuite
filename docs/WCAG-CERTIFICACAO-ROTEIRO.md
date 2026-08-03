# Roteiro — certificação WCAG 2.2 AA (Aero Suite)

Plano em **4 fases** do estado actual (VPAT interno + axe CI) até auditoria externa e VPAT 2.5 comercializável.

**Documentos relacionados:**
- **[WCAG-100-PASSO-A-PASSO.md](./WCAG-100-PASSO-A-PASSO.md)** — roteiro 100% (código + humano + auditoria)
- [PRE-AUDITORIA-WCAG-CHECKLIST.md](./PRE-AUDITORIA-WCAG-CHECKLIST.md) — execução tática
- [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md) — declaração interna
- [AUDITORIA-UX-UI-PREMIUM.md](./AUDITORIA-UX-UI-PREMIUM.md) — contexto UX

---

## Estado actual (baseline jun/2026)

| Evidência | Resultado |
|-----------|-----------|
| Axe smoke CI | **52 rotas** (`npm run a11y:axe`) — 0 critical/serious |
| Flow full CI | **12/12** (`npm run a11y:flow-full`) — F1–F12 estrutural |
| Gate código | `npm run a11y:gate` → `gate-codigo-latest.json` |
| VPAT interno | Conforme **parcial** documentado (AA alvo) |
| Trilha humana | [SESSAO-P0-MANUAL-TEMPLATE.md](./wcag-evidencias/SESSAO-P0-MANUAL-TEMPLATE.md) — pendente |
| Auditoria externa | RFP pronto — pendente contratação |

---

## Fase 1 — Fecho interno (4–6 semanas)

**Objectivo:** zerar blockers do [checklist](./PRE-AUDITORIA-WCAG-CHECKLIST.md) §8 antes de orçamento externo.

| # | Entrega | Critério de done | Owner |
|---|---------|------------------|-------|
| 1.1 | Checklist manual P0 | `a11y:flow-p0` 4/4 + protocolo NVDA ([PROTOCOLO-P0-MANUAL.md](./wcag-evidencias/PROTOCOLO-P0-MANUAL.md)) | QA / dev |
| 1.2 | Axe expandido | 52 rotas verdes no CI (conformidade, hangar, dossiê, go-live) | Dev |
| 1.3 | Erros API mapeados | `extractApiErrorMessage` em fluxos OS/comercial críticos | Dev |
| 1.4 | Branding acessível | Editor proposta usa `--proposta-brand-primary` (contraste AA) | Dev |
| 1.5 | Modo escuro | Settings + comercial + listas legado sem “flash” claro | Dev |
| 1.6 | VPAT actualizado | Lacunas residuais listadas com data | Produto |

**Gate Fase 1:** secção 8 do checklist = “Pronto para auditor externa: **Sim**” (ou excepções documentadas).

---

## Fase 2 — Auditoria externa (2–4 semanas)

**Objectivo:** relatório independente WCAG 2.2 AA.

| # | Actividade | Notas |
|---|------------|-------|
| 2.1 | RFP a 2–3 fornecedores | Escopo: portal interno + externo, Angular SPA, 4 locales |
| 2.2 | Ambiente de teste | Staging com tenant demo + dados realistas |
| 2.3 | Amostragem | 52 rotas axe + 12 fluxos profundos (checklist §4) |
| 2.4 | Entrega | Relatório por critério + severidade + capturas |
| 2.5 | Remediação | Corrigir **blockers** e **majors** antes de VPAT |

**Orçamento indicativo:** consultoria especializada em acessibilidade digital (variável por escopo e idioma do relatório).

---

## Fase 3 — VPAT 2.5 e comunicação (1–2 semanas)

| # | Entrega | Uso |
|---|---------|-----|
| 3.1 | VPAT 2.5 (formato ITI) | Procurement enterprise / EUA |
| 3.2 | Declaração de acessibilidade (PT) | Site aerosuite.com.br / anexos comerciais |
| 3.3 | Actualizar [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md) | Alinhar com relatório externo |
| 3.4 | Política de regressão | PR exige `a11y:axe` verde; checklist anual |

---

## Fase 4 — Manutenção contínua

| Ritmo | Acção |
|-------|-------|
| Cada PR | `npm run a11y:axe` no CI |
| Cada release | Amostra manual 6 rotas P0 (15 min) |
| Semestral | Re-audit amostral ou auditoria completa se UI legado reescrito |
| Nova feature UI | Chave i18n + contraste + teclado antes de merge |

**Meta P2 alinhada:** expandir Playwright E2E com asserts a11y nos fluxos P0/P1 ([P2-ENTERPRISE-EXECUCAO.md](./P2-ENTERPRISE-EXECUCAO.md)).

---

## Registo de progresso

| Fase | Início | Conclusão | Notas |
|------|--------|-----------|-------|
| 1 — Fecho interno | 2026-06 | | Axe 52 rotas; `a11y:flow-p0`; protocolo manual + RFP Fase 2 em `docs/wcag-evidencias/` |
| 2 — Auditoria externa | | | |
| 3 — VPAT comercial | | | |
| 4 — Contínuo | | | CI axe + checklist |

---

## Comandos de verificação

```bash
cd frontend
npm run build
npm run test:unit
npm run a11y:axe    # esperado: 52x axe OK
npm run a11y:flow-p0   # F1 F4 F6 F12 estrutural
node ../scripts/wcag-report.mjs   # gera docs/wcag-evidencias/axe-baseline-latest.json
npm run perf:lcp
```

```powershell
# Checklist impresso / Notion
code docs/PRE-AUDITORIA-WCAG-CHECKLIST.md
```
