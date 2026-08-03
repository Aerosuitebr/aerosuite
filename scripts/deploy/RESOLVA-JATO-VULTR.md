# Deploy Resolva Jato no mesmo Vultr do Aerosuite
#
# Servidor: 216.238.102.195
# App: /opt/resolva-jato  → 127.0.0.1:3000
# Tunnel: cloudflared-resolvajato (separado do Aerosuite)
# Código-fonte: D:\Desenvolvimento\hub-recursos-gratis
#
# Setup inicial (Windows):
#   cd D:\Desenvolvimento\hub-recursos-gratis
#   powershell -File scripts\deploy\setup-vultr-resolvajato.ps1
#
# Deploy incremental:
#   powershell -File scripts\deploy\setup-vultr-resolvajato.ps1 -SkipEnv -SkipTunnel

Ver também:
- `D:\Desenvolvimento\hub-recursos-gratis\DOCKER.md`
- `D:\Desenvolvimento\hub-recursos-gratis\docs\CLOUDFLARE_TUNNEL_RESOLVAJATO.md`
- Compose Vultr: `docker-compose.vultr.yml` (sem Caddy; Cloudflare Tunnel)
