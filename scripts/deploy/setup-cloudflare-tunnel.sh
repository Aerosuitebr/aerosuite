#!/usr/bin/env bash
# Instala cloudflared e ativa tunnel Aero Suite (produção Vultr).
# Pré-requisito: /etc/cloudflared/config.yml + credentials JSON no servidor.

set -euo pipefail

CF_DIR="/etc/cloudflared"
TUNNEL_ID="${TUNNEL_ID:-6d599ea8-2354-4c3c-9968-5ded651c92fc}"

echo "==> Instalar cloudflared"
if ! command -v cloudflared >/dev/null 2>&1; then
  curl -fsSL -o /tmp/cloudflared.deb \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i /tmp/cloudflared.deb
  rm -f /tmp/cloudflared.deb
fi
cloudflared --version

mkdir -p "${CF_DIR}"
chmod 700 "${CF_DIR}"
if [[ -f "${CF_DIR}/${TUNNEL_ID}.json" ]]; then
  chmod 600 "${CF_DIR}/${TUNNEL_ID}.json"
fi
if [[ -f "${CF_DIR}/config.yml" ]]; then
  chmod 600 "${CF_DIR}/config.yml"
fi

echo "==> Servico systemd cloudflared"
if [[ ! -f "${CF_DIR}/config.yml" ]]; then
  echo "ERRO: ${CF_DIR}/config.yml ausente. Copie antes de rodar este script."
  exit 1
fi

cloudflared --config "${CF_DIR}/config.yml" service install
systemctl enable cloudflared
systemctl restart cloudflared
sleep 3
systemctl is-active cloudflared
systemctl status cloudflared --no-pager | head -15

echo "OK: cloudflared ativo. Confirme hostname no Zero Trust / DNS."
