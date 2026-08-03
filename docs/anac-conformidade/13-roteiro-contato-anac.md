# 13. Roteiro de contato e submissão à ANAC

## Fase 1 — Diagnóstico

| Ação | Responsável | Entregável |
|------|-------------|------------|
| Definir se software é apoio, operacional, registro eletrônico ou liberação | RT + Fornecedor | [01-enquadramento](./01-enquadramento-regulatorio.md) |
| Classificar nível 3/4 | RT | Declaração em [02](./02-declaracao-escopo-regulatorio.md) |

## Fase 2 — Mapeamento

| Ação | Entregável |
|------|------------|
| Relacionar RBACs, IS, MOM, MCQ | [03-matriz-requisitos](./03-matriz-requisitos.md) |
| Identificar gaps | [17-lacunas-produto-roadmap](./17-lacunas-produto-roadmap.md) |

## Fase 3 — Pré-dossiê

| Ação | Entregável |
|------|------------|
| Montar pacote técnico | Pasta `docs/anac-conformidade/` completa |
| Preparar demo | [16-ambiente-demonstracao](./16-ambiente-demonstracao.md) |
| Executar testes | [15-evidencias-testes](./15-evidencias-testes.md) |

## Fase 4 — Consulta formal

| Ação | Detalhe |
|------|---------|
| Canal | Conforme orientação atual ANAC (Programa Transformação Digital / Registros de Manutenção) |
| Documento | [18-formulacao-consulta-anac](./18-formulacao-consulta-anac.md) |
| Anexos | Escopo assinado, matriz, amostra ZIP dossiê, relatório validação |

**Não enviar** sem [12-checklist-pre-submissao](./12-checklist-pre-submissao.md) completo.

## Fase 5 — Validação (se solicitada)

| Ação | Entregável |
|------|------------|
| Complementar evidências | Pasta `evidencias/` |
| Corrigir desvios | Issues + reteste |
| Relatório final | Template assinado |

## Fase 6 — Implantação controlada

| Ação | Referência |
|------|------------|
| Treinamento | [10-plano-treinamento](./10-plano-treinamento.md) |
| Piloto 30 dias | [09-plano-migracao](./09-plano-migracao.md) |
| Auditoria primeiros registros | Dossiê amostra |

## Fase 7 — Manutenção contínua

| Ação | Frequência |
|------|------------|
| Revisar matriz vs normas | Trimestral |
| Teste restauração backup | Semestral |
| Revalidação após release major | Por release |
| Auditoria interna registros | Conforme MCQ |
