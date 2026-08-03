# VPAT interno — Aero Suite Frontend (WCAG 2.2 AA)

Documento **interno** de conformidade voluntária. Não substitui certificação oficial nem auditoria legal.

**Data:** junho/2026 · **Escopo:** Angular 18 · portal interno + externo  
**Referência:** [WCAG 2.2](https://www.w3.org/TR/WCAG22/) nível AA

## Resumo executivo

| Critério | Status | Evidência |
|----------|--------|-----------|
| Perceivable (1.x) | **Conforme parcial documentado** | Contraste AA em telas P0; axe 52/52 sem critical/serious |
| Operable (2.x) | **Conforme parcial documentado** | Focus-visible global; botões com nome acessível (aria-label i18n) |
| Understandable (3.x) | **Conforme parcial documentado** | i18n 4 locales; erros mapeados para chaves em módulos premium |
| Robust (4.x) | **Conforme parcial documentado** | axe-core smoke CI; landmarks (`role="banner"`, list states) |

## Verificação automatizada

```bash
cd frontend
npm run build
npm run test:unit
npm run a11y:axe        # 52 rotas
npm run a11y:flow-full  # F1–F12 estrutural
npm run a11y:gate       # gate código → gate-codigo-latest.json
npm run perf:lcp        # opcional
```

**Roteiro 100%:** [WCAG-100-PASSO-A-PASSO.md](./WCAG-100-PASSO-A-PASSO.md)

## Lacunas conhecidas (backlog)

- Certificação WCAG por auditor externo e testes com leitores de tela em todas as rotas legado (OS/FCU editor).
- Mensagens API: OS create/update e fluxos premium usam `extractApiErrorMessage`; validar leitor de tela (F12 manual).
- Editor comercial/proposta: cores de acento migradas para `--proposta-brand-primary` (tenant); validar contraste AA por tenant em auditoria.

**Roteiro certificação:** [WCAG-CERTIFICACAO-ROTEIRO.md](./WCAG-CERTIFICACAO-ROTEIRO.md) · **Checklist:** [PRE-AUDITORIA-WCAG-CHECKLIST.md](./PRE-AUDITORIA-WCAG-CHECKLIST.md)

## Declaração

Este VPAT descreve o estado **junho/2026** após Fases A–F da auditoria UX/UI Premium e modo escuro em configurações/comercial. Revalidar antes de uso comercial externo.
