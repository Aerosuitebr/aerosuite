# Dossiê ANAC — Conformidade e Registros de Manutenção

Pacote regulatório da **Aero Suite** para demonstração de conformidade junto à ANAC e auditorias Part 145 (RBAC 43 / RBAC 145 / IS 145-009E).

> **Objetivo:** concentrar em um único lugar escopo, matriz de requisitos, planos, evidências e roteiro de submissão, de forma que o contato com a ANAC seja predominantemente **burocrático** — porque requisitos, testes e artefatos já estão mapeados no produto e neste dossiê.

## Como usar

1. Leia [01-enquadramento-regulatorio.md](./01-enquadramento-regulatorio.md) e [02-declaracao-escopo-regulatorio.md](./02-declaracao-escopo-regulatorio.md) com o **Responsável Técnico (RT)** da organização piloto.
2. Preencha a [matriz de requisitos](./03-matriz-requisitos.md) (ou importe [03-matriz-requisitos.csv](./03-matriz-requisitos.csv)) e execute o roteiro de [06-plano-validacao.md](./06-plano-validacao.md).
3. Colete evidências conforme [15-evidencias-testes.md](./15-evidencias-testes.md) e guarde amostras em [evidencias/](./evidencias/).
4. Antes do contato formal, marque [12-checklist-pre-submissao.md](./12-checklist-pre-submissao.md).
5. Submeta consulta com [13-roteiro-contato-anac.md](./13-roteiro-contato-anac.md) e [18-formulacao-consulta-anac.md](./18-formulacao-consulta-anac.md).

## Estrutura do dossiê

| # | Documento | Conteúdo |
|---|-----------|----------|
| 00 | [INDICE-DOSSIE.md](./00-INDICE-DOSSIE.md) | Índice mestre e responsáveis |
| 01 | [enquadramento-regulatorio.md](./01-enquadramento-regulatorio.md) | Classificação Nível 3/4, RBACs aplicáveis |
| 02 | [declaracao-escopo-regulatorio.md](./02-declaracao-escopo-regulatorio.md) | O que o sistema faz e não faz (template assinável) |
| 03 | [matriz-requisitos.md](./03-matriz-requisitos.md) | Requisito → funcionalidade → teste → evidência |
| 03 | [matriz-requisitos.csv](./03-matriz-requisitos.csv) | Mesma matriz (planilha) |
| 04 | [descricao-sistema.md](./04-descricao-sistema.md) | Módulos, usuários, limitações |
| 05 | [manual-tecnico.md](./05-manual-tecnico.md) | Arquitetura, BD, segurança, backup, logs |
| 06 | [plano-validacao.md](./06-plano-validacao.md) | Escopo, critérios, ambientes, casos de teste |
| 07 | [relatorio-validacao-template.md](./templates/relatorio-validacao-template.md) | Modelo de relatório assinado RT/Qualidade |
| 08 | [plano-contingencia.md](./08-plano-contingencia.md) | Indisponibilidade, operação manual, reconciliação |
| 09 | [plano-migracao.md](./09-plano-migracao.md) | Go-live, saneamento, aceite |
| 10 | [plano-treinamento.md](./10-plano-treinamento.md) | Públicos, carga, registros |
| 11 | [controle-mudancas.md](./11-controle-mudancas.md) | Releases, impacto regulatório |
| 12 | [checklist-pre-submissao.md](./12-checklist-pre-submissao.md) | Checklist executivo antes da ANAC |
| 13 | [roteiro-contato-anac.md](./13-roteiro-contato-anac.md) | Fases 1–7 do guia |
| 14 | [perfis-acesso-rbac.md](./14-perfis-acesso-rbac.md) | Matriz de perfis Part 145 |
| 15 | [evidencias-testes.md](./15-evidencias-testes.md) | Testes automatizados e smokes |
| 16 | [ambiente-demonstracao.md](./16-ambiente-demonstracao.md) | Tenant demo, cenário completo |
| 17 | [lacunas-produto-roadmap.md](./17-lacunas-produto-roadmap.md) | Gaps remanescentes e priorização |
| 18 | [formulacao-consulta-anac.md](./18-formulacao-consulta-anac.md) | Texto sugerido para protocolo |

## Documentação relacionada (repositório)

| Recurso | Caminho |
|---------|---------|
| Roadmap conformidade (produto) | [../ROADMAP-CONFORMIDADE-REGULATORIA.md](../ROADMAP-CONFORMIDADE-REGULATORIA.md) |
| Dossiê de auditoria (funcional) | [../DOSSIE-AUDITORIA.md](../DOSSIE-AUDITORIA.md) |
| Kit go-live 30 dias | [../KIT-GOLIVE-30-DIAS.md](../KIT-GOLIVE-30-DIAS.md) |
| Manual do usuário (homologação) | [../manual-homologacao/README.md](../manual-homologacao/README.md) |
| Hospedagem / infra produção | [../HOSPEDAGEM-PRODUCAO.md](../HOSPEDAGEM-PRODUCAO.md) |

## Verificação automatizada de evidências

```powershell
.\scripts\test\anac-conformidade-evidencias.ps1
```

Gera `docs/anac-conformidade/evidencias/ultima-execucao.json` com resultado dos testes regulatórios.

## Disclaimer

Este dossiê **não substitui** parecer jurídico, RT aeronáutico, consultoria regulatória nem manifestação formal da ANAC. O software **não é certificado como produto isolado**; a conformidade é demonstrada no **contexto da organização usuária** e dos registros que ela adota como oficiais.
