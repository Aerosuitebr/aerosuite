# Dossiê de auditoria (P4.4)

Exportação **PDF** consolidada para auditorias Part 145: uma OS, anexos (metadados), movimentações de estoque, trilha `os_auditoria`, acessos do portal externo à OS e amostra do log de acesso interno do tenant.

## Acesso

| Camada | Local |
|--------|--------|
| UI | `/dossie-auditoria` ou botão na lista **Auditoria OS** (com filtro de número preenchido) |
| API | `GET /api/dossie-auditoria/numero/{numeroOs}/pdf` |
| Resumo | `GET /api/dossie-auditoria/numero/{numeroOs}/resumo` |
| Pacote ZIP | `GET /api/dossie-auditoria/pacote/zip` (dossiê + `crs.pdf` + `anexos/*` por OS) |
| Pacote resumo | `GET /api/dossie-auditoria/pacote/resumo` |
| Retenção | `GET/PUT /api/conformidade/retencao` · inventário · `GET .../export/zip` (arquivo morto) |
| Permissão | `DOSSIE_AUDITORIA`, `ORDEM_SERVICO` ou `GERENCIAR_PERMISSOES` |
| Flyway | `V23__dossie_auditoria_funcionalidade.sql` |

Query opcional: `locale=pt-BR|en-US|es-ES|fr-FR` (rótulos das secções do PDF).

## Conteúdo do PDF

0. **Checklist de evidências (pré-auditoria)** — itens orientativos para revisão antes da fiscalização.
1. **Dados da OS** — cliente, tipo de serviço, P/N, S/N, datas, estado.
2. **Anexos** — nome, data, tipo MIME (metadados no PDF; ficheiros binários incluídos no **pacote ZIP** multi-OS).
3. **Movimentações de estoque** — saídas/consumos com código de rastreio, P/N, S/N, certificado de conformidade, quantidade e motivo.
4. **Auditoria da OS** — até 500 registos de `os_auditoria`.
5. **Portal externo** — `log_acesso_externo` com `recurso_tipo = OS` e `recurso_id` = id interno.
6. **Acesso interno** — últimos 80 eventos de `acesso_auditoria` do tenant (login, RBAC, etc.).
7. **Resumo SGQ (Onda D)** — NC abertas, documentos controlados vigentes, treinamentos ativos, calibrações e fornecedores ASL (via `ConformidadeSgqExportService`).

## Pacote ZIP multi-OS

Além do PDF por OS e anexos binários, o pacote inclui:

- `sgq/resumo.csv` — snapshot tabular das evidências SGQ do tenant
- `sgq/snapshot.json` — mesmo conteúdo em JSON para integrações

Ver [ROADMAP-CONFORMIDADE-REGULATORIA.md](./ROADMAP-CONFORMIDADE-REGULATORIA.md) — Onda D1.

## Validação

```powershell
.\scripts\test\verify-flyway.ps1
# Login com ORDEM_SERVICO ou DOSSIE_AUDITORIA → /dossie-auditoria → número OS → Exportar PDF
```

## Relacionado

- [ROADMAP-DIFERENCIACAO-MRO.md](./ROADMAP-DIFERENCIACAO-MRO.md) — dor D10
- [KIT-GOLIVE-30-DIAS.md](./KIT-GOLIVE-30-DIAS.md) — P4.3
