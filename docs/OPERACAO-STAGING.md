# Operação de staging (produção em miniatura)

Objetivo: **testar o mesmo JAR e as mesmas migrações Flyway** contra um banco que **parece produção** (dados, volume, permissões), sem risco para o ambiente real.

## Princípios

1. **Staging = cópia fiel** — schema e dados o mais próximos possível da produção (dump recente; anonimizar e-mail/telefone se necessário).
2. **BD vazia em paralelo** — só para onboarding/CI/Docker local; **não** substitui staging para validar regra de negócio.
3. **Um deploy, um JAR** — o binário que passou em staging é o que sobe em produção.

## Passo a passo sugerido

### 1) Banco

- Restaurar o dump da produção em um MySQL dedicado a staging (outro host, outra instância ou outro schema com cuidado).
- Conferir usuário/senha e `time_zone` alinhados ao que a API usa (`serverTimezone=America/Sao_Paulo` na URL JDBC, se for o caso).

### 2) Variáveis de ambiente na raiz do repositório

- Manter um `.env` “base” (como no `.env.example`) com o que for comum à equipe.
- Para **staging de verdade**, copiar `.env.staging.example` para **`.env.staging`** e ajustar pelo menos:
  - `QUARKUS_DATASOURCE_JDBC_URL` apontando para o MySQL de staging;
  - `FRONTEND_URL` da URL que os testadores abrem;
  - `MAIL_MOCK=true` (ou credenciais de sandbox) para **não** disparar e-mail real para cliente.

Se ainda **não** existir `.env.staging`, o `docker-compose.staging.yml` mesmo assim sobe (só o `.env` vale); o arquivo `.env.staging` é **opcional** no Compose, mas **recomendado** em servidor de staging.

O arquivo `.env.staging` **não** deve ir para o Git (está no `.gitignore`).

### 3) Subir a stack com perfil de staging

Na raiz do projeto:

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml up --build -d
```

O Compose carrega primeiro o `.env` e depois o `.env.staging` — **valores do staging sobrescrevem** o base quando a chave se repete.

### 4) Depois do deploy

- Conferir logs da API: Flyway sem erro; aplicação sobe.
- Smoke mínimo: login, menu por perfil, uma OS ou fluxo que vocês considerem “caminho feliz” crítico.
- **Proposta comercial:** em staging, defina `AERO_SUITE_COMMERCIAL_*` no `.env.staging` alinhado ao `branding.json` e envie um e-mail de teste com `MAIL_MOCK=true` antes de apontar SendGrid real.

### 5) Flyway

- Em staging costuma fazer sentido `QUARKUS_FLYWAY_REPAIR_AT_START=true` para recuperar de testes que deixaram migração pela metade.
- Em produção muitas equipes preferem `QUARKUS_FLYWAY_REPAIR_AT_START=false` e corrigir histórico de forma controlada — definam a política e documentem.

## Paralelo: BD vazia (conveniência)

- Use `docker-compose.local-mysql.yml` quando quiser **subir MySQL + API** sem depender de dump (desenvolvimento, demo, CI).
- Não espere que isso cubra **todo** o modelo relacional da suite de uma vez; vão completando migrações/init conforme a necessidade.

## Staging em Kubernetes (alternativa ao Docker Compose)

Se o ambiente de staging for um **cluster K8s** (em vez de VPS + Compose), use o chart Helm e ServiceMonitor:

- [HELM-STAGING-K8S.md](./HELM-STAGING-K8S.md)
- `.\scripts\deploy\helm-staging-install.ps1`

O dump MySQL e o smoke funcional (§4) aplicam-se da mesma forma; só muda o mecanismo de deploy.

## Referências no repositório

- `.env.example` — variáveis gerais.
- `.env.staging.example` — sobrescritas típicas de staging.
- `docker-compose.staging.yml` — merge com `docker-compose.yml`.
- [HELM-STAGING-K8S.md](./HELM-STAGING-K8S.md) — staging em cluster.
- `docs/IMPLEMENTACAO-PLANO-SAAS.md` — matriz P0/P1 e próximos passos técnicos.
