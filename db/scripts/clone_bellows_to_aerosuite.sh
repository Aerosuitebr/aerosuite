#!/usr/bin/env bash
# Clona MySQL bellows → aerosuite (estrutura + dados).
# Uso: ./clone_bellows_to_aerosuite.sh [senha_root]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SOURCE_DB="${SOURCE_DB:-bellows}"
TARGET_DB="${TARGET_DB:-aerosuite}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
DOCKER_CONTAINER="${DOCKER_CONTAINER:-}"
DROP_TARGET="${DROP_TARGET:-1}"

if [[ -n "${1:-}" ]]; then
  export MYSQL_PWD="$1"
elif [[ -z "${MYSQL_PWD:-}" ]]; then
  read -rsp "Senha MySQL ($MYSQL_USER): " MYSQL_PWD
  echo
  export MYSQL_PWD
fi

mysql_cli() {
  if [[ -n "$DOCKER_CONTAINER" ]]; then
    docker exec -i "$DOCKER_CONTAINER" mysql -u"$MYSQL_USER" -p"$MYSQL_PWD" "$@"
  else
    mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PWD" "$@"
  fi
}

mysqldump_cli() {
  local args=(--single-transaction --routines --triggers --events
    --set-gtid-purged=OFF --column-statistics=0 --default-character-set=utf8mb4 "$SOURCE_DB")
  if [[ -n "$DOCKER_CONTAINER" ]]; then
    docker exec "$DOCKER_CONTAINER" mysqldump -u"$MYSQL_USER" -p"$MYSQL_PWD" "${args[@]}"
  else
    mysqldump -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PWD" "${args[@]}"
  fi
}

exists_db() {
  mysql_cli -N -e \
    "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='$1'" 2>/dev/null | grep -qx "$1"
}

echo "=== Clone: $SOURCE_DB → $TARGET_DB ==="

if ! exists_db "$SOURCE_DB"; then
  echo "ERRO: base '$SOURCE_DB' não existe." >&2
  exit 1
fi

if exists_db "$TARGET_DB" && [[ "$DROP_TARGET" == "1" ]]; then
  echo "A recriar $TARGET_DB ..."
  mysql_cli -e "DROP DATABASE IF EXISTS \`$TARGET_DB\`; CREATE DATABASE \`$TARGET_DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
elif ! exists_db "$TARGET_DB"; then
  mysql_cli -e "CREATE DATABASE \`$TARGET_DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

echo "A copiar dados ..."
mysqldump_cli | mysql_cli "$TARGET_DB"

POST_SQL="$ROOT/db/scripts/post_clone_aerosuite_rebrand.sql"
if [[ -f "$POST_SQL" ]]; then
  echo "Pós-migração ..."
  mysql_cli "$TARGET_DB" < "$POST_SQL"
fi

if [[ -f "$ROOT/.env" ]] && grep -q '/bellows' "$ROOT/.env" 2>/dev/null; then
  sed -i.bak 's|/bellows|/aerosuite|g' "$ROOT/.env"
  echo "Atualizado .env (backup .env.bak)"
fi

echo "OK. Reinicie a API e use jdbc:mysql://.../$TARGET_DB"
