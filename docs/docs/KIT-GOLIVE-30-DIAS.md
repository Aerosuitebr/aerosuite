# Kit Go-live — 30 dias (P4.3)

Pacote de **onboarding operacional** para oficinas Part 145 que entram na Aero Suite sem parar a produção. Não substitui deploy de infra (Fase D) nem migrações Flyway — é fluxo de dados e checklist no produto.

## Onde aceder

| Camada | Local |
|--------|--------|
| UI | `/go-live-migracao` (menu **Administração → Kit Go-live (30 dias)**) |
| API | `GET/POST /api/go-live-migracao/*` |
| Permissão | `GO_LIVE_MIGRACAO` ou `GERENCIAR_PERMISSOES` |
| Flyway | `V22__go_live_migracao_funcionalidade.sql` |

## Checklist (5 semanas)

A UI lista 15 tarefas agrupadas por semana (chaves `goLive.checklist.w*.*`). O progresso **é persistido** por tenant (`V53__go_live_checklist_progress.sql`, `PUT /api/go-live-migracao/checklist`).

1. **Semana 1** — tenant, RBAC, habilitações, dossiê de auditoria.
2. **Semana 2** — kit go-live, propostas, configurações.
3. **Semana 3** — OS, hangar (job card offline), diretrizes AD/SB.
4. **Semana 4** — configurações finais, backup, go-live operacional.
5. **Semana 5 (Onda D SGQ)** — painel qualidade, treinamentos obrigatórios por função, documentos controlados com revisão/CAPA.

## Modelos CSV

Descarregáveis na aba **Modelos CSV** ou em `backend/src/main/resources/go-live/templates/`:

| ID | Ficheiro | Destino na suite |
|----|----------|------------------|
| `clientes-proposta` | `clientes-proposta.csv` | Cadastro **Clientes de proposta** |
| `fcu` | `fcu.csv` | **FCU** / componentes (fabricante por nome) |
| `usuarios-externos` | `usuarios-externos.csv` | **Utilizadores externos** + grants padrão (incl. `propostas-externa`) |
| `fornecedores` | `fornecedores.csv` | **Fornecedores** + status ASL |
| `treinamentos` | `treinamentos.csv` | **Treinamentos SGQ** (por e-mail ou id de usuário) |
| `documentos-sgq` | `documentos-sgq.csv` | **Documentos controlados** (código, revisão, título) |
| `calibracao` | `calibracao.csv` | **Calibração / ferramentas** |
| `nao-conformidades` | `nao-conformidades.csv` | **Não conformidades** (seed inicial) |

Separador: `;` ou `,`. Cabeçalhos tolerantes a aliases (ex.: `pn` / `part_number`).

## Importação

1. Colar CSV ou enviar ficheiro na aba **Importar**.
2. Marcar **Apenas validar (dry-run)** para simular sem gravar.
3. Desmarcar dry-run para persistir (requer permissões normais de criação nos serviços subjacentes).

Endpoints:

- `POST /api/go-live-migracao/import/clientes-proposta`
- `POST /api/go-live-migracao/import/fcu`
- `POST /api/go-live-migracao/import/usuarios-externos`
- `POST /api/go-live-migracao/import/fornecedores`
- `POST /api/go-live-migracao/import/treinamentos`
- `POST /api/go-live-migracao/import/documentos-sgq`
- `POST /api/go-live-migracao/import/calibracao`
- `POST /api/go-live-migracao/import/nao-conformidades`

Corpo: `{ "csv": "...", "dryRun": true }`.

Resposta: totais `criados`, `ignorados`, `erros` e detalhe por linha.

**Utilizadores externos:** a senha temporária não é devolvida no JSON por segurança; o fluxo normal envia e-mail quando SMTP está configurado.

## Validação

```powershell
.\scripts\test\verify-flyway.ps1          # inclui V22
# Login com perfil ADMIN → /go-live-migracao
```

## Relacionado

- [ROADMAP-DIFERENCIACAO-MRO.md](./ROADMAP-DIFERENCIACAO-MRO.md) — P4.3
- [PORTAL-CLIENTE-2-PROPOSTA-OS.md](./PORTAL-CLIENTE-2-PROPOSTA-OS.md) — P4.1/P4.2
- [PROXIMOS-PASSOS-DESENV.md](./PROXIMOS-PASSOS-DESENV.md) — estado do backlog
