# 9. Plano de migração e implantação controlada

Baseado no [Kit Go-live 30 dias](../KIT-GOLIVE-30-DIAS.md).

## 9.1 Objetivo

Migrar dados legados e colocar a organização em operação assistida sem interrupção indevida da produção, com aceite formal dos registros.

## 9.2 Fases

| Semana | Atividades | Entregável |
|--------|------------|------------|
| 1 | Tenant, RBAC, habilitações, dossiê | Perfis atribuídos, checklist W1 |
| 2 | Import CSV clientes, FCU, fornecedores | Dados mestres saneados |
| 3 | OS piloto, hangar, AD/SB | 1 OS completa de ponta a ponta |
| 4 | Backup, config enforcement, go-live | Flags regulatórias ativas |
| 5 | SGQ: docs, treinos obrigatórios, painel | Evidências SGQ no pacote |

UI: `/go-live-migracao` — progresso persistido (`PUT /api/go-live-migracao/checklist`).

## 9.3 Origem dos dados

| Origem | Destino | Método |
|--------|---------|--------|
| Planilhas legadas | FCU, clientes, fornecedores | CSV go-live |
| Sistema anterior | OS históricas | Import manual ou script custom |
| Papel | OS encerradas | Digitalização + anexos |

## 9.4 Saneamento

Script demo/homologação: `db/scripts/sanitize-demo-tenant-homologacao.sql` (modelo de anonimização).

Checklist saneamento:

- [ ] P/N e S/N conferidos com etiqueta física
- [ ] Matrículas e FCU sem duplicidade
- [ ] Fornecedores ASL conferidos
- [ ] Habilitações com validade futura
- [ ] Usuários sem perfil genérico compartilhado

## 9.5 Conciliação e aceite

| Critério | Responsável |
|----------|-------------|
| Amostra 10% OS migradas vs fonte | Qualidade |
| Estoque físico vs sistema | Almoxarifado |
| Primeiro CRS no sistema vs processo MOM | RT |
| Assinatura aceite migração | RT + Gerente |

Modelo de aceite: anexar em `evidencias/aceite-migracao-assinado.pdf`.

## 9.6 Piloto controlado

Antes de uso pleno como registro oficial:

1. Operar **30 dias** em paralelo (papel + sistema) OU
2. Operar só no sistema com **revisão 100%** das OS fechadas no período.

Decisão registrada em [02-declaracao-escopo-regulatorio.md](./02-declaracao-escopo-regulatorio.md).
