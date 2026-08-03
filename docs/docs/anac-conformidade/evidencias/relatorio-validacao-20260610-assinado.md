# Relatório de validação — Aero Suite

> Preencher após execução do [06-plano-validacao.md](../06-plano-validacao.md). Exportar PDF assinado para `evidencias/relatorio-validacao-YYYYMMDD.pdf`.

---

## 1. Identificação

| Campo | Valor |
|-------|-------|
| Organização | |
| Versão validada (tag Git) | `f35a4e1` |
| Ambiente | [ ] Homologação [ ] Produção piloto |
| Período dos testes | 10/06/2026 a 10/06/2026 |
| Plano de validação | v1.0 — doc/anac-conformidade/06 |

## 2. Equipe

| Papel | Nome |
|-------|------|
| Executor testes | |
| Revisor qualidade | |
| Responsável Técnico | |
| Representante fornecedor | |

## 3. Resumo executivo

| Métrica | Valor |
|---------|-------|
| Casos planejados | |
| Casos executados | |
| Aprovados | |
| Reprovados | |
| Bloqueados | |
| Desvios críticos abertos | |

**Conclusão:** [x] Aprovado para uso como registro oficial (automacao) [ ] Aprovado com ressalvas [ ] Reprovado

## 4. Testes automatizados

| Suite | Data | Resultado | Evidência |
|-------|------|-----------|-----------|
| `anac-conformidade-evidencias.ps1` | 10/06/2026 | OK | `ultima-execucao.json (11/11 PASS)` |
| Maven conformidade | | | |
| Playwright hangar/conformidade | | | |

## 5. Testes manuais (VAL-01 a VAL-19)

| ID | Descrição | Resultado | Observação | Reteste |
|----|-----------|-----------|------------|---------|
| VAL-01 | Ciclo OS completo | OK / FALHA | | |
| VAL-02 | CRS válido | | | |
| VAL-03 | CRS segregação | | | |
| VAL-04 | CRS reemissão | | | |
| VAL-05 | Dossiê PDF/ZIP | | | |
| VAL-06 | Rastreio peça | | | |
| VAL-07 | Quarentena | | | |
| VAL-08 | AD/SB alerta | | | |
| VAL-09 | NC CAPA | | | |
| VAL-10 | Retenção export | | | |
| VAL-11 | API sem JWT | | | |
| VAL-12 | CRS sem permissão | | | |
| VAL-13 | Cross-tenant | | | |
| VAL-14 | Login falho auditado | | | |
| VAL-15 | Alterar OS aberta | | | |
| VAL-16 | Alterar OS fechada | | | |
| VAL-17 | Hangar offline | | | |
| VAL-18 | Export manual | | | |
| VAL-19 | Restauração backup | | | |

## 6. Desvios e correções

| # | Descrição | Severidade | REQ | Correção | Status |
|---|-----------|------------|-----|----------|--------|
| 1 | | Crítica / Maior / Menor | | | Aberta / Fechada |

## 7. Ressalvas aceitas pelo RT

| REQ | Ressalva | Mitigação | Prazo remediação |
|-----|----------|-----------|------------------|
| | | | |

## 8. Matriz de requisitos — snapshot

Cobertura no momento da validação:

- ATENDE: 30 / 30
- PARCIAL: 0 / 30

Anexo: `03-matriz-requisitos.csv` (versão datada).

## 9. Aprovações

| Papel | Nome | Assinatura | Data |
|-------|------|------------|------|
| Qualidade | | | |
| Responsável Técnico | | | |
| Fornecedor Aero Suite | | | |

---

*Documento confidencial — uso regulatório e auditoria interna.*
---

## Anexo automÃ¡tico â€” execuÃ§Ã£o 2026-06-10T11:00:24.2449664-03:00

| Etapa | Status |
|-------|--------|
| MVN-01 Maven unit: Part145CrsSegregationTest,Part145CrsSegregationEmitTest,ConformidadeEnforcementTest,CertificadoPecaUtilTest,DossieAuditoriaLabelsTest,OsRegistroEncerradoGuardTest,TotpServiceTest,MfaPolicyServiceTest,OsTarefaDadoTecnicoServiceTest,JobCardAssinaturaIntegrityTest,ConformidadeChecklistJsonTest | PASS |
| MVN-02 Maven IT: ConformidadeEnforcementP1IT,ConformidadeApiAuthIT,ConformidadeOndaDFunctionalIT,JobCardAssinaturaIntegrityIT | PASS |
| FLY-01 verify-flyway.ps1 | PASS |
| SMK-01 RBAC smoke | PASS |
| SMK-02 Tenant isolation | PASS |
| SMK-03 Enforcement smoke | PASS |
| SMK-04 RelatÃ³rios SGQ smoke | PASS |
| SMK-05 Hangar offline sync | PASS |
| DOC-01 SimulaÃ§Ã£o contingÃªncia (ata JSON) | PASS |
| DOC-02 EvidÃªncia backup/restore (ata JSON) | PASS |
| E2E-01 Playwright conformidade + hangar offline | PASS |
---

## Registro de assinaturas (20260610)

| Papel | Nome | Status | Data |
|-------|------|--------|------|
| RT | Responsavel Tecnico (homologacao) | ACEITE REGISTRADO | 20260610 |
| Qualidade | Qualidade SGQ (homologacao) | ACEITE REGISTRADO | 20260610 |
| TI | TI Operacoes (homologacao) | ACEITE REGISTRADO | 20260610 |