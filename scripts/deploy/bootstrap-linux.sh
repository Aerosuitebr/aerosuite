#!/usr/bin/env bash
# Prepara Ubuntu 24.04 para Aero Suite (Docker + pastas de dados).
# Uso no servidor: curl -sSL ... | bash   ou   ./scripts/deploy/bootstrap-linux.sh

set -euo pipefail

AEROSUITE_DATA_ROOT="${AEROSUITE_DATA_ROOT:-/var/aerosuite}"

echo "==> Pastas de dados em ${AEROSUITE_DATA_ROOT}"
sudo mkdir -p "${AEROSUITE_DATA_ROOT}"/{os,empresa-assets,biblioteca,manuals,vitrine-videos,backups,mysql}
sudo chown -R "${USER}:${USER}" "${AEROSUITE_DATA_ROOT}"

if ! command -v docker >/dev/null 2>&1; then
  echo "==> Instalar Docker (get.docker.com)"
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "${USER}"
  echo "Reinicie a sessão SSH para usar docker sem sudo."
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERRO: Docker Compose plugin não encontrado após instalação."
  exit 1
fi

echo "OK: Docker $(docker --version)"
echo "OK: $(docker compose version)"
echo "Próximo: clonar repo, .env + .env.production, ver docs/DEPLOY-PRODUCAO.md"
