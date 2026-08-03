#!/usr/bin/env bash
set -euo pipefail

BACKUP="${1:-/tmp/aerosuite-restore.sql.gz}"
INSTALL_DIR="${INSTALL_DIR:-/opt/aerosuite}"
cd "${INSTALL_DIR}"

mysql_pwd="$(grep '^MYSQL_ROOT_PASSWORD=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)"
if [[ -z "${mysql_pwd}" ]]; then
  mysql_pwd="$(grep '^QUARKUS_DATASOURCE_PASSWORD=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)"
fi
mysql_pwd="${mysql_pwd:-root}"

if ! docker exec -e MYSQL_PWD="${mysql_pwd}" aerosuite-mysql-local mysql -uroot -N -e 'SELECT 1' >/dev/null 2>&1; then
  mysql_pwd="root"
fi

if [[ ! -f "${BACKUP}" ]]; then
  echo "ERRO: backup nao encontrado: ${BACKUP}"
  exit 1
fi

echo "==> Parar API e frontend"
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml stop api web || true

echo "==> Recriar base aerosuite"
docker exec -e MYSQL_PWD="${mysql_pwd}" aerosuite-mysql-local mysql -uroot -e \
  "DROP DATABASE IF EXISTS aerosuite; CREATE DATABASE aerosuite CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"

echo "==> Restaurar ${BACKUP}"
if [[ "${BACKUP}" == *.gz ]]; then
  gunzip -c "${BACKUP}" | docker exec -i -e MYSQL_PWD="${mysql_pwd}" aerosuite-mysql-local mysql -uroot
else
  docker exec -i -e MYSQL_PWD="${mysql_pwd}" aerosuite-mysql-local mysql -uroot < "${BACKUP}"
fi

echo "==> Subir stack"
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml up -d

echo "==> Aguardar API..."
for _ in $(seq 1 60); do
  if curl -sf http://127.0.0.1:8080/q/health >/dev/null 2>&1; then
    echo "OK: API healthy"
    curl -s http://127.0.0.1:8080/q/health
    echo
    curl -sI http://127.0.0.1:8081/ | head -2
    exit 0
  fi
  sleep 3
done

echo "AVISO: API ainda nao respondeu /q/health"
docker ps
docker logs aerosuite-backend --tail 20
