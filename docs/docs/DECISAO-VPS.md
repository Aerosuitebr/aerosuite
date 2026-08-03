# Decisão de hospedagem — produção (D1)

**Data:** 2026-05-16  
**Estado:** Aprovada para piloto / go-live inicial

## Decisão

| Item | Escolha |
|------|---------|
| Provedor | **Hetzner Cloud** |
| Tipo | VPS Linux (Docker Compose, volumes em `/var/aerosuite`) |
| Plano piloto | **CPX31** — 4 vCPU, 8 GB RAM, ~160 GB NVMe (Regular Performance) |
| Região | EU — **Falkenstein (`fsn1`)** ou **Nuremberg (`nbg1`)** |
| SO | **Ubuntu 24.04 LTS** + Docker CE + Compose plugin |
| Acesso público | **Cloudflare Tunnel** (API/web em `127.0.0.1`; sem MySQL exposto) |
| Evolução | **CCX23** ou MySQL gerido quando CPU/RAM ou I/O da BD saturarem |

## Não usar em produção

- Planos Cost Optimized com 4 GB RAM (ex. CX21) com API + MySQL no mesmo host.

## Custos orientativos (sem IVA)

| Item | ~€/mês |
|------|--------|
| CPX31 | 14–17 |
| Snapshots | 1–3 |
| SendGrid + Cloudflare Free | variável / 0 |
| **Total infra piloto** | **~20–25** |

## Próximos passos (D2–D4)

1. Criar servidor e correr `scripts/deploy/bootstrap-linux.sh`
2. Seguir [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md) (`.env.production`, Compose, Flyway V16)
3. [CLOUDFLARE_TUNNEL.md](./CLOUDFLARE_TUNNEL.md) + [OPERACAO-PRODUCAO.md](./OPERACAO-PRODUCAO.md)

Detalhe técnico e firewall: [HOSPEDAGEM-PRODUCAO.md](./HOSPEDAGEM-PRODUCAO.md).
