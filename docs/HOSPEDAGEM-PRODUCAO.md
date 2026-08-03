# Hospedagem — produção (Aero Suite)

Recomendação alinhada ao deploy Docker Compose do repositório e ao modelo SaaS (multi-tenant numa instância).

> **Decisão registada (D1):** Hetzner **CPX31**, Ubuntu 24.04, EU (`fsn1`/`nbg1`), acesso via Cloudflare Tunnel. Ver [DECISAO-VPS.md](./DECISAO-VPS.md).

## Provedor recomendado: Hetzner Cloud

| Critério | Escolha |
|----------|---------|
| Tipo | **VPS Linux** (controlo total: Docker, volumes, `.env`) |
| Linha | **Regular Performance** (partilhado, tráfego médio) |
| Plano inicial | **CPX31** — 4 vCPU, **8 GB RAM**, ~160 GB NVMe |
| Evolução | **CCX23** (4 vCPU dedicados, 16 GB) se CPU/RAM saturarem |
| **Não** usar em produção | Cost Optimized 4 GB (ex. CX21) com API + MySQL no mesmo host |

**GDPR:** sede na Alemanha; datacenters EU (Falkenstein `fsn1`, Nuremberg `nbg1`) ou Helsinki.

**Utilizadores no Brasil:** latência maior na EU; para otimizar depois: Ashburn (Hetzner USA) ou segundo ambiente regional.

## Arquitetura num servidor (piloto)

```text
Internet → Cloudflare (DNS, SSL, WAF)
        → cloudflared (Tunnel) → 127.0.0.1:8081 (nginx/web)
                                    → api:8080 (rede Docker)
                                    → mysql:3306 (volume /var/aerosuite/mysql)
Volumes: /var/aerosuite/{os,empresa-assets,biblioteca,manuals,backups}
```

Alternativa sem Tunnel: firewall Hetzner com 80/443 abertos e proxy reverso no host (menos recomendado que Tunnel + portas locais).

## Firewall Hetzner (grátis)

| Regra | Porta | Origem |
|-------|-------|--------|
| SSH | 22 | IP fixo da equipa |
| HTTP/HTTPS | 80, 443 | Só se **não** usar Tunnel |
| MySQL | 3306 | **Bloqueado** (rede interna Docker apenas) |

Com `docker-compose.production.yml`, API e web escutam em **127.0.0.1** — acesso público só via Cloudflare Tunnel.

## Dimensionamento

| Carga | VPS | Notas |
|-------|-----|-------|
| Piloto 1–10 orgs | CPX31 | MySQL no mesmo host |
| Crescimento | CCX23 ou MySQL gerido | Separa BD quando listagens/OS ficarem lentas |
| Staging | CPX21 | Snapshot ou dump anonimizado |

## Custos orientativos (Hetzner, sem IVA)

| Item | ~€/mês |
|------|--------|
| CPX31 | 14–17 |
| Snapshots backup | 1–3 |
| SendGrid | plano à parte |
| Cloudflare | Free tier suficiente no início |
| **Total infra piloto** | **~20–25** |

## Próximo passo

Seguir [DEPLOY-PRODUCAO.md](./DEPLOY-PRODUCAO.md) após criar o servidor Ubuntu 24.04 com app **Docker CE** (one-click Hetzner).
