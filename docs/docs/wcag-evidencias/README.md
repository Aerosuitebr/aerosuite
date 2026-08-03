# Evidências WCAG — baseline automatizada

Artefactos gerados pelo smoke **axe-core** (`frontend/scripts/a11y-axe-smoke.mjs`).

## Gerar relatório

```bash
cd frontend && npm run build
npm run a11y:axe          # 52 rotas shell
npm run a11y:flow-p0      # F1 F4 F6 F12 (estrutural)
npm run a11y:flow-full    # F1–F12 (estrutural)
npm run a11y:gate         # gate código 100% (orquestra tudo)
node ../scripts/wcag-report.mjs   # JSON baseline axe
```

**Gate auditor externa:**

1. Automatizado: comandos acima (52 axe + 4 flow-p0).
2. Manual: [SESSAO-P0-MANUAL-TEMPLATE.md](./SESSAO-P0-MANUAL-TEMPLATE.md) (teclado + NVDA) → §7 do checklist.
3. Contratação: [RFP-FASE2-AUDITORIA-WCAG.md](./RFP-FASE2-AUDITORIA-WCAG.md) · credenciais [modelo](./CREDENCIAIS-AUDITORIA-HOMOLOG.example.md).

## Ficheiros

| Ficheiro | Conteúdo |
|----------|----------|
| `axe-baseline-latest.json` | Última execução axe (rotas, violações blocking) |
| `axe-baseline-YYYY-MM-DD.json` | Snapshot datado axe |
| `gate-codigo-latest.json` | Gate trilha CÓDIGO (`codePercent`, steps) |

**Roteiro 100%:** [WCAG-100-PASSO-A-PASSO.md](../WCAG-100-PASSO-A-PASSO.md)

**Gate CI:** 0 violações **critical** ou **serious** em todas as rotas listadas no script.
