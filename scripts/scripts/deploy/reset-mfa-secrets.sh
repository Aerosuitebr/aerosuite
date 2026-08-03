#!/usr/bin/env bash
# Zera MFA TOTP cifrado (força novo QR no próximo cadastro).
# Uso no servidor: INSTALL_DIR=/opt/aerosuite bash reset-mfa-secrets.sh [email_opcional]

set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/aerosuite}"
EMAIL_FILTER="${1:-}"

cd "${INSTALL_DIR}"

mysql_pwd="$(grep '^MYSQL_ROOT_PASSWORD=' .env.production 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)"
if [[ -z "${mysql_pwd}" ]]; then
  mysql_pwd="$(grep '^MYSQL_ROOT_PASSWORD=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)"
fi
if [[ -z "${mysql_pwd}" ]]; then
  mysql_pwd="$(grep '^QUARKUS_DATASOURCE_PASSWORD=' .env.production 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)"
fi
if [[ -z "${mysql_pwd}" ]]; then
  mysql_pwd="$(grep '^QUARKUS_DATASOURCE_PASSWORD=' .env 2>/dev/null | cut -d= -f2- | tr -d '\r' || true)"
fi
mysql_pwd="${mysql_pwd:-root}"

if ! docker exec -e MYSQL_PWD="${mysql_pwd}" aerosuite-mysql-local mysql -uroot -N -e 'SELECT 1' >/dev/null 2>&1; then
  mysql_pwd="root"
fi

if [[ -n "${EMAIL_FILTER}" ]]; then
  sql="UPDATE usuario SET mfa_enabled=0, mfa_totp_secret=NULL WHERE LOWER(email)=LOWER('${EMAIL_FILTER}');"
else
  sql="UPDATE usuario SET mfa_enabled=0, mfa_totp_secret=NULL WHERE mfa_totp_secret IS NOT NULL;"
fi

echo "==> Reset MFA (${EMAIL_FILTER:-todos com segredo})"
docker exec -e MYSQL_PWD="${mysql_pwd}" aerosuite-mysql-local mysql -uroot aerosuite -e "${sql}"
echo "OK"
