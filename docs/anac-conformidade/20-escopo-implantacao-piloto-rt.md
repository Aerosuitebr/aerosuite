# 20. Escopo da implantação piloto — aceite do Responsável Técnico

> Complementa a [declaração de escopo regulatório](./02-declaracao-escopo-regulatorio.md) com o recorte operacional do piloto antes da submissão à ANAC.

---

## 1. Identificação do piloto

| Campo | Preencher |
|-------|-----------|
| Organização (tenant piloto) | |
| Certificado Part 145 nº | |
| Responsável Técnico | |
| Gerente / Diretor operacional | |
| Período do piloto | ___/___/___ a ___/___/___ |
| Versão Aero Suite (tag Git) | |
| Ambiente | [ ] Homologação [ ] Produção controlada |

## 2. Módulos em uso no piloto

| Módulo | Incluído no piloto | Registro oficial? | Observação |
|--------|-------------------|-------------------|------------|
| Ordens de serviço (OS) | [ ] Sim | [ ] Sim [ ] Complementar | |
| Job card / hangar | [ ] Sim | [ ] Sim [ ] Complementar | |
| CRS (liberação para serviço) | [ ] Sim | [ ] Sim [ ] Complementar | |
| Dossiê PDF/ZIP | [ ] Sim | [ ] Sim | |
| Estoque / rastreio peça | [ ] Sim | [ ] Sim [ ] Não | |
| Conformidade SGQ (painel) | [ ] Sim | [ ] Sim [ ] Não | |
| Documentos controlados | [ ] Sim | [ ] Sim [ ] Não | |
| Treinamentos / lista presença | [ ] Sim | [ ] Sim [ ] Não | |

## 3. Massa de dados e cenário de demonstração

- [ ] Tenant demo sanitizado conforme [16-ambiente-demonstracao.md](./16-ambiente-demonstracao.md)
- [ ] Pelo menos **1 OS completa** (abertura → execução → inspeção → CRS → encerramento)
- [ ] Assinaturas job card com SHA-256 verificável (REQ-008)
- [ ] Anexos e fotos na OS
- [ ] Export dossiê PDF + ZIP para pasta `evidencias/amostra-os-*/`

## 4. Perfis e usuários do piloto

| Perfil P145 | Nome | E-mail | Confirmado segregação |
|-------------|------|--------|------------------------|
| RT | | | [ ] |
| Inspetor | | | [ ] |
| Mecânico | | | [ ] |
| Qualidade | | | [ ] |
| Almoxarifado | | | [ ] |

Referência de perfis: [14-perfis-acesso-rbac.md](./14-perfis-acesso-rbac.md).

## 5. Critérios de aceite do piloto (RT)

O RT declara que, ao final do piloto:

- [ ] Os testes automatizados `anac-conformidade-evidencias.ps1` passaram sem falha
- [ ] Os testes manuais VAL-01 a VAL-19 do [plano de validação](./06-plano-validacao.md) foram executados ou justificados
- [ ] O [relatório de validação](./templates/relatorio-validacao-template.md) foi revisado e assinado
- [ ] MOM/MCQ da organização foram atualizados para referenciar o Aero Suite
- [ ] Treinamento dos perfis críticos foi realizado ([10-plano-treinamento.md](./10-plano-treinamento.md))
- [ ] Não há desvio **crítico** aberto (perda de dados, bypass RBAC, CRS sem segregação)

## 6. Limitações aceitas no piloto

| Item | Aceite RT | Mitigação |
|------|-----------|-----------|
| Assinatura gráfica (não ICP-Brasil) | [ ] Sim | Vínculo usuário + SHA-256 + auditoria |
| Backup SaaS compartilhado | [ ] Sim | Export periódico dossiê + teste restore homologação |
| Contingência papel + reconciliação | [ ] Sim | [08-plano-contingencia.md](./08-plano-contingencia.md) |

## 7. Aprovação

| Papel | Nome | Assinatura | Data |
|-------|------|------------|------|
| Responsável Técnico | | | |
| Qualidade (SGQ) | | | |
| Representante fornecedor | | | |

**Arquivar PDF assinado em:** `evidencias/escopo-piloto-assinado-YYYYMMDD.pdf`
