#!/usr/bin/env bash
# Cria tunnel Cloudflare novo para produção Aero Suite (Vultr).
# Pré-requisito: cloudflared tunnel login (cert.pem em /root/.cloudflared/)

set -euo pipefail

TUNNEL_NAME="${TUNNEL_NAME:-aerosuite-prod}"
CF_DIR="/root/.cloudflared"
ORIGIN="${ORIGIN:-http://127.0.0.1:8081}"

if [[ ! -f "${CF_DIR}/cert.pem" ]]; then
  echo "ERRO: ${CF_DIR}/cert.pem ausente. Rode: cloudflared tunnel login"
  exit 1
fi

echo "==> Criar tunnel ${TUNNEL_NAME}"
if cloudflared tunnel list 2>/dev/null | grep -q "${TUNNEL_NAME}"; then
  TUNNEL_ID="$(cloudflared tunnel list | awk -v n="${TUNNEL_NAME}" '$2 == n {print $1; exit}')"
  echo "Tunnel existente: ${TUNNEL_ID}"
else
  cloudflared tunnel create "${TUNNEL_NAME}"
  TUNNEL_ID="$(cloudflared tunnel list | awk -v n="${TUNNEL_NAME}" '$2 == n {print $1; exit}')"
fi

CRED="${CF_DIR}/${TUNNEL_ID}.json"
if [[ ! -f "${CRED}" ]]; then
  echo "ERRO: credentials ${CRED} nao encontrado"
  exit 1
fi

echo "==> DNS routes"
for host in app.aerosuite.app app.aerosuite.com.br search.aerosuite.app search.aerosuite.com.br; do
  cloudflared tunnel route dns "${TUNNEL_ID}" "${host}" || true
done

echo "==> Config ${CF_DIR}/config.yml"
cat > "${CF_DIR}/config.yml" <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CRED}

ingress:
  - hostname: app.aerosuite.app
    service: ${ORIGIN}
    originRequest:
      httpHostHeader: app.aerosuite.app
  - hostname: app.aerosuite.com.br
    service: ${ORIGIN}
    originRequest:
      httpHostHeader: app.aerosuite.com.br
  - service: http_status:404
EOF

cp "${CRED}" /etc/cloudflared/"${TUNNEL_ID}.json"
cp "${CF_DIR}/config.yml" /etc/cloudflared/config.yml
chmod 600 /etc/cloudflared/* "${CF_DIR}/config.yml" "${CRED}"

cat > /etc/systemd/system/cloudflared.service <<'UNIT'
[Unit]
Description=cloudflared Aero Suite
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/cloudflared --no-autoupdate --config /etc/cloudflared/config.yml tunnel run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable cloudflared
systemctl restart cloudflared
sleep 8
systemctl is-active cloudflared
journalctl -u cloudflared -n 10 --no-pager

echo "OK: tunnel ${TUNNEL_NAME} (${TUNNEL_ID})"
echo "Teste: https://app.aerosuite.app"
