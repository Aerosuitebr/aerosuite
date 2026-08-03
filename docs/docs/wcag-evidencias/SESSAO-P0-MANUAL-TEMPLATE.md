# Sessão manual P0 — template §7 (teclado + NVDA)

Use este ficheiro como **roteiro executável** e copie o resultado final para [PRE-AUDITORIA-WCAG-CHECKLIST.md](../PRE-AUDITORIA-WCAG-CHECKLIST.md) §7.

**Baseline automatizada (preencher antes da sessão manual):**

| Campo | Valor |
|-------|-------|
| Data da sessão | _YYYY-MM-DD_ |
| Build / commit | `586cb45` _(atualizar: `git rev-parse --short HEAD`)_ |
| Axe 52/52 | OK — `cd frontend && npm run a11y:axe` |
| Flow P0 4/4 | OK — `cd frontend && npm run a11y:flow-p0` |
| Ambiente | `https://app.aerosuite.com.br` · tenant `default` |
| Sanitização tenant | `mysql … < db/scripts/sanitize-demo-tenant-homologacao.sql` _(recomendado)_ |

---

## A. Preparar NVDA (Windows)

1. Instalar [NVDA](https://www.nvaccess.org/download/) (última estável).
2. **Iniciar NVDA** antes de abrir o browser (`Ctrl+Alt+N` se já estiver em execução).
3. Browser: **Chrome** ou **Edge** (última estável), zoom **100%**, janela **1280×800** ou superior.
4. Aero Suite: idioma **pt-BR** (seletor de bandeiras no login).
5. Credenciais (recomendado): `wcag-auditor@aerosuite.com.br` / tenant `default`  
   _(provisionar: `db/scripts/provision-wcag-auditor-homologacao.sql` — mesmo acesso que admin)_  
   Alternativa: `admin@aerosuite.com` · ver [CREDENCIAIS-AUDITORIA-HOMOLOG.example.md](./CREDENCIAIS-AUDITORIA-HOMOLOG.example.md).
6. Fechar toasts/modais pendentes; não usar extensões que alterem o DOM (tradutores automáticos).

**Atalhos úteis durante o teste:**

| Atalho | Acção |
|--------|--------|
| `Tab` / `Shift+Tab` | Próximo / anterior focável |
| `Enter` | Activar botão / link |
| `Esc` | Fechar modal / confirm |
| `Insert+F7` | Lista de elementos (landmarks, botões, campos) |
| `NVDA+Tab` | Foco actual anunciado |

---

## B. Rotas P0 — amostra (⌨ + 🔊)

Marque **OK** ou **BLOCKER** em cada rota. Em blocker, descreva o que o NVDA disse vs. o esperado.

| Rota | ⌨ | 🔊 | Blocker? | Notas |
|------|---|---|----------|-------|
| `/login` | [ ] | [ ] | [ ] | Foco inicial no email; erro credencial anunciado (F12) |
| `/os` | [ ] | [ ] | [ ] | Ver secção C — F1 |
| `/estoque/itens` | [ ] | [ ] | [ ] | Tabela: `<th>`, paginação Tab, filtro |
| `/configuracoes` | [ ] | [ ] | [ ] | Accordion jump-nav; modal instalação |
| `/propostas-comerciais` | [ ] | [ ] | [ ] | Ver secção C — F4 |
| `/externo/propostas` | [ ] | [ ] | [ ] | Login externo; aprovar/rejeitar se disponível |

---

## C. Fluxos P0 — passo a passo

### F1 — Abrir / editar OS (`/os`)

**⌨ Teclado**

1. `Tab` até **Nova OS** → `Enter` → modal abre.
2. `Tab` percorre campos (número → cliente → FCU…) na ordem visual.
3. `Shift+Tab` regressa; foco sempre visível (`:focus-visible`).
4. `Esc` fecha modal; foco volta ao botão **Nova OS**.
5. Abrir OS existente (ícone lápis) → `Tab` até **Salvar** alcançável.

**🔊 NVDA**

1. Modal anunciado com título (Nova / Editar / Visualizar).
2. Cada campo com **nome** (label, não só placeholder).
3. Erros de validação em **texto** (não só cor vermelha).

| Critério | OK | Notas |
|----------|----|-------|
| ⌨ F1 | [ ] | |
| 🔊 F1 | [ ] | |

---

### F4 — Editor proposta (`/propostas-comerciais` → abrir proposta)

**⌨ Teclado**

1. `Tab` até abas (Produtos, Cliente, …); `ArrowRight` / `Tab` muda painel.
2. Totais e desconto alcançáveis sem rato.
3. Botões Salvar / acções com rótulo visível.

**🔊 NVDA**

1. Abas com nome (não só ícone).
2. **Total geral** anunciado (região `aria-live` / `caption` sr-only nos totais).
3. Contraste AA no painel (não só no PDF).

| Critério | OK | Notas |
|----------|----|-------|
| ⌨ F4 | [ ] | |
| 🔊 F4 | [ ] | |

---

### F6 — Confirm dialog (`/os` → excluir/inativar)

**⌨ Teclado**

1. `Tab` até botão excluir → `Enter` → diálogo abre.
2. `Tab` entre **Aceitar** e **Cancelar**; `Enter` activa.
3. `Esc` fecha; foco regressa ao botão que abriu.
4. Sem armadilha de foco no overlay.

**🔊 NVDA**

1. Título traduzido (não `confirm.header.*` cru).
2. Mensagem lida na íntegra.
3. Botões com nome (Sim, remover / Cancelar).

| Critério | OK | Notas |
|----------|----|-------|
| ⌨ F6 | [ ] | |
| 🔊 F6 | [ ] | |

---

### F12 — Erro API / login (`/login`)

**Reproduzir (escolher um):**

| Método | Passos |
|--------|--------|
| **Credencial inválida** | Email válido + senha errada → `Enter` |
| **DevTools offline** | F12 → Network → Offline → salvar OS/proposta autenticado |
| **Sem permissão** | Conta com role restrito → acção bloqueada (403) |

**⌨** Toast/erro não bloqueia `Tab` permanentemente.

**🔊** Mensagem i18n anunciada (`role="alert"` ou live region); sem JSON cru nem `i18n:chave` visível.

| Critério | OK | Notas |
|----------|----|-------|
| ⌨ F12 | [ ] | |
| 🔊 F12 | [ ] | Texto ouvido: _________________ |

---

## D. Registo §7 — copiar para o checklist

Preencha após concluir B + C. Só marque **Pronto para auditor externa: Sim** se **não houver blockers**.

```markdown
| Campo | Valor |
|-------|-------|
| Data | YYYY-MM-DD |
| Tester | Nome |
| SO / Browser | ex.: Windows 11 + Chrome 131 |
| Leitor de tela | ex.: NVDA 2024.4.2 |
| Build / commit | 586cb45 |
| Locales testados | pt-BR · [ ] en-US · [ ] es-ES · [ ] fr-FR |
| Axe local (52/52) | OK |
| Flow P0 (`a11y:flow-p0`) | OK |
| Blockers encontrados | (nenhum / listar) |
| Pronto para auditor externa? | Sim / Não — motivo |
```

**Checklist §8 — quando marcar Sim:**

- [ ] G1–G5 verdes
- [ ] 52 axe + flow-p0 4/4
- [ ] Rotas P0 §B sem blocker ⌨+🔊
- [ ] F1, F4, F6, F12 §C sem blocker
- [ ] Lacunas V1–V3 fechadas ou aceites documentadas
- [ ] VPAT interno datado

---

## E. Evidências opcionais (anexar à pasta `wcag-evidencias/`)

| Ficheiro sugerido | Conteúdo |
|-------------------|----------|
| `nvda-f1-os-modal.txt` | Notas + hora |
| `nvda-f4-proposta-totais.txt` | Frase ouvida no total |
| `nvda-f6-confirm.txt` | Título do diálogo |
| `nvda-f12-erro-login.png` | Screenshot do erro i18n |
| `sessao-p0-YYYY-MM-DD.json` | Export estruturado (opcional) |

---

*Última revisão: junho/2026 · Relacionado: [PROTOCOLO-P0-MANUAL.md](./PROTOCOLO-P0-MANUAL.md), [RFP-FASE2-AUDITORIA-WCAG.md](./RFP-FASE2-AUDITORIA-WCAG.md)*
