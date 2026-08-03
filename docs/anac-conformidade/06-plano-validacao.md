# 6. Plano de validação do software

## 6.1 Objetivo

Comprovar, em ambiente controlado e versão congelada, que o Aero Suite atende aos requisitos da [matriz](./03-matriz-requisitos.md) e não permite uso incompatível com processo Part 145 regulado.

## 6.2 Escopo

| Incluso | Excluído |
|---------|----------|
| Módulos MRO, CRS, dossiê, hangar, estoque rastreio, conformidade SGQ | Módulo comercial puro (propostas sem OS) |
| Perfis P145_* e ADMIN | Integração Bling fiscal |
| Retenção e export | Performance / carga extrema |

## 6.3 Ambiente

| Item | Especificação |
|------|---------------|
| Versão | Tag Git: `________________` |
| BD | MySQL com Flyway até última migration |
| Tenant | Demo sanitizado ([16-ambiente-demonstracao.md](./16-ambiente-demonstracao.md)) |
| Usuários | 1× RT, 1× inspetor, 1× mecânico, 1× almox, 1× sem permissão CRS |
| Massa de dados | 1 aeronave/FCU, 1 OS completa, peças com certificado, 1 AD, habilitações válidas |

## 6.4 Critérios de aceitação globais

1. **100%** dos requisitos **ATENDE** na matriz passam no teste manual ou automatizado indicado.
2. Requisitos **PARCIAL** têm mitigação documentada + plano de remediação com prazo.
3. Nenhum defeito **crítico** aberto (perda de dados, bypass RBAC, CRS sem segregação).
4. Relatório assinado por RT e Qualidade ([template](./templates/relatorio-validacao-template.md)).

## 6.5 Roteiro de testes

### Fase A — Automatizada (obrigatória antes da manual)

```powershell
.\scripts\test\verify-flyway.ps1
.\scripts\test\anac-conformidade-evidencias.ps1
```

Resultado arquivado em `evidencias/ultima-execucao.json`.

### Fase B — Funcional

| ID | Caso | Passos | Resultado esperado |
|----|------|--------|-------------------|
| VAL-01 | Ciclo OS completo | Abrir OS → job card → anexos → fechar | OS com datas e anexos |
| VAL-02 | CRS válido | RT emite CRS com checklist | PDF gerado, `crsEmitidoEm` preenchido |
| VAL-03 | CRS segregação | Mecânico que editou OS tenta CRS | Erro `crs.error.segregation.executor` |
| VAL-04 | CRS reemissão | Segunda emissão mesma OS | Bloqueado `crs.error.ja_emitido` |
| VAL-05 | Dossiê | Export PDF + ZIP pacote | Conteúdo seções 0–7 conforme doc |
| VAL-06 | Rastreio peça | Saída estoque → linha do tempo PDF | Certificado na linha |
| VAL-07 | Quarentena | Enviar/liberar item | Status e movimentação corretos |
| VAL-08 | AD/SB alerta | Diretriz vencendo | Alerta no painel e na OS |
| VAL-09 | SGQ NC CAPA | NC sem eficácia → fechar | Rejeição |
| VAL-10 | Retenção | Export arquivo morto | ZIP + RETENCAO.txt |

### Fase C — Segurança

| ID | Caso | Resultado esperado |
|----|------|-------------------|
| VAL-11 | API sem JWT | HTTP 401 |
| VAL-12 | CRS sem `CRS_EMITIR` | HTTP 403 |
| VAL-13 | Cross-tenant | HTTP 403/404 |
| VAL-14 | Login falho | Registro em `acesso_auditoria` |

### Fase D — Integridade

| ID | Caso | Resultado esperado |
|----|------|-------------------|
| VAL-15 | Alterar OS aberta | Registro em `os_auditoria` |
| VAL-16 | Alterar OS fechada | **Atual:** permitido com auditoria. **Alvo P-001:** bloqueio ou justificativa |

### Fase E — Continuidade

| ID | Caso | Resultado esperado |
|----|------|-------------------|
| VAL-17 | Hangar offline | Fila localStorage, sync ao online |
| VAL-18 | Export manual | ZIP dossiê sem sistema |
| VAL-19 | Restauração backup | BD restaurada; ata em `evidencias/ata-restore-*.pdf` |

## 6.6 Responsáveis

| Fase | Executor | Revisor |
|------|----------|---------|
| A | TI / Dev | Qualidade |
| B–E | Qualidade + RT | RT |
| Relatório final | Qualidade | RT + Fornecedor |

## 6.7 Cronograma sugerido

| Dia | Atividade |
|-----|-----------|
| D1 | Preparar ambiente e massa de dados |
| D2 | Fase A + B |
| D3 | Fase C + D + E |
| D4 | Correções e reteste |
| D5 | Relatório e assinaturas |
