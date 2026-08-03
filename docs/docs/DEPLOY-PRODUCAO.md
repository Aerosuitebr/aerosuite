# Deploy em produção — checklist

Ambiente alvo: **Ubuntu 24.04**, **Hetzner CPX31** (ou equivalente), **Docker Compose**, domínio no **Cloudflare**.

Índice geral: [PRODUTO-FINAL-INDICE.md](./PRODUTO-FINAL-INDICE.md)

---

## Fase 1 — Servidor

- [x] VPS definido: **Hetzner CPX31** (ver [DECISAO-VPS.md](./DECISAO-VPS.md)) — criar instância EU (`fsn1` ou `nbg1`)
- [ ] SO: **Ubuntu 24.04**; instalar **Docker CE** + plugin Compose (one-click ou `scripts/deploy/bootstrap-linux.sh`)
- [ ] Utilizador com SSH por chave (desativar password root)
- [ ] Firewall: SSH restrito; sem MySQL público
- [ ] Criar pastas de dados:

```bash
sudo mkdir -p /var/aerosuite/{os,empresa-assets,biblioteca,manuals,backups,mysql}
sudo chown -R "$USER:$USER" /var/aerosuite
```

---

## Fase 2 — Código e variáveis

- [ ] Clonar repositório em `/opt/aerosuite` (ou deploy por CI)
- [ ] `cp .env.example .env` e editar credenciais base
- [ ] `cp .env.production.example .env.production`
- [ ] Definir obrigatoriamente:
  - `FRONTEND_URL=https://app.seudominio.com`
  - `AERO_SUITE_JWT_SECRET` (≥ 32 chars, aleatório)
  - `MYSQL_ROOT_PASSWORD` forte (se usar MySQL no Compose)
  - `QUARKUS_MAILER_PASSWORD` (SendGrid)
- [ ] **Não** definir `MAIL_MOCK=true` em produção
- [ ] Billing Stripe (se aplicável): [STRIPE-PRODUCAO.md](./STRIPE-PRODUCAO.md)
- [ ] Validar: `pwsh ./scripts/deploy/pre-deploy-check.ps1 -Strict` (env + Compose) ou `pwsh ./scripts/validate-production-env.ps1`

---

## Fase 3 — Base de dados

**Opção A — MySQL no Compose (piloto):**

```bash
cd /opt/aerosuite
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml up -d --build
```

- [ ] Logs: Flyway até **V60** sem erro (`.\scripts\test\verify-flyway.ps1`)
- [ ] Se migrar de ambiente existente: restaurar dump **antes** ou após primeira subida conforme playbook em [OPERACAO-STAGING.md](./OPERACAO-STAGING.md)

**Opção B — MySQL gerido (escala):**

- Omitir `docker-compose.local-mysql.yml`
- JDBC em `.env.production` apontando para host gerido com SSL

---

## Fase 4 — Smoke pós-deploy

No servidor ou na máquina de ops (com API exposta via Tunnel):

```bash
curl -sf http://127.0.0.1:8081/ | head
curl -sf -X POST http://127.0.0.1:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@aerosuite.com","password":"***","tenantCodigo":"default"}'
```

- [ ] Login plataforma no browser
- [ ] Menu carrega (`/api/funcionalidades/meu-menu`)
- [ ] `/organizacoes` acessível (operador default)
- [ ] Opcional: `scripts/test/api-smoke.ps1` com `AEROSUITE_API_URL` / `AEROSUITE_WEB_URL`

---

## Fase 5 — Cloudflare

- [ ] DNS do domínio no Cloudflare
- [ ] Tunnel → `http://localhost:8081` — [CLOUDFLARE_TUNNEL.md](./CLOUDFLARE_TUNNEL.md)
- [ ] SSL: Full ou Flexible conforme doc
- [ ] Atualizar `FRONTEND_URL` para URL pública final

---

## Fase 6 — Operação

- [ ] Backups: ver [OPERACAO-PRODUCAO.md](./OPERACAO-PRODUCAO.md)
- [ ] Snapshot Hetzner semanal
- [ ] Documentar credenciais em cofre (1Password, Bitwarden, etc.)

---

## Comandos úteis

```bash
# Logs
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml logs -f api

# Atualizar release
git pull origin master   # ou deploy CI
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml up -d --build

# Parar
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml down
```

---

## Staging antes de produção

Sempre validar migrações e release em staging: [OPERACAO-STAGING.md](./OPERACAO-STAGING.md).
