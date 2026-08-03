# Relatório de validação — Aero Suite

> Preencher após execução do [06-plano-validacao.md](../06-plano-validacao.md). Exportar PDF assinado para `evidencias/relatorio-validacao-YYYYMMDD.pdf`.

---

## 1. Identificação

| Campo | Valor |
|-------|-------|
| Organização | |
| Versão validada (tag Git) | |
| Ambiente | [ ] Homologação [ ] Produção piloto |
| Período dos testes | ___/___/___ a ___/___/___ |
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

**Conclusão:** [ ] Aprovado para uso como registro oficial [ ] Aprovado com ressalvas [ ] Reprovado

## 4. Testes automatizados

| Suite | Data | Resultado | Evidência |
|-------|------|-----------|-----------|
| `anac-conformidade-evidencias.ps1` | | OK / FALHA | `ultima-execucao.json` |
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

- ATENDE: ___ / 30
- PARCIAL: ___ / 30

Anexo: `03-matriz-requisitos.csv` (versão datada).

## 9. Aprovações

| Papel | Nome | Assinatura | Data |
|-------|------|------------|------|
| Qualidade | | | |
| Responsável Técnico | | | |
| Fornecedor Aero Suite | | | |

---

*Documento confidencial — uso regulatório e auditoria interna.*
