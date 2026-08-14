#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/aerosuite-staging}"
DATA_ROOT="${AEROSUITE_STAGING_DATA_ROOT:-/var/aerosuite-staging}"
TARBALL="${TARBALL:-/tmp/aerosuite-staging-repo.tgz}"

[[ -f "${TARBALL}" ]] || { echo "ERRO: tarball ausente: ${TARBALL}"; exit 1; }
mkdir -p "${INSTALL_DIR}" "${DATA_ROOT}"/{os,empresa-assets,biblioteca,manuals,vitrine-videos,backups,mysql,nginx-maintenance}
tar -xzf "${TARBALL}" -C "${INSTALL_DIR}"
cd "${INSTALL_DIR}"
if [[ ! -f .env.staging ]]; then
  echo "==> Criar segredos exclusivos de staging"
  DB_PASSWORD="$(openssl rand -hex 24)"
  JWT_SECRET="$(openssl rand -hex 32)"
  cat > .env.staging <<EOF
COMPOSE_PROJECT_NAME=aerosuite-staging
AEROSUITE_STAGING_DATA_ROOT=${DATA_ROOT}
STAGING_API_PORT=8180
STAGING_WEB_PORT=8181
STAGING_PUBLIC_URL=https://staging.aerosuite.app
FRONTEND_URL=https://staging.aerosuite.app
MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
QUARKUS_DATASOURCE_DB_KIND=mysql
QUARKUS_DATASOURCE_JDBC_URL=jdbc:mysql://mysql:3306/aerosuite?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo&characterEncoding=UTF-8&useUnicode=true&connectionCollation=utf8mb4_unicode_ci
QUARKUS_DATASOURCE_USERNAME=root
QUARKUS_DATASOURCE_PASSWORD=${DB_PASSWORD}
AERO_SUITE_JWT_SECRET=${JWT_SECRET}
MAIL_MOCK=true
AERO_SUITE_MARKETING_WHATSAPP_ENABLED=false
HTTP_UPDATE_ENABLED=false
QUARKUS_FLYWAY_REPAIR_AT_START=true
EOF
  chmod 600 .env.staging
fi

COMPOSE=(docker compose --env-file .env.staging -p aerosuite-staging -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.staging.yml)
"${COMPOSE[@]}" config -q
"${COMPOSE[@]}" build api web
"${COMPOSE[@]}" up -d mysql

DB_PASSWORD="$(grep '^MYSQL_ROOT_PASSWORD=' .env.staging | cut -d= -f2- | tr -d '\r')"
for _ in $(seq 1 60); do
  docker exec aerosuite-staging-mysql mysqladmin ping -h 127.0.0.1 -uroot -p"${DB_PASSWORD}" --silent >/dev/null 2>&1 && break
  sleep 2
done

if ! docker exec aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite -N -e "SHOW TABLES LIKE 'os';" 2>/dev/null | grep -q '^os$'; then
  echo "==> Importar schema base de domínio no staging"
  BASE_SCHEMA_FILES=(
    backend/EstruturaBanco/aerosuite_fabricante.sql
    backend/EstruturaBanco/aerosuite_product.sql
    backend/EstruturaBanco/aerosuite_fcu.sql
    backend/EstruturaBanco/aerosuite_os.sql
    backend/EstruturaBanco/aerosuite_associacao_fcu.sql
    backend/EstruturaBanco/aerosuite_tipo_servico.sql
    db/scripts/create_proposta_comercial.sql
    db/scripts/create_cliente_proposta.sql
    db/scripts/create_chat_tables.sql
    db/scripts/create_chamada_table.sql
    db/scripts/create_ticket_suporte.sql
    db/scripts/create_publicacoes_tecnicas.sql
    db/scripts/bootstrap_estoque_tables.sql
    db/init/usuario_externo.sql
  )
  for schema_file in "${BASE_SCHEMA_FILES[@]}"; do
    [[ -f "${schema_file}" ]] || continue
    echo "  -> ${schema_file}"
    docker exec -i aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite < "${schema_file}"
  done
fi

"${COMPOSE[@]}" up -d api web

for _ in $(seq 1 60); do
  curl -sf http://127.0.0.1:8180/q/health >/dev/null 2>&1 && break
  sleep 3
done
if ! curl -sf http://127.0.0.1:8180/q/health >/dev/null; then
  echo "ERRO: API de staging não ficou saudável"
  "${COMPOSE[@]}" ps
  "${COMPOSE[@]}" logs --tail=160 api
  exit 1
fi
if ! curl -sfI http://127.0.0.1:8181/ >/dev/null; then
  echo "ERRO: frontend de staging não respondeu"
  "${COMPOSE[@]}" ps
  "${COMPOSE[@]}" logs --tail=80 web
  exit 1
fi
echo "OK - staging ativo em 127.0.0.1:8181"
