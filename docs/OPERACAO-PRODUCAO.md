# Operação em produção

Rotinas após go-live. Complementa [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md).

## Backups

| O quê | Frequência | Como |
|-------|------------|------|
| **MySQL** | Diário | `mysqldump` para `/var/aerosuite/backups` + cópia off-site (Hetzner Storage Box, S3, etc.) |
| **Volumes** (`os`, `empresa-assets`) | Diário ou semanal | `tar` ou snapshot |
| **Snapshot VPS** | Semanal | Console Hetzner |

Exemplo dump (MySQL no Compose):

```bash
docker exec aerosuite-mysql-local mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --routines aerosuite \
  | gzip > /var/aerosuite/backups/aerosuite-$(date +%F).sql.gz
```

Testar **restore** em staging trimestralmente.

## Monitorização mínima

- [ ] Health: `GET /api/public/sistema-empresa/branding` ou login smoke
- [ ] Disco: `df -h /var/aerosuite`
- [ ] RAM/CPU: `docker stats` ou métricas Hetzner
- [ ] Logs: `docker compose ... logs --tail=200 api`
- [ ] Quarkus: `/q/health` (se exposto internamente)

Alertas sugeridos: disco > 80 %, container `api` reiniciando, 5xx no Tunnel.

## Atualização de versão

1. Backup MySQL + snapshot
2. Staging com mesmo JAR/imagem — smoke + caminho crítico (OS ou proposta)
3. Produção:

```bash
git fetch && git checkout <tag-ou-commit>
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml build api web
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml up -d
```

4. Verificar Flyway nos logs (migrações novas)
5. Smoke login + menu

## Rollback

1. `docker compose ... up -d` com imagem/tag anterior (manter tag Docker ou commit Git)
2. Se migração Flyway irreversível: restore dump **anterior** à release

`QUARKUS_FLYWAY_REPAIR_AT_START=false` em produção; não usar repair automático exceto incidente documentado.

## Segurança

- Rodar `validate-production-env` após alterar `.env`
- Rotacionar `AERO_SUITE_JWT_SECRET` exige logout de todos os utilizadores
- Não commitar `.env` / `.env.production`
- MySQL sem porta pública

## Suporte multi-tenant

- Provisão: `/organizacoes` ou `POST /api/tenants` (só tenant default)
- Isolamento: `scripts/test/api-tenant-isolation.ps1`
- Doc: [SPRINT1-ISOLAMENTO-TENANT.md](./SPRINT1-ISOLAMENTO-TENANT.md)
