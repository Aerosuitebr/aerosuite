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

# Reutiliza a Evolution API do host sem registrar sua chave no repositório.
EVOLUTION_CONTAINER="${AEROSUITE_EVOLUTION_CONTAINER:-aerosuite-evolution-api}"
if docker inspect "${EVOLUTION_CONTAINER}" >/dev/null 2>&1; then
  EVOLUTION_API_KEY="$(docker inspect "${EVOLUTION_CONTAINER}" --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -n 's/^AUTHENTICATION_API_KEY=//p' | head -1)"
  if [[ -n "${EVOLUTION_API_KEY}" ]]; then
    sed -i '/^AERO_SUITE_EVOLUTION_ENABLED=/d;/^AERO_SUITE_EVOLUTION_API_BASE_URL=/d;/^AERO_SUITE_EVOLUTION_ADMIN_API_KEY=/d;/^AERO_SUITE_EVOLUTION_WEBHOOK_BASE_URL=/d' .env.staging
    cat >> .env.staging <<EOF
AERO_SUITE_EVOLUTION_ENABLED=true
AERO_SUITE_EVOLUTION_API_BASE_URL=http://${EVOLUTION_CONTAINER}:8080
AERO_SUITE_EVOLUTION_ADMIN_API_KEY=${EVOLUTION_API_KEY}
AERO_SUITE_EVOLUTION_WEBHOOK_BASE_URL=https://staging.aerosuite.com.br
EOF
  else
    echo "AVISO: Evolution API encontrada, mas a chave administrativa não está disponível"
  fi
else
  echo "AVISO: Evolution API não encontrada; envio por WhatsApp ficará indisponível"
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

PROD_CONTAINER="${AEROSUITE_PRODUCTION_MYSQL_CONTAINER:-aerosuite-mysql-local}"
docker inspect "${PROD_CONTAINER}" >/dev/null 2>&1 || {
  echo "ERRO: container MySQL de produção não encontrado: ${PROD_CONTAINER}"
  exit 1
}
PROD_DB_PASSWORD="$(docker inspect "${PROD_CONTAINER}" --format '{{range .Config.Env}}{{println .}}{{end}}' | sed -n 's/^MYSQL_ROOT_PASSWORD=//p' | head -1)"
[[ -n "${PROD_DB_PASSWORD}" ]] || { echo "ERRO: MYSQL_ROOT_PASSWORD de produção indisponível"; exit 1; }

if [[ ! -f "${DATA_ROOT}/.schema-cloned" ]]; then
  echo "==> Clonar somente estrutura e histórico Flyway da produção"
  docker exec "${PROD_CONTAINER}" mysqldump -uroot -p"${PROD_DB_PASSWORD}" \
    --no-data --routines --triggers --single-transaction --skip-lock-tables aerosuite > /tmp/aerosuite-production-schema.sql
  docker exec "${PROD_CONTAINER}" mysqldump -uroot -p"${PROD_DB_PASSWORD}" \
    --no-create-info --single-transaction --skip-lock-tables aerosuite flyway_schema_history > /tmp/aerosuite-production-flyway.sql

  docker exec aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" -e \
    "DROP DATABASE IF EXISTS aerosuite; CREATE DATABASE aerosuite CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
  docker exec -i aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite < /tmp/aerosuite-production-schema.sql
  docker exec -i aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite < /tmp/aerosuite-production-flyway.sql

  docker exec -i aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite < backend/EstruturaBanco/aerosuite_funcionalidade_seed.sql
  docker exec -i aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite < backend/EstruturaBanco/aerosuite_perfil.sql
  docker exec aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite -e \
    "INSERT INTO tenant (id,codigo,nome,ativo,modulos_habilitados,created_at) VALUES (1,'staging','AeroSuite Staging',1,'MRO,ESTOQUE,COMERCIAL',NOW(6)) ON DUPLICATE KEY UPDATE codigo='staging',nome='AeroSuite Staging',ativo=1,modulos_habilitados='MRO,ESTOQUE,COMERCIAL';"
  docker exec aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite -e \
    "INSERT INTO usuario (nome,email,senha,perfil_id,ativo,data_cadastro,tenant_id,precisa_trocar_senha) SELECT 'Administrador Staging','admin.staging@aerosuite.com','admin123',p.id,1,CURDATE(),1,0 FROM perfil p WHERE p.codigo='ADMIN' ON DUPLICATE KEY UPDATE perfil_id=VALUES(perfil_id),ativo=1,tenant_id=1;"
  touch "${DATA_ROOT}/.schema-cloned"
  rm -f /tmp/aerosuite-production-schema.sql /tmp/aerosuite-production-flyway.sql
fi

# Sincroniza apenas o catálogo técnico de funcionalidades; nenhum dado operacional é copiado.
docker exec "${PROD_CONTAINER}" mysqldump -uroot -p"${PROD_DB_PASSWORD}" \
  --no-create-info --replace --single-transaction --skip-lock-tables aerosuite funcionalidade > /tmp/aerosuite-production-funcionalidade.sql
docker exec -i aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite < /tmp/aerosuite-production-funcionalidade.sql
rm -f /tmp/aerosuite-production-funcionalidade.sql

# Reaplica o perfil administrativo em todos os deploys, inclusive quando o banco já foi inicializado.
docker exec aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite -e \
  "UPDATE usuario u JOIN perfil p ON p.codigo='ADMIN' SET u.perfil_id=p.id,u.ativo=1,u.tenant_id=1 WHERE u.email IN ('admin.staging@aerosuite.com','admin@aerosuite.com');"
docker exec aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite -e \
  "INSERT INTO sistema_empresa_config (id,tenant_id,display_name,tagline,support_email,copyright_entity,browser_title_suffix,logo_url,wordmark_url,primary_color,razao_social,cnpj,endereco_logradouro,endereco_numero,endereco_bairro,cidade,uf,cep,telefone,site_url,onboarding_completo) VALUES (1,1,'AeroSuite','Plataforma MRO','suporte@aerosuite.com.br','AeroSuite','Gestão MRO','assets/LOGO_AERO.png','assets/LOGO_LETRA.png','#0ea5e9','AeroSuite Staging','00000000000191','Ambiente de staging','S/N','Staging','São Paulo','SP','01000-000','(11) 0000-0000','https://staging.aerosuite.com.br',1) ON DUPLICATE KEY UPDATE display_name=VALUES(display_name),tagline=VALUES(tagline),support_email=VALUES(support_email),copyright_entity=VALUES(copyright_entity),browser_title_suffix=VALUES(browser_title_suffix),logo_url=VALUES(logo_url),wordmark_url=VALUES(wordmark_url),primary_color=VALUES(primary_color),razao_social=VALUES(razao_social),cnpj=VALUES(cnpj),endereco_logradouro=VALUES(endereco_logradouro),endereco_numero=VALUES(endereco_numero),endereco_bairro=VALUES(endereco_bairro),cidade=VALUES(cidade),uf=VALUES(uf),cep=VALUES(cep),telefone=VALUES(telefone),site_url=VALUES(site_url),onboarding_completo=1;"

"${COMPOSE[@]}" up -d api web

if docker inspect "${EVOLUTION_CONTAINER}" >/dev/null 2>&1; then
  EVOLUTION_NETWORK="$(docker inspect "${EVOLUTION_CONTAINER}" --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' | head -1)"
  if [[ -n "${EVOLUTION_NETWORK}" ]]; then
    docker network connect "${EVOLUTION_NETWORK}" aerosuite-staging-backend 2>/dev/null || true
  fi
fi

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
# Flyway já criou funcionalidades exclusivas desta branch; ADMIN recebe o catálogo completo.
docker exec aerosuite-staging-mysql mysql -uroot -p"${DB_PASSWORD}" aerosuite -e \
  "INSERT IGNORE INTO perfil_funcionalidade (perfil_id,funcionalidade_id) SELECT p.id,f.id FROM perfil p CROSS JOIN funcionalidade f WHERE p.codigo='ADMIN' AND f.ativo=1;"
if ! curl -sfI http://127.0.0.1:8181/ >/dev/null; then
  echo "ERRO: frontend de staging não respondeu"
  "${COMPOSE[@]}" ps
  "${COMPOSE[@]}" logs --tail=80 web
  exit 1
fi
echo "OK - staging ativo em 127.0.0.1:8181"
