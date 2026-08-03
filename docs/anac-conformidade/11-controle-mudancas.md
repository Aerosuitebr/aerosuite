# 11. Controle de mudanças

## 11.1 Objetivo

Garantir que alterações no Aero Suite (correções, melhorias, migrações de BD) sejam avaliadas quanto ao **impacto regulatório** antes de entrarem em produção na organização usuária.

## 11.2 Classificação de mudanças

| Tipo | Exemplo | Aprovação |
|------|---------|-----------|
| **Corretiva** | Bug em export PDF | Dev + QA |
| **Evolutiva** | Novo campo OS | Dev + QA + RT (se registro oficial) |
| **Regulatória** | Bloqueio OS fechada | RT + Qualidade obrigatório |
| **Infra** | Upgrade MySQL | TI + janela aprovada |
| **Schema** | Flyway V61+ | Backup prévio + smoke |

## 11.3 Fluxo

```text
1. Registro (issue/PR) → descrição + módulos afetados
2. Análise impacto → preencher checklist abaixo
3. Testes → anac-conformidade-evidencias.ps1 + regressão
4. Homologação → ambiente staging / tenant piloto
5. Aceite RT → e-mail ou registro SGQ
6. Deploy produção → comunicado usuários
7. Pós-deploy → smoke 24h + monitoramento
```

## 11.4 Checklist de impacto regulatório

- [ ] Afeta trilha `os_auditoria`?
- [ ] Afeta emissão ou conteúdo do CRS?
- [ ] Afeta segregação de perfis?
- [ ] Afeta retenção/export dossiê?
- [ ] Exige migração de dados existentes?
- [ ] Exige atualização MOM/MCQ ou treinamento?
- [ ] Matriz REQ-xxx atualizada?

## 11.5 Versionamento

| Artefato | Controle |
|----------|----------|
| Código | Git tags / releases |
| BD | Flyway `V{n}__descricao.sql` |
| Manual usuário | `manual-chapters.html` + PDF regerado |
| Dossiê ANAC | Versão neste README (1.0, 1.1…) |
| Notas ao usuário | `SistemaAtualizacao` na UI |

## 11.6 Rollback

1. Restaurar backup BD anterior à migration.
2. Reverter container API para imagem tag anterior.
3. Comunicar RT — avaliar reconciliação de registros criados na versão nova.

## 11.7 Registro de versão em produção

Preencher a cada release na organização piloto:

| Campo | Valor |
|-------|-------|
| Versão implantada | |
| Data | |
| Aprovador RT | |
| Reteste validação (sim/não) | |
| Observações | |
