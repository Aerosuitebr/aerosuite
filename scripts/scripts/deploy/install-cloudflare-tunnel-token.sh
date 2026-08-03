#!/usr/bin/env bash
# Instala cloudflared com token do painel Cloudflare (Zero Trust → Tunnels → Install connector).
# Uso: TUNNEL_TOKEN='eyJ...' bash install-cloudflare-tunnel-token.sh

set -euo pipefail

TOKEN="${TUNNEL_TOKEN:-${1:-}}"
if [[ -z "${TOKEN}" ]]; then
  echo "ERRO: informe TUNNEL_TOKEN ou passe como argumento."
  echo "Painel: Zero Trust → Networks → Tunnels → aerosuite-prod → Install connector"
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  curl -fsSL -o /tmp/cloudflared.deb \
    https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i /tmp/cloudflared.deb
  rm -f /tmp/cloudflared.deb
fi

systemctl stop cloudflared 2>/dev/null || true
cloudflared service uninstall 2>/dev/null || true
cloudflared service install "${TOKEN}"
systemctl enable cloudflared
systemctl restart cloudflared
sleep 8
systemctl is-active cloudflared
journalctl -u cloudflared -n 12 --no-pager

echo "OK. Teste: https://app.aerosuite.app"
