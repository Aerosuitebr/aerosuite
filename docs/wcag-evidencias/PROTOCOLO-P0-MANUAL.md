# Protocolo manual P0 — WCAG 2.2 AA (gate auditor externa)

Complementa `npm run a11y:axe` (52 rotas) e `npm run a11y:flow-p0` (F1/F4/F6/F12 estrutural).  
**Obrigatório:** teste com **teclado** e **leitor de tela** (NVDA no Windows ou VoiceOver no macOS).

---

## Pré-requisitos

| Item | Comando / nota |
|------|----------------|
| Build | `cd frontend && npm run build` |
| Axe 52/52 | `npm run a11y:axe` |
| Fluxo P0 automatizado | `npm run a11y:flow-p0` |
| Ambiente | Staging ou local com tenant demo + dados realistas |
| Locales | Repetir amostra em **pt-BR** (mínimo); ideal: en-US, es-ES, fr-FR |
| Registo | [SESSAO-P0-MANUAL-TEMPLATE.md](./SESSAO-P0-MANUAL-TEMPLATE.md) → copiar para §7 de [PRE-AUDITORIA-WCAG-CHECKLIST.md](../PRE-AUDITORIA-WCAG-CHECKLIST.md) |
| Ambiente homolog | `https://app.aerosuite.com.br` · tenant `default` · [credenciais modelo](./CREDENCIAIS-AUDITORIA-HOMOLOG.example.md) |

---

## Rotas P0 — amostra manual (⌨ + 🔊)

Percorrer **uma ação principal + um modal/dropdown** em cada rota:

| Rota | Foco manual |
|------|-------------|
| `/login` | Foco inicial no email; erro de credencial anunciado |
| `/os` | F1 abaixo |
| `/estoque/itens` | Tabela: cabeçalhos, paginação Tab, filtro |
| `/configuracoes` | Accordion jump-nav; modal instalação |
| `/propostas-comerciais` | F4 abaixo |
| `/externo/propostas` | Aprovar/rejeitar se disponível |

---

## F1 — Abrir / editar OS

**Rota:** `/os`

### Teclado (⌨)

1. Tab até o botão **Nova OS** → Enter abre o modal.
2. Tab percorre campos na ordem visual (número OS → cliente → FCU…).
3. **Shift+Tab** regressa sem perder foco visível.
4. **Esc** fecha o modal; foco regressa ao botão que abriu.
5. Abrir OS existente (ícone lápis): mesmo fluxo; botão **Salvar** alcançável por Tab.

### Leitor de tela (🔊)

1. Modal anunciado com título (Nova / Editar / Visualizar).
2. Cada campo técnico tem **nome** (label ou `aria-labelledby`).
3. Erros de validação descritos em texto (não só cor).

### Evidência

- [ ] Passou ⌨
- [ ] Passou 🔊
- Notas: _____________________

---

## F4 — Editor proposta comercial

**Rota:** `/propostas-comerciais/new` ou `/propostas-comerciais/:id`

### Teclado (⌨)

1. Tab até abas (Produtos / Cliente / …); **setas** ou Tab mudam painel.
2. Totais e desconto alcançáveis sem rato.
3. Botões de ação (salvar, aprovar) com rótulo visível.

### Leitor de tela (🔊)

1. Abas anunciadas com nome (não só ícone).
2. **Total geral** anunciado (`caption` sr-only / região `aria-live` na tabela de totais).
3. Cores de acento do tenant legíveis (contraste AA no painel, não só no PDF).

### Evidência

- [ ] Passou ⌨
- [ ] Passou 🔊
- Notas: _____________________

---

## F6 — Diálogos de confirmação (OS / estoque)

**Gatilhos:** excluir/inativar OS, remover anexo, movimentação estoque com confirmação.

### Teclado (⌨)

1. Tab até **Aceitar** e **Cancelar**; Enter activa.
2. **Esc** fecha e devolve foco ao elemento que abriu o diálogo.
3. Sem armadilha de foco dentro do overlay.

### Leitor de tela (🔊)

1. Título do diálogo traduzido (não chave `confirm.header.*` crua).
2. Mensagem lida na íntegra.
3. Botões com nome (Sim, remover / Cancelar).

### Evidência

- [ ] Passou ⌨
- [ ] Passou 🔊
- Notas: _____________________

---

## F12 — Toast / erro API

**Gatilho:** forçar erro (403, rede, validação).

### Como reproduzir

| Método | Passos |
|--------|--------|
| **DevTools** | Network → Offline → tentar salvar OS/proposta |
| **Staging** | Usuário sem permissão → acção bloqueada |
| **Automatizado** | `npm run a11y:flow-p0` (mock 401 em POST `/api/auth/login` → mensagem `login.error.invalidCredentials`) |

### Critérios

1. Toast visível com **texto** (summary + detail se houver).
2. Mensagem **i18n** ou mapeada (`extractApiErrorMessage` / `translateApiError`) — não JSON cru nem `i18n:chave` visível.
3. Leitor de tela anuncia alerta (`role="alert"` ou live region).

### Evidência

- [ ] Passou ⌨ (toast não bloqueia Tab permanentemente)
- [ ] Passou 🔊
- Notas: _____________________

---

## Gate — marcar “Pronto para auditor externa”

Só marcar **Sim** em [PRE-AUDITORIA-WCAG-CHECKLIST.md](../PRE-AUDITORIA-WCAG-CHECKLIST.md) §8 quando:

- G1–G5 verdes
- 52/52 axe + `a11y:flow-p0` 4/4
- F1, F4, F6, F12 manuais sem blocker
- Lacunas V1–V3 fechadas ou aceites documentadas
- VPAT interno datado

**Próximo passo:** enviar [RFP-FASE2-AUDITORIA-WCAG.md](./RFP-FASE2-AUDITORIA-WCAG.md) a 2–3 fornecedores.

---

*Última revisão: junho/2026*
