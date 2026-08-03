# 5. Manual técnico

Documento consolidado para auditores de TI e qualidade. Detalhes operacionais: [HOSPEDAGEM-PRODUCAO.md](../HOSPEDAGEM-PRODUCAO.md), [DEPLOY-PRODUCAO.md](../DEPLOY-PRODUCAO.md), [OPERACAO-PRODUCAO.md](../OPERACAO-PRODUCAO.md).

## 5.1 Arquitetura lógica

```text
Browser (Angular PWA)
    → nginx / Cloudflare
        → API Quarkus (:8080)
            → MySQL (:3306)
            → Volumes: os/, estoque-certificados/, sgq-documentos/, backups/
```

Camadas backend: `api` → `service` → `domain` → Flyway `db/migration`.

## 5.2 Banco de dados — tabelas regulatórias

| Tabela | Finalidade |
|--------|------------|
| `os` | Ordem de serviço + campos CRS |
| `os_auditoria` | Trilha imutável append-only de alterações |
| `os_job_card_apontamento` | Horas de execução |
| `os_job_card_assinatura` | Assinaturas EXECUCAO / INSPECAO |
| `acesso_auditoria` | Login, RBAC, eventos de acesso |
| `log_acesso_externo` | Portal cliente |
| `item_estoque` | P/N, S/N, certificado, quarentena |
| `movimentacao_estoque` | Saídas/consumos rastreáveis |
| `sgq_documento_controlado` | Documentos MOE/POP |
| `conformidade_*` | Treinamento, calibração, NC, subcontratação |
| `usuario_habilitacao_tecnica` | RT, inspetor, mecânico |
| `sistema_empresa_config` | Retenção, flags enforcement |
| `backup_config` / `backup_history` | Agendamento e histórico backup |

Migrações conformidade: `V23`–`V37`, `V56`–`V60` (ver Flyway).

## 5.3 Segurança

| Controle | Implementação |
|----------|---------------|
| Autenticação | JWT (`JwtAuthenticationFilter`) |
| Autorização | `@RequiresFuncionalidades`, perfis por tenant |
| Senha | Hash, histórico (`PasswordHistory`), mínimo 8 caracteres |
| Isolamento tenant | `@TenantId`, `TenantDataAccess` |
| Rate limit | APIs públicas |
| LGPD | Consentimento, solicitações titular |
| Auditoria | `os_auditoria`, `acesso_auditoria` |

**Pendente:** MFA backend para perfis críticos (REQ-023).

## 5.4 Logs e auditoria

- **OS:** toda criação/alteração/exclusão/arquivo → `os_auditoria` (usuário, IP, user-agent, valores anterior/novo).
- **Acesso:** login sucesso/falha, mudanças RBAC → `acesso_auditoria`.
- **Export:** dossiê inclui amostra dos últimos 80 eventos de acesso interno.

Consulta: `GET /api/os-auditoria/*`, `GET /api/access-audit/*` (operador plataforma).

## 5.5 Backup e retenção

| Item | Detalhe |
|------|---------|
| Backup BD | UI `/settings/backup` — `BackupConfigResource` |
| Agendamento | Configurável por tenant/admin |
| Arquivos | Volumes Docker: `/var/aerosuite/{os,backups,...}` |
| Retenção registros | `retencao_registros_anos` (1–50, padrão 5) |
| Arquivo morto | ZIP filtrado por data de fechamento |

**Procedimento de restauração:** documentado em [08-plano-contingencia.md](./08-plano-contingencia.md) — executar teste semestral e arquivar ata.

## 5.6 Integrações

| Integração | Uso | Impacto regulatório |
|------------|-----|---------------------|
| SMTP | E-mails transacionais | Notificações, não registro oficial |
| Bling | Comercial/fiscal | Fora do escopo CRS |
| Portal externo | Cliente | Somente leitura concedida |

## 5.7 Versionamento e deploy

- **Schema:** Flyway versionado (`V{n}__*.sql`).
- **Aplicação:** releases via pipeline; notas em `SistemaAtualizacao`.
- **Controle de mudanças:** [11-controle-mudancas.md](./11-controle-mudancas.md).

## 5.8 Configurações regulatórias (tenant)

| Flag / config | Efeito |
|---------------|--------|
| `estoque.saida.exigeCertificadoPeca` | Bloqueia saída sem certificado |
| `bloquearCalibracaoVencida` | Enforcement calibração |
| `bloquearTreinoObrigatorio` | Hangar + CRS |
| `bloquearSubcontratacaoVencida` | Vínculo OS |
| `retencao_registros_anos` | Política de guarda |

API: `GET/PUT /api/conformidade/enforcement`, `GET/PUT /api/conformidade/retencao`.
