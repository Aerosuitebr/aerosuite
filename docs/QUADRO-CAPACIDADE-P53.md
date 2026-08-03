# P5.3 — Quadro capacidade / AOG (MVP)

Visibilidade da **fila de OS abertas** para o hangar e para o **cliente externo** (SLA simplificado), alinhado a [ROADMAP-DIFERENCIACAO-MRO.md](./ROADMAP-DIFERENCIACAO-MRO.md) (dor D8).

## Escopo MVP (implementado)

| Camada | Entrega |
|--------|---------|
| BD | Flyway `V38` — `prioridade_fila` (`NORMAL` \| `AOG`), `fila_estagio`, `data_prevista_conclusao` em `os` |
| API interna | `GET /api/capacidade/quadro`, `PUT /api/capacidade/os/{id}` |
| API externa | `GET /api/auth-externo/me/{id}/capacidade` (somente OS do cliente) |
| UI interna | `/capacidade` — colunas kanban + alterar estágio/prioridade/data prevista |
| UI externa | `/externo/capacidade` — fila e SLA das OS do cliente |
| Menu | Funcionalidade `QUADRO_CAPACIDADE` (perfis operacionais + `ORDEM_SERVICO`) |

### Estágios de fila (`fila_estagio`)

| Código | Uso |
|--------|-----|
| `AGUARDANDO` | Na fila, ainda não iniciou execução |
| `EM_EXECUCAO` | Serviço em andamento no hangar |
| `AGUARDANDO_PECAS` | Bloqueada por material |
| `INSPECAO` | Conclusão técnica / aguardando liberação |
| `CONCLUIDO` | Encerrada (não aparece no quadro de abertas) |

### SLA (MVP)

- Se `data_prevista_conclusao` estiver preenchida, usa essa data.
- Senão: **AOG** = abertura + 3 dias; **NORMAL** = abertura + 14 dias.
- Estados expostos: `OK`, `ATENCAO` (≤2 dias), `ATRASADO`.

## P5.3.4 — Sync déficit kit FCU (implementado)

- Flyway `V39` — `fila_estagio_travada` (estágio manual no quadro não é sobrescrito pelo sync).
- Ao gravar `os_kit_fcu_deficit`: com déficit → `AGUARDANDO_PECAS`; sem déficit e estágio era `AGUARDANDO_PECAS` → `EM_EXECUCAO`.
- Badge **Déficit kit FCU** no cartão do quadro e no portal externo.

## P5.3.1 — Drag-and-drop (implementado)

- `@angular/cdk/drag-drop` no `/capacidade`: arrastar cartão entre colunas → `PUT` com novo `fila_estagio` (trava manual).

## P5.3.3a — Auditoria (implementado)

- Alterações de `fila_estagio`, `prioridade_fila` e `data_prevista_conclusao` registadas em `os_auditoria`.

## P5.3.2 — Múltiplos hangares (implementado)

- Flyway `V40` — tabela `hangar` + `os.hangar_id`; seed `PRINCIPAL` por tenant; OS abertas vinculadas ao hangar principal.
- `GET /api/capacidade/hangares`, `GET /api/capacidade/quadro?hangarId=` (filtro opcional).
- UI `/capacidade`: filtro por hangar; edição do hangar no diálogo do cartão.

## P5.3.3b — Notificações in-app (implementado)

- Tipo `OS_CAPACIDADE_FILA` na tabela `notificacao` ao mudar `fila_estagio` (drag, edição ou sync de déficit).
- Destinatários: perfis operacionais do tenant (admin, diretor, gerente, qualidade, P145, operador); exclui o autor da alteração manual.

## P5.3.3c — E-mail / WhatsApp (implementado)

- Clientes externos vinculados à OS (`usuario_externo_os`): e-mail com link `/externo/capacidade`; WhatsApp se `whatsapp.api.enabled` e telefone cadastrado.
- Depende de `quarkus.mailer` configurado (mesmo padrão de propostas/tickets).

## P5.3 — Outras extensões

- **CRUD hangares:** `GET/POST/PUT /api/hangares`, UI `/capacidade/hangares`.
- **Batch:** `PUT /api/capacidade/os/batch` com lista `{ osId, filaEstagio }`.
- **Auditoria `hangar_id`** em `os_auditoria`.
- **i18n** de erros `capacidade.error.*` e `hangar.error.*` (PT/EN/ES/FR).
- **Teste unitário:** `CapacidadeFilaServiceTest`.

## E-mail interno + seleção em lote (implementado)

- E-mail aos usuários internos do tenant (exceto autor) quando a fila muda, com link para `/capacidade`.
- UI: modo **Seleção em lote** — checkboxes + `PUT /api/capacidade/os/batch`.

## Validação

```powershell
.\scripts\test\verify-flyway.ps1   # inclui V38–V43
# Login interno → /capacidade
# Login externo → /externo/capacidade
```
