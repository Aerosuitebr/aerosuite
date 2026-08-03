# Índice mestre — Dossiê técnico-regulatório Aero Suite

**Versão do dossiê:** 1.0  
**Data:** 2026-06-09  
**Produto:** Aero Suite (SaaS multi-tenant — gestão MRO / Part 145)  
**Classificação alvo:** Nível 3 (operacional) com capacidade Nível 4 (registros eletrônicos + CRS)

---

## Responsáveis sugeridos

| Papel | Responsabilidade no dossiê | Nome / assinatura |
|-------|---------------------------|-------------------|
| Fornecedor do software | Descrição do sistema, manual técnico, matriz, controles de TI | __________________ |
| Responsável Técnico (RT) | Escopo regulatório, aceite de validação, integração MOM/MCQ | __________________ |
| Qualidade (SGQ) | Plano/re relatório de validação, treinamento, NC | __________________ |
| TI / Operação | Backup, contingência, migração, monitoramento | __________________ |
| Consultor regulatório (opcional) | Revisão da matriz e enquadramento ANAC | __________________ |

---

## Entrada rápida — RT e consulta ANAC

| Documento | Arquivo | Uso |
|-----------|---------|-----|
| **Síntese técnica (RT)** | [Sintese_Sistema_RT_ANAC.html](./Sintese_Sistema_RT_ANAC.html) | Visão enxuta do produto, módulos e checklist do RT para submissão ANAC |
| PDF (gerar) | `node scripts/build-sintese-rt-anac-pdf.mjs` | Export para encaminhamento formal |

---

## Pacote documental (Seção 5 do guia ANAC)

| Documento | Arquivo | Status |
|-----------|---------|--------|
| Descrição do sistema | [04-descricao-sistema.md](./04-descricao-sistema.md) | ✅ Elaborado |
| Matriz de requisitos regulatórios | [03-matriz-requisitos.md](./03-matriz-requisitos.md) | ✅ Elaborado |
| Manual do usuário | [../manual-homologacao/Manual_Aero_Suite.html](../manual-homologacao/Manual_Aero_Suite.html) | ✅ Existente |
| Manual técnico | [05-manual-tecnico.md](./05-manual-tecnico.md) | ✅ Elaborado |
| Plano de validação | [06-plano-validacao.md](./06-plano-validacao.md) | ✅ Elaborado |
| Relatório de validação | [templates/relatorio-validacao-template.md](./templates/relatorio-validacao-template.md) | ⏳ Pré-preencher via `anac-exportar-documentos-certificacao.ps1`; assinar PDF |
| Escopo piloto RT | [20-escopo-implantacao-piloto-rt.md](./20-escopo-implantacao-piloto-rt.md) | ⏳ Preencher e assinar |
| Pendências para certificação | [21-pendencias-acoes-certificacao.md](./21-pendencias-acoes-certificacao.md) | ✅ Guia de fechamento |
| Plano de migração | [09-plano-migracao.md](./09-plano-migracao.md) | ✅ Elaborado |
| Plano de contingência | [08-plano-contingencia.md](./08-plano-contingencia.md) | ✅ Elaborado |
| Plano de treinamento | [10-plano-treinamento.md](./10-plano-treinamento.md) | ✅ Elaborado |
| Controle de mudanças | [11-controle-mudancas.md](./11-controle-mudancas.md) | ✅ Elaborado |

---

## Cronograma de preparação (referência guia ANAC)

| Período | Entregáveis | Referência |
|---------|-------------|------------|
| Semanas 1–2 | Diagnóstico, classificação, escopo | [01](./01-enquadramento-regulatorio.md), [02](./02-declaracao-escopo-regulatorio.md) |
| Semanas 3–4 | Matriz, perfis, gaps | [03](./03-matriz-requisitos.md), [14](./14-perfis-acesso-rbac.md), [17](./17-lacunas-produto-roadmap.md) |
| Semanas 5–6 | TI, backup, contingência | [05](./05-manual-tecnico.md), [08](./08-plano-contingencia.md) |
| Semanas 7–8 | Validação e evidências | [06](./06-plano-validacao.md), [15](./15-evidencias-testes.md) |
| Semanas 9–10 | Treinamento, piloto | [10](./10-plano-treinamento.md), [16](./16-ambiente-demonstracao.md) |
| Semanas 11–12 | Dossiê final, consulta ANAC | [12](./12-checklist-pre-submissao.md), [13](./13-roteiro-contato-anac.md) |

---

## Fontes normativas (verificar antes da submissão)

| Fonte | URL |
|-------|-----|
| ANAC — Registros de Manutenção | https://www.gov.br/anac/pt-br/assuntos/regulados/programa-de-transformacao-digital/registros-de-manutencao |
| RBAC 145 EMD 09 | https://www.anac.gov.br/assuntos/legislacao/legislacao-1/rbha-e-rbac/rbac/rbac-145 |
| IS 145-009E | https://www.anac.gov.br/assuntos/legislacao/legislacao-1/iac-e-is/is/is-145-009 |
| Manutenção Aeronáutica | https://www.gov.br/anac/pt-br/assuntos/regulados/manutencao-aeronautica |
| Material RBAC 43 — registros | https://www.gov.br/anac/pt-br/assuntos/regulados/toolbox-de-aeronavegabilidade/anotar-registros-de-manutencao/arquivos/material-escrito-registros-de-manutencao_menor.pdf |
