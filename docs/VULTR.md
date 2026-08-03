# Deploy no VPS Vultr (ecossistema)

Host compartilhado histórico: `216.238.102.195`

| Produto | App local | Tunnel / notas |
|---------|-----------|----------------|
| Resolva Jato | `127.0.0.1:3000` | `cloudflared-resolvajato` — código em `/opt/resolva-jato` |
| MIRA | `search.aerosuite.com.br` | Stack própria (porta app a definir; legado Angular `:4201`) |
| Aerosuite | `aerosuite.com.br` | Site + ops |
| Evolution WhatsApp | | Aerosuite **18082** · Resolva Jato **18083** |

Scripts detalhados do Resolva Jato ficam no repo `resolva-jato` (`scripts/deploy/`).
Este repo concentra a visão de plataforma e docs cruzados.
