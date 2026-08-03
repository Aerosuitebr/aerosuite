#!/usr/bin/env bash
# Setup completo do Aero Suite em VPS Ubuntu 24.04 (Vultr SP, etc.)
# Chamado por setup-vultr-production.ps1 ou manualmente no servidor.

set -euo pipefail

AEROSUITE_REPO="${AEROSUITE_REPO:-https://github.com/aerosuite-br/aerosuite.git}"
AEROSUITE_BRANCH="${AEROSUITE_BRANCH:-desenv}"
INSTALL_DIR="${INSTALL_DIR:-/opt/aerosuite}"
AEROSUITE_DATA_ROOT="${AEROSUITE_DATA_ROOT:-/var/aerosuite}"
SKIP_COMPOSE_UP="${SKIP_COMPOSE_UP:-0}"

echo "==> Aero Suite — vultr-server-setup (branch=${AEROSUITE_BRANCH})"

if command -v apt-get >/dev/null 2>&1; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq git curl ca-certificates ufw
fi

if command -v ufw >/dev/null 2>&1; then
  echo "==> Firewall (SSH only)"
  ufw --force reset >/dev/null 2>&1 || true
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow OpenSSH
  ufw --force enable
fi

echo "==> Docker + pastas de dados"
if [[ -f /tmp/bootstrap-linux.sh ]]; then
  bash /tmp/bootstrap-linux.sh
elif [[ -f "${INSTALL_DIR}/scripts/deploy/bootstrap-linux.sh" ]]; then
  bash "${INSTALL_DIR}/scripts/deploy/bootstrap-linux.sh"
else
  AEROSUITE_DATA_ROOT="${AEROSUITE_DATA_ROOT}" bash -c "$(curl -fsSL "${AEROSUITE_REPO/raw.githubusercontent.com/github.com}/${AEROSUITE_BRANCH}/scripts/deploy/bootstrap-linux.sh")"
fi

echo "==> Repositório em ${INSTALL_DIR}"
if [[ -f /tmp/aerosuite-repo.tgz ]]; then
  echo "Usando tarball local (/tmp/aerosuite-repo.tgz)"
  rm -rf "${INSTALL_DIR}"
  mkdir -p "${INSTALL_DIR}"
  tar -xzf /tmp/aerosuite-repo.tgz -C "${INSTALL_DIR}" --strip-components=1
elif [[ ! -d "${INSTALL_DIR}/.git" ]]; then
  git clone -b "${AEROSUITE_BRANCH}" --depth 1 "${AEROSUITE_REPO}" "${INSTALL_DIR}"
else
  cd "${INSTALL_DIR}"
  git fetch origin "${AEROSUITE_BRANCH}"
  git checkout "${AEROSUITE_BRANCH}"
  git pull --ff-only origin "${AEROSUITE_BRANCH}" || true
fi

cd "${INSTALL_DIR}"

if [[ -f /tmp/aerosuite.env ]]; then
  mv /tmp/aerosuite.env "${INSTALL_DIR}/.env"
fi
if [[ -f /tmp/aerosuite.env.production ]]; then
  mv /tmp/aerosuite.env.production "${INSTALL_DIR}/.env.production"
fi

if [[ ! -f .env.production ]]; then
  echo "ERRO: .env.production ausente. Rode setup-vultr-production.ps1 no PC."
  exit 1
fi
if [[ ! -f .env ]]; then
  cp .env.example .env
fi

echo "==> Validar Compose"
COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml)
"${COMPOSE[@]}" config -q

import_domain_schema_if_needed() {
  local mysql_pwd
  mysql_pwd="$(grep '^MYSQL_ROOT_PASSWORD=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)"
  if [[ -z "${mysql_pwd}" ]]; then
    mysql_pwd="$(grep '^QUARKUS_DATASOURCE_PASSWORD=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)"
  fi
  mysql_pwd="${mysql_pwd:-root}"
  if docker exec aerosuite-mysql-local mysql -uroot --password="${mysql_pwd}" aerosuite -N -e "SHOW TABLES LIKE 'os';" 2>/dev/null | grep -q '^os$'; then
    echo "Schema de dominio ja presente (tabela os)."
    return 0
  fi
  echo "==> Importar schema de dominio"
  local files=(
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
  for f in "${files[@]}"; do
    [[ -f "${f}" ]] || continue
    echo "  -> ${f}"
    docker exec -i aerosuite-mysql-local mysql -uroot --password="${mysql_pwd}" aerosuite < "${f}"
  done
  docker exec aerosuite-mysql-local mysql -uroot --password="${mysql_pwd}" aerosuite -e \
    "INSERT INTO usuario (nome,email,senha,perfil_id,ativo,data_cadastro,tenant_id,precisa_trocar_senha) VALUES ('Administrador','admin@aerosuite.com','admin123',1,1,CURDATE(),1,0) ON DUPLICATE KEY UPDATE senha='admin123', ativo=1, tenant_id=1;"
}

if [[ "${SKIP_COMPOSE_UP}" == "1" ]]; then
  echo "SKIP_COMPOSE_UP=1 — compose não iniciado."
  exit 0
fi

echo "==> MySQL + schema base"
"${COMPOSE[@]}" up -d mysql
for _ in $(seq 1 60); do
  if docker exec aerosuite-mysql-local mysqladmin ping -h 127.0.0.1 -uroot -p"$(grep '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2-)" --silent 2>/dev/null; then
    break
  fi
  sleep 2
done
import_domain_schema_if_needed

echo "==> Build e subida"
"${COMPOSE[@]}" up -d --build

echo "==> Aguardar serviços..."
sleep 20
curl -sf http://127.0.0.1:8081/ | head -c 120 || echo "(frontend ainda a subir)"
echo ""
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml ps

echo ""
echo "OK. Próximo: Cloudflare Tunnel → localhost:8081 (docs/CLOUDFLARE_TUNNEL.md)"
