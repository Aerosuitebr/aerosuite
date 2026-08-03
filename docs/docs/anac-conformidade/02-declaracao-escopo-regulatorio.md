# 2. Declaração de escopo regulatório

> **Template** — preencher, revisar com RT e arquivar assinado em `evidencias/escopo-assinado.pdf`.

---

## Identificação

| Campo | Valor |
|-------|-------|
| **Software** | Aero Suite |
| **Versão / release** | _________________ |
| **Organização usuária (piloto)** | _________________ |
| **Certificado Part 145 nº** | _________________ |
| **Responsável Técnico** | _________________ |
| **Data** | ___/___/______ |

---

## 1. Objetivo do sistema no ambiente regulado

O Aero Suite será utilizado pela organização acima identificada como ferramenta de:

- [ ] Gestão de ordens de serviço de manutenção
- [ ] Registro de execução e inspeção (job card / hangar)
- [ ] Emissão de Certificado de Liberação para Serviço (CRS) em PDF
- [ ] Armazenamento de registros de manutenção **oficiais** (substituindo papel)
- [ ] Armazenamento de registros **complementares** (cópia de trabalho; registro oficial permanece em _________)
- [ ] Controle de estoque com rastreio e certificados de peça
- [ ] Apoio ao SGQ (documentos, treinamentos, calibração, NC, subcontratação)

## 2. Registros adotados como oficiais

| Tipo de registro | Oficial no sistema? | Formato de guarda | Prazo retenção |
|------------------|----------------------|-------------------|----------------|
| Ordem de serviço encerrada | [ ] Sim [ ] Não | PDF + ZIP dossiê | ___ anos |
| CRS emitido | [ ] Sim [ ] Não | PDF em `os/OS_<n>/crs.pdf` | ___ anos |
| Assinaturas job card | [ ] Sim [ ] Não | PNG + auditoria | ___ anos |
| Movimentações estoque / peça | [ ] Sim [ ] Não | Linha do tempo + PDF | ___ anos |
| Documentos SGQ controlados | [ ] Sim [ ] Não | PDF anexo + revisão | Conforme MOE |

**Retenção padrão no sistema:** configurável em `sistema_empresa_config.retencao_registros_anos` (padrão 5 anos).

## 3. Limitações declaradas

1. O software **não** substitui o MOM/MCQ certificado; a organização deve atualizar procedimentos.
2. Assinaturas no hangar são **captura gráfica vinculada a usuário autenticado**, não assinatura eletrônica qualificada (ICP-Brasil), salvo integração futura declarada em separado.
3. O fornecedor opera infraestrutura SaaS; backup e restauração são **compartilhados** conforme [05-manual-tecnico.md](./05-manual-tecnico.md) — a organização mantém cópias exportadas para inspeção.
4. Contingência em indisponibilidade segue [08-plano-contingencia.md](./08-plano-contingencia.md).

## 4. Perfis e segregação

Segregação Part 145 implementada conforme [14-perfis-acesso-rbac.md](./14-perfis-acesso-rbac.md). A organização confirma que os perfis atribuídos aos colaboradores refletem as funções reais (mecânico, inspetor, RT, qualidade).

## 5. Solicitação à ANAC

> *“O sistema será utilizado como ferramenta de gestão e geração/armazenamento de registros de manutenção. Solicitamos orientação quanto ao enquadramento, evidências necessárias e procedimento aplicável para demonstração de atendimento aos requisitos regulatórios e, quando aplicável, obtenção de ateste para registros eletrônicos.”*

---

## Assinaturas

| Papel | Nome | Assinatura | Data |
|-------|------|------------|------|
| Responsável Técnico | | | |
| Gestor da qualidade | | | |
| Representante legal (organização) | | | |
| Fornecedor Aero Suite | | | |
