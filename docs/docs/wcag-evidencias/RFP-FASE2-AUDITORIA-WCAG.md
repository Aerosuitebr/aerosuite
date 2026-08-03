# RFP — Auditoria externa WCAG 2.2 AA (Fase 2)

**Emitente:** Aero Suite / Lyra Informática  
**Data:** 9 de junho de 2026  
**Contacto comercial:** comercial@aerosuite.com.br  
**Contacto técnico (acesso ambiente):** wellemlyra@aerosuite.com.br  
**Resposta até:** 11 de julho de 2026  
**Validade da proposta:** 60 dias

---

## 1. Objectivo

Contratar auditoria independente de **acessibilidade digital** do produto **Aero Suite** (portal interno + portal externo cliente), com entrega de relatório WCAG **2.2 nível AA** e base para **VPAT 2.5** (formato ITI).

**Estado pré-auditoria (baseline interna):**

- Axe smoke automatizado: **52 rotas**, 0 violações critical/serious (`npm run a11y:axe`)
- Fluxos P0 estruturais: F1, F4, F6, F12 (`npm run a11y:flow-p0`)
- VPAT interno: [VPAT-WCAG-INTERNO.md](../VPAT-WCAG-INTERNO.md)
- Lacunas conhecidas: [PRE-AUDITORIA-WCAG-CHECKLIST.md](../PRE-AUDITORIA-WCAG-CHECKLIST.md) §5

---

## 2. Escopo técnico

### 2.1 Aplicações

| Aplicação | Stack | URLs (homologação) |
|-----------|-------|-------------------|
| Portal interno | Angular 18 SPA, PrimeNG | `https://app.aerosuite.com.br/` |
| Portal externo | Angular 18 SPA | `https://app.aerosuite.com.br/externo` |
| API REST | Quarkus (mesma origem) | `https://app.aerosuite.com.br/api` |
| Staging K8s (alternativo) | Helm `values-staging.yaml` | `https://staging.aerosuite.app` |

**Tenant de teste:** `default` (dados fictícios após `db/scripts/sanitize-demo-tenant-homologacao.sql`).  
**Commit de referência (baseline axe/flow-p0):** `586cb45` _(atualizar no envio se houver release posterior)_.

### 2.2 Locales

Interface em **4 idiomas:** pt-BR (primário), en-US, es-ES, fr-FR.  
Amostragem mínima: **pt-BR completo** + spot-check en-US nas rotas P0.

### 2.3 Amostragem de rotas (52 + fluxos)

**Automatizado já coberto (confirmar amostra):** lista em `frontend/scripts/a11y-axe-smoke.mjs`.

**Fluxos profundos obrigatórios (manual):**

| ID | Fluxo |
|----|-------|
| F1 | Abrir / editar OS |
| F2 | Job card / hangar |
| F3 | Editor FCU / assembly |
| F4 | Editor proposta comercial |
| F5 | Imprimir / PDF proposta |
| F6 | Confirm dialogs |
| F7–F12 | Ver [PROTOCOLO-P0-MANUAL.md](./PROTOCOLO-P0-MANUAL.md) |

### 2.4 Dispositivos / browsers

- Desktop: **Chrome** + **Firefox** (últimas versões estáveis)
- Leitor de tela: **NVDA** (Windows) — obrigatório; VoiceOver (macOS) desejável
- Zoom **200%** e viewport **1280×800** mínimo

### 2.5 Fora de escopo (salvo acordo)

- Apps mobile nativas
- PDFs gerados pelo servidor (amostra F5 apenas)
- Conteúdo editorial do site marketing aerosuite.com.br

---

## 3. Entregáveis

| # | Entregável | Formato |
|---|------------|---------|
| E1 | Relatório de conformidade WCAG 2.2 AA | PDF + planilha (critério × página × severidade) |
| E2 | Lista de issues (blocker / major / minor / best practice) | CSV ou XLSX |
| E3 | Capturas e gravações NVDA (amostra P0) | ZIP |
| E4 | Sumário executivo (PT) | 2–3 páginas |
| E5 | Recomendações para VPAT 2.5 | Anexo técnico |
| E6 | Sessão de handoff (1h) | Videoconferência |

**Prazo desejado:** 15–20 dias úteis após acesso ao ambiente.

---

## 4. Critérios de severidade (alinhamento)

| Nível | Definição | Acção pós-auditoria |
|-------|-----------|-------------------|
| Blocker | Impede uso por teclado ou leitor de tela; violação AA clara | Corrigir antes de VPAT comercial |
| Major | Dificulta uso; AA em cenário frequente | Corrigir no mesmo ciclo de release |
| Minor | Inconveniente; AA marginal ou AAA | Backlog priorizado |
| Best practice | Melhoria | Opcional |

---

## 5. Acesso e dados

| Item | Detalhe |
|------|---------|
| Ambiente principal | `https://app.aerosuite.com.br` — piloto de homologação (dados sanitizados, sem PII real) |
| Ambiente alternativo | `https://staging.aerosuite.app` — cluster K8s (disponibilidade a confirmar com TI) |
| Tenant | `default` |
| Sanitização | Executar `sanitize-demo-tenant-homologacao.sql` antes do início da auditoria |
| Credenciais | Fornecidas em canal seguro após NDA — modelo: [CREDENCIAIS-AUDITORIA-HOMOLOG.example.md](./CREDENCIAIS-AUDITORIA-HOMOLOG.example.md) |
| Contas previstas | `wcag-auditor@aerosuite.com.br` (perfil = admin, script `provision-wcag-auditor-homologacao.sql`); opcional restrito/externo |
| MFA (TOTP) | Implementado no produto; contas de auditoria serão provisionadas **sem MFA obrigatório** |
| E-mail em staging | `MAIL_MOCK=true` no overlay staging — notificações não disparam e-mail real |
| Contacto técnico | wellemlyra@aerosuite.com.br |
| Janela de acesso | Seg–Sex, 9h–18h BRT (ajustável) |

---

## 6. Proposta solicitada

Fornecedor deve enviar:

1. **Valor fixo** ou faixa (BRL), discriminando re-audit parcial
2. **Cronograma** e equipa (perfil: CPACC/WAS ou equivalente)
3. **Metodologia** (WCAG-EM, ferramentas, % manual vs automático)
4. **Referências** (2 projetos SaaS / enterprise)
5. **Idioma do relatório** (PT obrigatório; EN opcional)
6. **Garantia** de confidencialidade (NDA se necessário)

---

## 7. Critérios de selecção

| Peso | Critério |
|------|----------|
| 40% | Experiência WCAG 2.2 + Angular/SPA |
| 25% | Qualidade de relatórios anteriores (amostra) |
| 20% | Prazo e clareza de remediação |
| 15% | Custo total |

---

## 8. Pós-auditoria (Aero Suite)

1. Remediar **blockers** e **majors**
2. Actualizar [VPAT-WCAG-INTERNO.md](../VPAT-WCAG-INTERNO.md)
3. Emitir VPAT 2.5 comercial ([WCAG-CERTIFICACAO-ROTEIRO.md](../WCAG-CERTIFICACAO-ROTEIRO.md) Fase 3)
4. Regressão: `a11y:axe` + `a11y:flow-p0` no CI

---

## Anexo A — Comandos de evidência interna

```bash
cd frontend
npm run build
npm run a11y:axe          # 52 rotas
npm run a11y:flow-p0      # F1 F4 F6 F12
node ../scripts/wcag-report.mjs
```

Artefactos: `docs/wcag-evidencias/axe-baseline-latest.json`

---

## Anexo B — Sessão manual P0 (pré-requisito interno)

Antes do envio deste RFP, a equipa interna deve concluir teclado + NVDA conforme [SESSAO-P0-MANUAL-TEMPLATE.md](./SESSAO-P0-MANUAL-TEMPLATE.md) e registar §7 do [checklist](../PRE-AUDITORIA-WCAG-CHECKLIST.md).

---

*Documento preparado para envio — revisar commit de referência e credenciais no momento da contratação.*
