# Checklist pré-auditoria WCAG 2.2 AA — Aero Suite

Documento operacional para preparar **auditoria externa** ou **autoavaliação rigorosa** antes de emitir VPAT comercial.

**Alvo:** WCAG 2.2 nível **AA** · Angular 18 · portal interno + externo  
**Relacionados:** [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md) · [AUDITORIA-UX-UI-PREMIUM.md](./AUDITORIA-UX-UI-PREMIUM.md)  
**Fonte das 52 rotas:** `frontend/scripts/a11y-axe-smoke.mjs`

---

## Como usar

1. **Automatizado primeiro** — garantir baseline verde no CI local.
2. **Manual por rota** — marcar colunas abaixo (⌨ teclado, 🔊 leitor de tela, 🌓 modo escuro, 📱 zoom 200%).
3. **Fluxos profundos** — secção 4 (fora do axe de lista).
4. **Lacunas VPAT** — secção 5 com prioridade antes de contratar auditor.
5. **Registo** — preencher secção 7 (data, tester, browser, SO).

**Legenda de status:** `[ ]` pendente · `[x]` OK · `[~]` parcial · `[!]` blocker

---

## 1. Pré-requisitos (gate zero)

| # | Item | Cmd / evidência | Status |
|---|------|-----------------|--------|
| G1 | Build de produção sem erro | `cd frontend && npm run build` | [ ] |
| G2 | Axe smoke 52/52 sem critical/serious | `npm run a11y:axe` | [x] |
| G2b | Flow full 12/12 estrutural | `npm run a11y:flow-full` | [x] |
| G2c | Gate código 100% | `npm run a11y:gate` | [x] |
| G3 | LCP smoke nas rotas pesadas | `npm run perf:lcp` | [ ] |
| G4 | Testes unitários core | `npm run test:unit` | [ ] |
| G5 | VPAT interno lido e lacunas conhecidas anotadas | [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md) | [ ] |

Saída esperada do axe: **52 linhas `axe OK`**. Se falhar, corrigir antes de auditoria manual. Baseline JSON: `node scripts/wcag-report.mjs` → `docs/wcag-evidencias/`.

---

## 2. Ferramentas recomendadas

| Ferramenta | Uso |
|------------|-----|
| **NVDA** (Windows) ou **VoiceOver** (macOS) | Navegação por landmarks, nomes de botões, tabelas |
| **Só teclado** | Tab / Shift+Tab / Enter / Esc / setas em menus e datatables |
| **Zoom 200%** (browser ou SO) | Reflow sem perda de conteúdo (1.4.10) |
| **Modo escuro** | Configurações → Aparência → tema escuro |
| **4 locales** | pt-BR, en-US, es-ES, fr-FR — labels visíveis e `aria-label` |
| **Chrome DevTools → Accessibility** | Árvore ARIA, contraste pontual |

---

## 3. Rotas axe (52) — checklist manual

Para cada rota: abrir após login (ou como anónimo), percorrer **hero + primeira ação principal + um modal/dropdown se existir**.

Colunas: **Axe** (CI) · **⌨** · **🔊** · **🌓** · **Notas**

### 3.1 Portal interno — público (6)

| Rota | Descrição | Axe | ⌨ | 🔊 | 🌓 | Notas |
|------|-----------|-----|---|----|----|-------|
| `/` | Landing / redirect não autenticado | [ ] | [ ] | [ ] | [ ] | |
| `/login` | Login interno | [ ] | [ ] | [ ] | [ ] | Foco inicial no email; erro de credencial anunciado |
| `/forgot-password` | Recuperação de senha | [ ] | [ ] | [ ] | [ ] | |
| `/cadastro-trial` | Signup trial self-service | [ ] | [ ] | [ ] | [ ] | Formulário LGPD |
| `/termos` | Termos de uso | [ ] | [ ] | [ ] | [ ] | |
| `/privacidade` | Política de privacidade | [ ] | [ ] | [ ] | [ ] | |

### 3.2 Portal interno — autenticado (41)

| Rota | Descrição | Axe | ⌨ | 🔊 | 🌓 | Notas |
|------|-----------|-----|---|----|----|-------|
| `/` (home autenticado) | Dashboard / menu | [ ] | [ ] | [ ] | [ ] | |
| `/os` | Lista de ordens de serviço | [ ] | [ ] | [ ] | [ ] | **VPAT:** fluxos legado — ver §4 |
| `/estoque/itens` | Itens de estoque | [ ] | [ ] | [ ] | [ ] | |
| `/estoque/invoices` | Invoices / importação | [ ] | [ ] | [ ] | [ ] | |
| `/estoque/lotes` | Lotes | [ ] | [ ] | [ ] | [ ] | |
| `/configuracoes` | Configurações sistema | [ ] | [ ] | [ ] | [ ] | Accordion jump-nav; modal instalação |
| `/propostas-comerciais` | Lista propostas | [ ] | [ ] | [ ] | [ ] | |
| `/templates-proposta` | Templates comercial | [ ] | [ ] | [ ] | [ ] | |
| `/chat` | Chat interno | [ ] | [ ] | [ ] | [ ] | |
| `/biblioteca` | Biblioteca documentos | [ ] | [ ] | [ ] | [ ] | |
| `/fcu-assembly` | FCU assembly | [ ] | [ ] | [ ] | [ ] | **VPAT:** editor legado — ver §4 |
| `/associacao-fcu` | Associação FCU | [ ] | [ ] | [ ] | [ ] | |
| `/relatorios` | Relatórios | [ ] | [ ] | [ ] | [ ] | |
| `/usuarios` | Usuários | [ ] | [ ] | [ ] | [ ] | |
| `/products` | Produtos / PN | [ ] | [ ] | [ ] | [ ] | |
| `/organizacoes` | Organizações / tenants | [ ] | [ ] | [ ] | [ ] | |
| `/auditoria-acesso` | Auditoria de acesso | [ ] | [ ] | [ ] | [ ] | Tabelas densas |
| `/capacidade` | Quadro capacidade | [ ] | [ ] | [ ] | [ ] | |
| `/controle-acesso` | Controle de acesso | [ ] | [ ] | [ ] | [ ] | |
| `/fabricantes` | Fabricantes | [ ] | [ ] | [ ] | [ ] | |
| `/perfis` | Perfis RBAC | [ ] | [ ] | [ ] | [ ] | |
| `/funcionalidades` | Funcionalidades | [ ] | [ ] | [ ] | [ ] | |
| `/suporte` | Suporte / chamados | [ ] | [ ] | [ ] | [ ] | |
| `/aero/diretrizes` | AD/SB diretrizes | [ ] | [ ] | [ ] | [ ] | |
| `/publicacoes-tecnicas/associar-pn` | Associar PN | [ ] | [ ] | [ ] | [ ] | |
| `/capacidade/hangares` | Hangares (capacidade) | [ ] | [ ] | [ ] | [ ] | |
| `/hangar` | Job card / hangar móvel | [ ] | [ ] | [ ] | [ ] | **VPAT:** F2 — botões ícone |
| `/conformidade/painel` | Painel qualidade SGQ | [ ] | [ ] | [ ] | [ ] | |
| `/conformidade/documentos` | Documentos controlados | [ ] | [ ] | [ ] | [ ] | |
| `/conformidade/treinamentos` | Treinamentos | [ ] | [ ] | [ ] | [ ] | |
| `/conformidade/calibracao` | Calibração | [ ] | [ ] | [ ] | [ ] | |
| `/conformidade/nao-conformidades` | NC / CAPA | [ ] | [ ] | [ ] | [ ] | |
| `/conformidade/subcontratacao` | Subcontratação / ASL | [ ] | [ ] | [ ] | [ ] | |
| `/conformidade/contingencia` | Contingência / reconciliação | [ ] | [ ] | [ ] | [ ] | |
| `/conformidade/releases` | Aceite de releases | [ ] | [ ] | [ ] | [ ] | |
| `/conformidade/treinamentos-obrigatorios` | Treinamentos obrigatórios | [ ] | [ ] | [ ] | [ ] | |
| `/conformidade/habilitacoes` | Habilitações técnicas | [ ] | [ ] | [ ] | [ ] | |
| `/dossie-auditoria` | Dossiê de auditoria | [ ] | [ ] | [ ] | [ ] | |
| `/go-live-migracao` | Kit go-live (30 dias) | [ ] | [ ] | [ ] | [ ] | |
| `/os-auditoria` | Auditoria de alterações OS | [ ] | [ ] | [ ] | [ ] | |
| `/settings/backup` | Backup / restore BD | [ ] | [ ] | [ ] | [ ] | |

### 3.3 Portal externo (5)

| Rota | Descrição | Axe | ⌨ | 🔊 | 🌓 | Notas |
|------|-----------|-----|---|----|----|-------|
| `/externo/login` | Login cliente | [ ] | [ ] | [ ] | [ ] | |
| `/externo` | Home portal cliente | [ ] | [ ] | [ ] | [ ] | |
| `/externo/os` | OS do cliente | [ ] | [ ] | [ ] | [ ] | |
| `/externo/documentos` | Documentos | [ ] | [ ] | [ ] | [ ] | |
| `/externo/propostas` | Propostas portal | [ ] | [ ] | [ ] | [ ] | Aprovar/rejeitar se disponível |

---

## 4. Fluxos fora do axe (obrigatório pré-auditoria)

O smoke axe analisa **shell da rota** com API mock — **não** cobre editores, wizards multi-step nem diálogos destrutivos.

| # | Fluxo | Rotas / gatilho | Critérios WCAG foco | Status |
|---|-------|-----------------|---------------------|--------|
| F1 | **Abrir / editar OS** | `/os` → abrir OS existente ou nova | Foco preso em modal; ordem Tab; labels campos técnicos | [x] flow-p0 · [ ] NVDA ([protocolo](./wcag-evidencias/PROTOCOLO-P0-MANUAL.md)) |
| F2 | **Job card / hangar** | OS → hangar / apontamento | Botões só ícone com `aria-label` i18n | [x] flow-full · [ ] NVDA |
| F3 | **Editor FCU / assembly** | `/fcu-assembly` → editar | Leitor de tela em grids; contraste modo escuro | [x] flow-full · [ ] NVDA |
| F4 | **Editor proposta comercial** | `/propostas-comerciais` → nova/editar | Tabs acessíveis; totais anunciados; **cores fixas UI** (VPAT gap) | [x] flow-p0 · [ ] NVDA |
| F5 | **Imprimir / PDF proposta** | Preview → imprimir | Conteúdo impresso legível (contraste); não depende só de cor | [x] flow-full · [ ] NVDA/PDF |
| F6 | **Confirm dialogs OS/estoque** | Excluir, cancelar, movimentação | Título + botões com nome; Esc fecha; foco inicial seguro | [x] flow-p0 · [ ] NVDA |
| F7 | **Dropdowns PrimeNG** | Configurações, filtros listas | Setas + Enter; opção selecionada anunciada | [x] flow-full · [ ] NVDA |
| F8 | **Datatable paginação** | Estoque, OS, usuários | Cabeçalhos `<th>`; sort anunciado; página atual | [x] flow-full · [ ] NVDA |
| F9 | **Upload anexo** | OS, proposta, biblioteca | Input file com label; erro de tamanho/tipo i18n | [x] flow-full · [ ] NVDA |
| F10 | **Cadastro trial / LGPD** | `/cadastro-trial`, `/termos`, `/privacidade` | Formulário público; checkboxes legais | [x] flow-full · [ ] NVDA |
| F11 | **Troca de idioma** | Menu usuário / settings | Conteúdo visível muda; `lang` ou locale coerente | [x] flow-full · [ ] NVDA |
| F12 | **Toast / erro API** | Login inválido / 403 / rede off | Mensagem não só cor; texto i18n ou mapeado | [x] flow-p0 (401 login) · [ ] NVDA + offline manual |

---

## 5. Lacunas VPAT — plano de fecho

Itens documentados em [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md) com critérios WCAG típicos.

| ID | Lacuna | Critérios WCAG | Ação sugerida | Prioridade | Status |
|----|--------|----------------|---------------|------------|--------|
| V1 | Rotas legado OS/FCU sem teste leitor de tela completo | 2.1.1, 2.4.3, 4.1.2 | Executar §4 F1–F3 com NVDA; corrigir blockers | **P0** | [ ] |
| V2 | Mensagens API cruas em fluxos legado | 3.3.1, 3.3.3 | Mapear `backend-i18n` / `translateBackendI18nMessage` | **P0** | [~] login/OS usam `extractApiErrorMessage`; flow-p0 F12 OK; validar 🔊 manual |
| V3 | Editor proposta — acentos brand fixos (UI) | 1.4.3, 1.4.11 | CSS vars `--proposta-brand-primary` ligadas ao tenant | **P1** | [~] em curso |
| V4 | Certificação externa inexistente | — | Contratar auditoria após V1–V3 | **P2** | [ ] |
| V5 | Modo escuro incompleto em editores densos | 1.4.3 | `_premium-a11y.scss` dark; validar OS/FCU manual 🌓 | **P1** | [~] código base |

---

## 6. WCAG 2.2 AA — amostragem por princípio

Usar como guia na auditoria manual (não substitui lista oficial W3C).

### 1 — Perceivable

| Critério | Pergunta no Aero Suite | Evidência |
|----------|------------------------|-----------|
| **1.1.1** Texto alternativo | Ícones PrimeNG (`pi-*`) têm nome? Logos com `alt`? | Inspecionar botões só ícone |
| **1.3.1** Info e relações | Tabelas com `<th>`; labels em inputs PrimeNG | DevTools a11y tree |
| **1.4.3** Contraste (AA) | Texto normal ≥ 4,5:1; grande ≥ 3:1 | axe + Colour Contrast Analyser |
| **1.4.11** Contraste não-texto | Bordas de focus, badges, toggles | Modo escuro + claro |
| **1.4.10** Reflow | Menu lateral + tabela em 320px / zoom 200% | Redimensionar janela |

### 2 — Operable

| Critério | Pergunta no Aero Suite | Evidência |
|----------|------------------------|-----------|
| **2.1.1** Teclado | Todas as acções sem rato? | Só Tab/Enter/Esc |
| **2.1.2** Sem armadilha de teclado | Modais PrimeNG libertam foco ao fechar | Abrir/fechar dialog |
| **2.4.3** Ordem de foco | Tab segue ordem visual lógica | Gravar ordem Tab |
| **2.4.7** Focus visible | `:focus-visible` global visível | [ ] |
| **2.5.3** Label in name | `aria-label` coincide com texto visível | Botões i18n |

### 3 — Understandable

| Critério | Pergunta no Aero Suite | Evidência |
|----------|------------------------|-----------|
| **3.1.1** Idioma | `<html lang>` correto por locale | 4 idiomas |
| **3.2.1** On focus | Foco não dispara submit inesperado | Forms |
| **3.3.1** Identificação erro | Campo inválido descrito em texto | Login, forms |
| **3.3.2** Labels | Todo input tem label visível ou `aria-labelledby` | Configurações |

### 4 — Robust

| Critério | Pergunta no Aero Suite | Evidência |
|----------|------------------------|-----------|
| **4.1.2** Name, role, value | Componentes PrimeNG expõem role correto | axe + NVDA |
| **4.1.3** Mensagens de status | Toasts com `role="alert"` ou live region | Disparar toast |

---

## 7. Registo de sessão de teste

> **Roteiro 100%:** [WCAG-100-PASSO-A-PASSO.md](./WCAG-100-PASSO-A-PASSO.md)  
> **Sessão NVDA:** [SESSAO-P0-MANUAL-TEMPLATE.md](./wcag-evidencias/SESSAO-P0-MANUAL-TEMPLATE.md)  
> **Ambiente:** `https://app.aerosuite.com.br` · tenant `default`

| Campo | Valor |
|-------|-------|
| Data | _preencher após sessão NVDA_ |
| Tester | |
| SO / Browser | ex.: Windows 11 + Chrome 131 |
| Leitor de tela | ex.: NVDA 2024.4.x |
| Build / commit | `586cb45` _(atualizar)_ |
| Locales testados | pt-BR · [ ] en-US · [ ] es-ES · [ ] fr-FR |
| Axe local (52/52) | **OK** (2026-06-09) |
| Flow P0 (`a11y:flow-p0`) | **OK** 4/4 |
| Flow full (`a11y:flow-full`) | **OK** 12/12 |
| Gate código (`a11y:gate`) | _executar `npm run a11y:gate`_ |
| Blockers encontrados | _preencher após manual_ |
| Pronto para auditor externa? | **Não** — pendente sessão ⌨+🔊 (§4 rotas P0 + F1/F4/F6/F12) |

---

## 8. Critério de “pronto para auditor externa”

Marcar **Sim** apenas se **todos** forem verdadeiros:

- [ ] G1–G5 (gate zero) verdes
- [ ] 52 rotas axe OK no CI **e** `npm run a11y:flow-p0` 4/4
- [ ] Amostra manual ⌨+🔊 sem blocker nas rotas P0 (`/login`, `/os`, `/estoque/itens`, `/configuracoes`, `/propostas-comerciais`, `/externo/propostas`) — [protocolo](./wcag-evidencias/PROTOCOLO-P0-MANUAL.md)
- [ ] Fluxos F1, F4, F6, F12: flow-p0 verde **e** sessão NVDA/VoiceOver documentada em §7
- [ ] Lacunas V1–V3 com plano fechado ou aceite documentado para o auditor
- [ ] VPAT interno actualizado com data e lista de excepções conhecidas

---

## 9. Próximo passo após este checklist

1. Executar [SESSAO-P0-MANUAL-TEMPLATE.md](./wcag-evidencias/SESSAO-P0-MANUAL-TEMPLATE.md) (NVDA) e actualizar §7.
2. Actualizar [VPAT-WCAG-INTERNO.md](./VPAT-WCAG-INTERNO.md) (lacunas e data).
3. Enviar [RFP-FASE2-AUDITORIA-WCAG.md](./wcag-evidencias/RFP-FASE2-AUDITORIA-WCAG.md) a 2–3 fornecedores (URLs e contactos já preenchidos).
4. Provisionar contas: [CREDENCIAIS-AUDITORIA-HOMOLOG.example.md](./wcag-evidencias/CREDENCIAIS-AUDITORIA-HOMOLOG.example.md).
5. Manter regressão: `a11y:axe` + `a11y:flow-p0` no CI a cada PR.

---

*Última revisão: junho/2026 — alinhado a `a11y-axe-smoke.mjs` e VPAT interno.*
