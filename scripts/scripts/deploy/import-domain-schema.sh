#!/usr/bin/env bash
set -euo pipefail

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

if docker exec -e MYSQL_PWD="${mysql_pwd}" aerosuite-mysql-local mysql -uroot aerosuite -N -e "SHOW TABLES LIKE 'os';" 2>/dev/null | grep -q '^os$'; then
  echo "Schema de dominio ja presente (tabela os)."
  exit 0
fi

echo "==> Importar schema de dominio"
files=(
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
  docker exec -e MYSQL_PWD="${mysql_pwd}" -i aerosuite-mysql-local mysql -uroot aerosuite < "${f}"
done

docker exec -e MYSQL_PWD="${mysql_pwd}" aerosuite-mysql-local mysql -uroot aerosuite -e \
  "INSERT INTO usuario (nome,email,senha,perfil_id,ativo,data_cadastro,precisa_trocar_senha) VALUES ('Administrador','admin@aerosuite.com','admin123',1,1,CURDATE(),0) ON DUPLICATE KEY UPDATE senha='admin123', ativo=1;"

echo "OK: schema de dominio importado."
