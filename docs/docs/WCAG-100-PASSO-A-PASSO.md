# WCAG 2.2 AA — Roteiro 100% (código + humano + auditoria)

Plano único para atingir **certificação comercial completa**: VPAT 2.5, declaração PT e regressão contínua.

**Três trilhas independentes** (cada uma vai a 100% no seu domínio):

| Trilha | Meta | Verificação | Estado jun/2026 |
|--------|------|-------------|-----------------|
| **A — CÓDIGO** | 100% automatizável | `cd frontend && npm run a11y:gate` | Ver `gate-codigo-latest.json` |
| **B — HUMANO** | 100% manual NVDA/teclado | §7 checklist + template sessão | Pendente execução |
| **C — EXTERNA** | 100% certificação comercial | Relatório auditor + VPAT 2.5 | Pendente contratação |

**Certificação total** = A 100% **e** B 100% **e** C 100%.

---

## Mapa de percentagens (metas do projeto)

| Meta global | Trilha | Acções | % após concluir |
|-------------|--------|--------|-----------------|
| **~75% Fase 1** | B | Sessão NVDA + §7 sem blockers | Pronto para enviar RFP |
| **~85% Fase 1** | A+B | Código 100% + F2–F3 hangar/FCU validados 🔊 | Pré-auditoria sólida |
| **~95% Fase 1** | A+B | Gate §8 = Sim | Auditor pode entrar |
| **~70% cert. total** | C | Relatório externo + remediação blockers/majors | Pós-Fase 2 |
| **100% cert. comercial** | C | VPAT 2.5 + declaração PT + regressão contínua | Fase 3 fechada |

---

# TRILHA A — CÓDIGO (meta 100%)

Tudo nesta secção é **executável por script/CI**. Quando `npm run a11y:gate` passar, a trilha código está em **100%**.

## A.1 Comandos (ordem)

```bash
cd frontend
npm run build
npm run test:unit
npm run a11y:axe          # 52 rotas — 0 critical/serious
npm run a11y:flow-p0      # F1 F4 F6 F12
npm run a11y:flow-full    # F1–F12 estrutural
npm run a11y:gate         # orquestra tudo + JSON
```

Relatórios:

- `docs/wcag-evidencias/axe-baseline-latest.json`
- `docs/wcag-evidencias/gate-codigo-latest.json`

## A.2 Checklist código (marcar quando verde)

| # | Item | Comando / ficheiro | [ ] |
|---|------|-------------------|-----|
| A1 | Build produção | `npm run build` | |
| A2 | Vitest core | `npm run test:unit` | |
| A3 | Axe 52/52 | `npm run a11y:axe` | |
| A4 | Flow P0 4/4 | `npm run a11y:flow-p0` | |
| A5 | Flow full 12/12 | `npm run a11y:flow-full` | |
| A6 | Gate código | `npm run a11y:gate` → `codePercent: 100` | |
| A7 | CI | `.github/workflows/ci.yml` — axe + flow-p0 + flow-full | |
| A8 | i18n a11y 4 locales | Regra `.cursor/rules/i18n-frontend.mdc` | |
| A9 | Contraste modo escuro V5 | `_premium-a11y.scss` dark theme | |
| A10 | Upload OS aria-label | `os-list.component.ts` input file | |
| A11 | Conta wcag-auditor | `db/scripts/provision-wcag-auditor-homologacao.sql` | |
| A12 | LCP smoke (opcional gate) | `npm run perf:lcp` | |

## A.3 Fluxos F1–F12 — cobertura código vs humano

| ID | Código (`a11y:flow-full`) | Humano (NVDA §B) |
|----|---------------------------|------------------|
| F1 | ✅ estrutural | ⏳ ⌨+🔊 |
| F2 | ✅ aria hangar | ⏳ ⌨+🔊 |
| F3 | ✅ shell FCU + labels | ⏳ ⌨+🔊 |
| F4 | ✅ tabs + totais | ⏳ ⌨+🔊 |
| F5 | ✅ botão imprimir | ⏳ PDF/contraste impressão |
| F6 | ✅ confirm i18n | ⏳ ⌨+🔊 |
| F7 | ✅ dropdown config | ⏳ ⌨+🔊 |
| F8 | ✅ th + paginação | ⏳ ⌨+🔊 |
| F9 | ✅ file aria-label | ⏳ ⌨+🔊 |
| F10 | ✅ trial labels | ⏳ ⌨+🔊 |
| F11 | ✅ lang + switcher | ⏳ 4 locales |
| F12 | ✅ erro login i18n | ⏳ toast 🔊 + offline |

## A.4 Regressão contínua (Fase 4 — parte código)

| Ritmo | Acção | Responsável |
|-------|--------|-------------|
| Cada PR | CI: build + unit + axe + flow-p0 + flow-full | Automático |
| Cada release | `npm run a11y:gate` + arquivar JSON datado | Dev/QA |
| Nova UI | Chave i18n × 4 + axe na rota nova | Dev |

**Trilha A = 100%** quando `gate-codigo-latest.json` → `"pass": true`, `"codePercent": 100`.

---

# TRILHA B — HUMANO (meta 100%)

Não automatizável. Usar [SESSAO-P0-MANUAL-TEMPLATE.md](./wcag-evidencias/SESSAO-P0-MANUAL-TEMPLATE.md).

## B.1 Pré-requisitos

- [ ] Trilha A em 100% (`npm run a11y:gate` verde)
- [ ] `sanitize-demo-tenant-homologacao.sql` executado
- [ ] Login: `wcag-auditor@aerosuite.com.br` / tenant `default`
- [ ] NVDA instalado (Windows) ou VoiceOver (macOS)
- [ ] Ambiente: `https://app.aerosuite.com.br`

## B.2 Sessão única (~60–90 min)

1. [ ] Secção A do template — setup NVDA
2. [ ] Secção B — 6 rotas P0 (⌨ + 🔊 cada)
3. [ ] Secção C — F1, F4, F6, F12 (⌨ + 🔊 cada)
4. [ ] Opcional ampliado — F2, F3, F5–F11 (checklist §4)
5. [ ] Copiar §7 para [PRE-AUDITORIA-WCAG-CHECKLIST.md](./PRE-AUDITORIA-WCAG-CHECKLIST.md)
6. [ ] **Blockers = 0** → marcar Gate §8 critérios humanos

## B.3 Amostragem 52 rotas (amostra release)

Não é obrigatório percorrer as 52 rotas manualmente antes da auditoria externa. Mínimo:

| Prioridade | Rotas | ⌨ | 🔊 | 🌓 |
|------------|-------|---|---|-----|
| P0 | `/login`, `/os`, `/estoque/itens`, `/configuracoes`, `/propostas-comerciais`, `/externo/propostas` | [ ] | [ ] | [ ] |
| P1 | `/hangar`, `/fcu-assembly`, `/cadastro-trial` | [ ] | [ ] | [ ] |
| P2 | Demais rotas axe (spot-check 10 rotas/release) | [ ] | [ ] | [ ] |

## B.4 Locales (ideal 100% humano)

- [ ] pt-BR — completo
- [ ] en-US — rotas P0
- [ ] es-ES — spot-check
- [ ] fr-FR — spot-check

## B.5 Gate Fase 1 (~95% global interno)

Marcar em [PRE-AUDITORIA-WCAG-CHECKLIST.md](./PRE-AUDITORIA-WCAG-CHECKLIST.md) §8:

- [ ] G1–G5 verdes
- [ ] Trilha A 100%
- [ ] Trilha B sem blockers P0
- [ ] Lacunas V1–V3 fechadas ou aceites documentadas
- [ ] VPAT interno datado
- [ ] **Pronto para auditor externa: Sim**

**Trilha B = 100%** quando §7 preenchido, §8 = Sim, 0 blockers documentados.

---

# TRILHA C — EXTERNA + VPAT (meta 100%)

## C.1 Contratar auditoria (Fase 2)

1. [ ] Enviar [RFP-FASE2-AUDITORIA-WCAG.md](./wcag-evidencias/RFP-FASE2-AUDITORIA-WCAG.md) a 2–3 fornecedores
2. [ ] Credenciais: [CREDENCIAIS-AUDITORIA-HOMOLOG.example.md](./wcag-evidencias/CREDENCIAIS-AUDITORIA-HOMOLOG.example.md)
3. [ ] Receber propostas até **11/jul/2026** (ou data actualizada)
4. [ ] Selecionar fornecedor (critérios §7 RFP)
5. [ ] Janela de teste 15–20 dias úteis

## C.2 Remediação pós-relatório

| Severidade | Acção | Prazo |
|------------|--------|-------|
| Blocker | Corrigir antes de VPAT | Imediato |
| Major | Mesmo ciclo release | Sprint actual |
| Minor | Backlog priorizado | Próximos releases |

- [ ] Re-correr `npm run a11y:gate` após cada correção
- [ ] Re-teste manual nos fluxos afectados

## C.3 VPAT 2.5 comercial (Fase 3)

- [ ] Emitir VPAT 2.5 (formato ITI) com base no relatório externo
- [ ] Declaração de acessibilidade PT em aerosuite.com.br
- [ ] Actualizar [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md)
- [ ] Anexar relatório + evidências NVDA (ZIP fornecedor)

## C.4 Manutenção (Fase 4)

- [ ] Política: PR bloqueado se axe/flow falhar
- [ ] Amostra manual 6 rotas P0 a cada release (15 min)
- [ ] Re-auditoria semestral ou após refactor UI legado

**Trilha C = 100%** quando VPAT 2.5 publicado + declaração PT + processo Fase 4 activo.

---

# VERIFICAÇÃO RÁPIDA

```bash
# Trilha A agora?
cd frontend && npm run a11y:gate && type ..\docs\wcag-evidencias\gate-codigo-latest.json

# Percentagem global estimada (referência):
#   global = (A% × 0.35) + (B% × 0.25) + (C% × 0.40)
#   Jun/2026 típico: A≈100%, B≈0%, C≈5% → ~37% global
#   Após B completa: A=100%, B=100%, C=5% → ~60%
#   Após auditoria: A=100%, B=100%, C=70% → ~82%
#   Certificação comercial: C=100% → ~100%
```

---

## Documentos relacionados

| Documento | Uso |
|-----------|-----|
| [WCAG-CERTIFICACAO-ROTEIRO.md](./WCAG-CERTIFICACAO-ROTEIRO.md) | Fases 1–4 resumidas |
| [PRE-AUDITORIA-WCAG-CHECKLIST.md](./PRE-AUDITORIA-WCAG-CHECKLIST.md) | Checklist operacional |
| [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md) | VPAT interno |
| [wcag-evidencias/README.md](./wcag-evidencias/README.md) | Artefactos JSON |

---

*Última revisão: junho/2026*
