# 17. Lacunas de produto — roadmap para aderência total

Objetivo: elevar todos os requisitos **PARCIAL** da matriz para **ATENDE**, de modo que o contato com a ANAC se restrinja ao ciclo burocrático.

## 17.1 Prioridade P0 (antes da submissão)

| ID | Requisito | Lacuna | Entrega técnica | Critério de aceite |
|----|-----------|--------|-----------------|-------------------|
| ~~**P-001**~~ | REQ-009 | ~~OS fechada editável sem controle~~ | **Feito** — `OsRegistroEncerradoGuard`, `POST /api/os/{id}/reabrir`, auditoria `REABERTURA` | VAL-16 |
| ~~**P-002**~~ | REQ-026 | ~~Plano contingência sem teste formal~~ | **Feito** — `anac-contingencia-simulacao.ps1` + ata JSON | Exportar PDF assinado RT/TI |
| ~~**P-003**~~ | REQ-022 | ~~Restauração backup não evidenciada~~ | **Feito** — `anac-backup-restore-evidencia.ps1` + RTO backup | Restore homologação + PDF |

## 17.2 Prioridade P1 (endurecimento regulatório)

| ID | Requisito | Lacuna | Entrega técnica |
|----|-----------|--------|-----------------|
| ~~**P-004**~~ | REQ-023 | ~~MFA só na UI~~ | **Feito** — TOTP backend + login/enrollment UI |
| ~~**P-005**~~ | REQ-007 | ~~Vínculo tarefa↔dado técnico fraco~~ | **Feito** — `os_tarefa_dado_tecnico` + UI na OS |
| ~~**P-006**~~ | REQ-008 | ~~Assinatura canvas~~ | **Feito** — SHA-256 + `assinatura_timestamp_server` + exibição hangar |
| ~~**P-007**~~ | REQ-028 | ~~Controle mudanças no produto~~ | **Feito** — `conformidade_release_aceite` + UI `/conformidade/releases` |

## 17.3 Prioridade P2 (maturidade organizacional)

| ID | Requisito | Lacuna | Entrega |
|----|-----------|--------|---------|
| ~~**P-008**~~ | REQ-029 | ~~Treinamento sem lista presença nativa~~ | **Feito** — `turma_ref` + `presente_lista` + PDF lista presença |
| ~~**P-009**~~ | REQ-004 | ~~Contingência~~ | **Feito** — checklist reconciliação UI `/conformidade/contingencia` |

## 17.4 Status atual da cobertura

```
ATENDE:  30/30 (100%)
PARCIAL:  0/30 (0%)
```

**Meta para submissão (produto):** atingida — 30/30 ATENDE. Pendências organizacionais detalhadas em [21-pendencias-acoes-certificacao.md](./21-pendencias-acoes-certificacao.md).

## 17.5 Ordem de implementação sugerida

| Sprint | Itens | Esforço estimado |
|--------|-------|------------------|
| ~~S1~~ | ~~P-001 bloqueio OS fechada~~ | **Concluído** |
| ~~S2~~ | ~~P-002 + P-003 atas e procedimentos~~ | **Concluído** |
| ~~S3~~ | ~~P-004 MFA mínimo~~ | **Concluído** |
| ~~S4~~ | ~~P-005 vínculo dados técnicos~~ | **Concluído** |
| ~~S5~~ | ~~P-006..P-009 (4 PARCIAL restantes)~~ | **Concluído** |

Após cada sprint: atualizar [03-matriz-requisitos.csv](./03-matriz-requisitos.csv) e reexecutar `anac-conformidade-evidencias.ps1`.

## 17.6 O que já está fechado (não reabrir)

Ondas A–D, P1–P5 do [ROADMAP-CONFORMIDADE-REGULATORIA.md](../ROADMAP-CONFORMIDADE-REGULATORIA.md) — CRS, dossiê, SGQ, enforcement, hangar offline, retenção, perfis Part 145.
