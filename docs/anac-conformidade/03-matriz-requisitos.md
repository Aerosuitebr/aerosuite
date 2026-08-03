# Matriz de requisitos regulatórios

Coração do dossiê: cada requisito normativo ou procedimental ligado a **funcionalidade**, **teste** e **evidência** verificável.

**Planilha:** [03-matriz-requisitos.csv](./03-matriz-requisitos.csv) (importar em Excel/LibreOffice).

**Legenda de status:**

| Status | Significado |
|--------|-------------|
| **ATENDE** | Implementado e com teste/evidência mapeados |
| **PARCIAL** | Funcionalidade existe; falta endurecimento, documento formal ou teste de aceite assinado |
| **PLANEJADO** | Item em [17-lacunas-produto-roadmap.md](./17-lacunas-produto-roadmap.md) |

---

## Resumo por área

| Área | ATENDE | PARCIAL |
|------|--------|---------|
| Registros e dossiê | REQ-001, 003, 009, 013, 025, 030 | — |
| CRS e segregação | REQ-002, 005, 008 | — |
| Cadastro e dados técnicos | REQ-006, 007 | — |
| RBAC e segurança | REQ-010, 011, 012, 023, 024 | — |
| Estoque e rastreio | REQ-014, 015 | — |
| SGQ operacional | REQ-016, 017, 018, 019, 020, 021, 029 | — |
| Continuidade e TI | REQ-004, 022, 026, 027, 028 | — |

**Cobertura funcional estimada:** 30/30 ATENDE (100%), 0 PARCIAL, 0 PLANEJADO sem rota.

---

## Detalhamento dos requisitos críticos (Nível 4)

### REQ-001 — Conservação de registros

| Campo | Valor |
|-------|-------|
| **Fonte** | RBAC 145, registros de manutenção |
| **Funcionalidade** | Dossiê PDF por OS; pacote ZIP multi-OS; retenção configurável; arquivo morto |
| **APIs** | `GET /api/dossie-auditoria/numero/{n}/pdf`, `GET /api/dossie-auditoria/pacote/zip`, `GET /api/conformidade/retencao/export/zip` |
| **UI** | `/dossie-auditoria` |
| **Teste** | Criar OS → anexos → CRS → exportar pacote |
| **Evidência** | ZIP com `os/OS_<n>/`, `crs.pdf`, `sgq/`, `RETENCAO.txt` |
| **Doc** | [DOSSIE-AUDITORIA.md](../DOSSIE-AUDITORIA.md) |

### REQ-002 — Segregação de funções (CRS)

| Campo | Valor |
|-------|-------|
| **Fonte** | MOM/MCQ, RBAC 145 |
| **Funcionalidade** | `Part145CrsSegregation` — executor da OS não emite CRS (exceto perfis bypass) |
| **Código** | `backend/.../crs/Part145CrsSegregation.java` |
| **Testes** | `Part145CrsSegregationTest`, `Part145CrsSegregationEmitTest` |
| **Evidência** | Resposta API `crs.error.segregation.executor` + log auditoria |

### REQ-005 — Certificado de liberação para serviço

| Campo | Valor |
|-------|-------|
| **Fonte** | RBAC 145, liberação de manutenção |
| **Funcionalidade** | Checklist CRS, PDF, habilitação RT/inspetor, bloqueio reemissão |
| **APIs** | `GET/POST /api/os/{id}/crs/*` |
| **UI** | OS → Emitir CRS |
| **Teste** | Emitir com checklist incompleto (deve falhar); emitir com RT válido (sucesso) |

### REQ-009 — Integridade pós-encerramento ✅ ATENDE

| Campo | Valor |
|-------|-------|
| **Implementação** | `OsRegistroEncerradoGuard` bloqueia mutações quando `dataFechamento` ou CRS emitido |
| **Reabertura** | `POST /api/os/{id}/reabrir` — justificativa ≥15 chars, perfis RT/inspetor/qualidade; anula CRS se existir |
| **Auditoria** | Ação `REABERTURA` em `os_auditoria` |
| **Teste** | `OsRegistroEncerradoGuardTest` |

### REQ-010 — RBAC

| Campo | Valor |
|-------|-------|
| **Perfis** | Ver [14-perfis-acesso-rbac.md](./14-perfis-acesso-rbac.md) |
| **Testes** | `ConformidadeApiAuthIT`, `scripts/test/api-rbac-smoke.ps1` |

---

## Como validar a matriz

1. Para cada linha **PARCIAL**, executar teste do plano de validação e registrar em [templates/relatorio-validacao-template.md](./templates/relatorio-validacao-template.md).
2. Após remediação de produto (P-001…), atualizar status para **ATENDE** e anexar nova evidência em `evidencias/`.
3. Revisão trimestral com RT: conferir se normas ANAC foram atualizadas.
