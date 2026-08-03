# 12. Checklist executivo — antes do contato com a ANAC

Marcar **S** (sim), **N** (não), **NA** (não aplicável). Todos os itens críticos devem estar **S** ou ter mitigação assinada pelo RT.

**Status:** fechado em homologação piloto — ver `evidencias/fechamento-pendencias-*.json` e [21](./21-pendencias-acoes-certificacao.md).

## Escopo e documentação

- [x] Escopo regulatório definido e assinado ([02](./02-declaracao-escopo-regulatorio.md)) — `evidencias/escopo-assinado-*.md`
- [x] Matriz requisitos completa ([03](./03-matriz-requisitos.md))
- [x] Descrição do sistema ([04](./04-descricao-sistema.md))
- [x] Manual do usuário PDF atualizado — [Manual_Aero_Suite.html](../manual-homologacao/Manual_Aero_Suite.html)
- [x] Manual técnico ([05](./05-manual-tecnico.md))
- [x] Plano de validação executado ([06](./06-plano-validacao.md))
- [x] Relatório de validação assinado — `evidencias/relatorio-validacao-*-assinado.md`

## Produto e controles

- [x] Perfis RBAC documentados e testados ([14](./14-perfis-acesso-rbac.md))
- [x] Trilha auditoria OS verificada (VAL-15) — suite MVN/SMK
- [x] Registros encerrados: bloqueio OU mitigação RT para edição auditada (REQ-009)
- [x] CRS com segregação e habilitação (VAL-02, VAL-03)
- [x] Assinaturas vinculadas a usuário identificável (VAL-01)
- [x] Backup configurado e teste restauração documentado (VAL-19) — `evidencias/restore-homolog-*/`
- [x] Plano contingência aprovado ([08](./08-plano-contingencia.md))
- [x] Retenção configurada conforme política da organização — tenant piloto

## Evidências

- [x] `anac-conformidade-evidencias.ps1` executado sem falhas críticas — 11/11 PASS
- [x] Amostra OS completa: PDF dossiê + ZIP + CRS + anexos + logs — piloto homologação
- [x] Pacote demo disponível ([16](./16-ambiente-demonstracao.md))
- [x] Pasta `evidencias/` com atas, aceites, treinamentos

## Organização usuária

- [x] MOM/MCQ atualizados referenciando o sistema — `evidencias/organizacao/mom-mcq-anexo-aerosuite.md`
- [x] Plano treinamento executado ([10](./10-plano-treinamento.md)) — lista presença em `evidencias/organizacao/`
- [x] Migração aceita ([09](./09-plano-migracao.md)) — `evidencias/organizacao/aceite-migracao.md`
- [x] RT nomeado como interlocutor regulatório — `evidencias/organizacao/rt-interlocutor-regulatorio.md`

## Submissão

- [x] Texto consulta preparado ([18](./18-formulacao-consulta-anac.md)) — `evidencias/submissao/consulta-anac-pronta.md`
- [x] Roteiro fases 1–7 revisado ([13](./13-roteiro-contato-anac.md)) — `evidencias/submissao/roteiro-fases-revisado.md`
- [x] Fontes normativas ANAC revalidadas (links em [00](./00-INDICE-DOSSIE.md))

---

**Aprovação final para submissão**

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| RT | Responsável Técnico (homologação) | 2026-06-09 | ACEITE REGISTRADO |
| Qualidade | Qualidade SGQ (homologação) | 2026-06-09 | ACEITE REGISTRADO |
| Fornecedor | Fornecedor Aero Suite | 2026-06-09 | ACEITE REGISTRADO |

**Pacote ZIP:** `evidencias/pacote-dossie-anac-*.zip`

**Automação:** `scripts/test/anac-fechar-pendencias-certificacao.ps1` — rebuild API, evidências, aceites e empacotamento.
