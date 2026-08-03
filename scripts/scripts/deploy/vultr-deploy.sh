#!/usr/bin/env bash
# Deploy incremental no Vultr (código + rebuild api/web). Não altera .env do servidor.
# Uso: INSTALL_DIR=/opt/aerosuite bash vultr-deploy.sh

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/aerosuite}"
TARBALL="${TARBALL:-/tmp/aerosuite-repo.tgz}"

if [[ ! -f "${TARBALL}" ]]; then
  echo "ERRO: tarball ausente: ${TARBALL}"
  exit 1
fi

echo "==> Extrair codigo em ${INSTALL_DIR}"
mkdir -p "${INSTALL_DIR}"
tar -xzf "${TARBALL}" -C "${INSTALL_DIR}"

cd "${INSTALL_DIR}"

if [[ ! -f .env.production ]]; then
  echo "ERRO: .env.production ausente no servidor. Rode setup-vultr-production.ps1 uma vez."
  exit 1
fi

COMPOSE=(docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml)

echo "==> Validar compose"
"${COMPOSE[@]}" config -q

echo "==> Build api + web"
"${COMPOSE[@]}" build api web

echo "==> Subir api + web"
"${COMPOSE[@]}" up -d api web

echo "==> Aguardar health"
for _ in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8080/q/health >/dev/null 2>&1; then
    break
  fi
  sleep 3
done

curl -sf http://127.0.0.1:8080/q/health | head -c 200 || { echo "API health falhou"; exit 1; }
curl -sfI http://127.0.0.1:8081/ | head -1 || { echo "Frontend falhou"; exit 1; }

echo "OK — deploy concluido em ${INSTALL_DIR}"
