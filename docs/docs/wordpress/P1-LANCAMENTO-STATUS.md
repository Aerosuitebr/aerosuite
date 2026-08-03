# P1 — status de lançamento (atualizado 2026-06-03)

Última verificação: deploy perf + Complianz + PageSpeed 85 + purge Cloudflare (2026-06-04).

## Resumo executivo

| Fase | Progresso | Critério |
|------|-----------|----------|
| **P0** (bloqueadores) | **100%** | `wpformsOk`, `sitemapOk`, deploy footer |
| **P1** (medição + indexação) | **100%** | GA4 conversões + GSC sitemap + indexação |
| **P2** (confiança + performance) | **100%** | PageSpeed **85** ✓; schema OK; portfólio **autorizado** (2026-06-04) |
| **P3** (aquisição) | **~30%** | pacote campanha pronto; ativar Ads/LinkedIn no painel |

**“Pronto para campanha”** = P0 + P1 + PageSpeed ≥ 70 — **concluído** (2026-06-04).

---

## Concluído

| Item | Status | Evidência |
|------|--------|-----------|
| WPForms `/contato/` | OK | `site-audit-result.json` → `wpformsOk: true` (HTTP 200) |
| Sitemap público | OK | `/wp-sitemap.xml` HTTP 200 |
| Calendly embed | OK | iframe `comercial-aerosuite/30min` |
| Schema (home) | OK | Organization, SoftwareApplication, FAQPage |
| `/obrigado/` | OK | HTTP 200 + evento `thank_you_view` no código |
| Permalinks flush | OK | pós-deploy |
| GA4 no site | OK | `G-GLP0ELSN4V` via GTM (`AEROSUITE_SITE`) |
| Eventos no código | OK | `cta_demo`, `cta_whatsapp`, `form_submit`, `calendly_event_scheduled`, `generate_lead`, `thank_you_view` |
| GA4 Tempo real (`/contato/`) | OK | `form_submit`, `generate_lead`, `form_start`, `page_view`, `calendly_widget_loaded` |
| GA4 — 6 eventos principais | OK | `cta_demo`, `cta_whatsapp`, `form_submit`, `calendly_event_scheduled`, `generate_lead`, `thank_you_view` |
| GA4 ↔ Search Console | OK | Vinculação criada (Admin → Vinculações do Search Console) |
| GSC — sitemap | OK | `wp-sitemap.xml` → **Processado** (7 páginas) |
| GSC — indexação prioritária | OK | 14 URLs inspecionadas + **Solicitar indexação** enviado |
| Cloudflare purge | OK | Caching → Purge Everything (2026-06-03) |
| SPF/DMARC DNS | OK | Cloudflare: `_spf.locaweb.com.br`, `_dmarc` `p=none` |
| **Locaweb Email** | **OK** | Painel `painel-email.locaweb.com.br` → domínio **Configurado** |
| Verificação domínio (TXT) | OK | `email-locaweb=821d2df7…` → **Configurado** |
| Entrega MX/SPF/DMARC | OK | 4× MX + SPF + DMARC → **Configurado** (Atualizar status) |
| E-mails autorização portfólio | Enviados | Bellows + King do Rio via SMTP (`wp_mail` OK) |
| Respostas autorização portfólio | **OK** | Bellows + King — **DE ACORDO** (2026-06-04) — ver `PORTFOLIO-AUTORIZACAO-EMAILS.md` |
| SMTP WordPress | OK | `email-ssl.com.br:587`, remetente `contato@aerosuite.com.br` |

### Locaweb — notas

- **Apontamento de servidores** (ns1/ns2/ns3 Locaweb) = *Não configurado* — **esperado** (DNS na Cloudflare).
- O doc antigo citava **SMTP Locaweb** (`smtplw.com.br`). Nesta conta só há **Email Locaweb** (caixa postal da hospedagem). Validação correta = painel Email → **Configurar domínio**, não smtplw.

---

## P1 — concluído (2026-06-03)

| # | Item | Resultado |
|---|------|-----------|
| 4 | GA4 — 6 conversões | Todas marcadas como **evento principal** |
| 5 | GSC — sitemap | `https://aerosuite.com.br/wp-sitemap.xml` — status **Processado** |
| 6 | GA4 ↔ GSC | Vinculação ativa |
| 7 | Teste funil | Form + Calendly validados (Tempo real); eventos de lead marcados |
| 8 | Cloudflare purge | Feito |

**URLs com indexação solicitada no GSC:** `/`, `/contato/`, `/solucoes/`, `/sobre/`, `/blog/`, `/aero-suite-vs-planilhas/`, `/casos/`, casos Bellows/King, 5 pilares SEO.

**DebugView GA4** — opcional (GTM); Tempo real basta para operação.

---

## P2 — quase concluído (2026-06-04)

### Medido agora

| Item | Resultado | Meta |
|------|-----------|------|
| **Deploy performance** | OK | `gaps-deploy-result.json` — home + pilares + páginas |
| **Complianz cookieblocker** | **Removido** | Plugin Complianz desativado; banner `as-consent` mantido |
| **PageSpeed mobile** | **85** Performance · 94 A11y · 100 BP · 85 SEO | Performance **≥ 70** ✓ |
| **LCP mobile** | **3,2 s** (antes 5,0 s) | ≤ 2,5 s ideal (opcional) |
| **FCP / TBT / CLS** | 2,7 s / 0 ms / 0,001 | — |
| **Schema (auditoria)** | OK | `Organization`, `SoftwareApplication`, `FAQPage`, `WebSite`, `ItemList` |
| **Cloudflare purge** | OK | Purge Everything pós-Complianz (2026-06-04) |
| **Autorização portfólio** | **OK** | Bellows + King — **DE ACORDO** (2026-06-04) |

Evidência PageSpeed: `pagespeed-mobile-result.json` · [relatório](https://pagespeed.web.dev/analysis/https-aerosuite-com-br/s0xzpzwevs?form_factor=mobile)

### O que mudou (64 → 85)

1. Deploy LCP (preload logo, `decoding="sync"`, hero.js deferido)  
2. Complianz desativado — eliminou `cookieblocker.min.css` render-blocking  

Script: `node run-complianz-perf-fix.mjs`

---

## P3 — ativar no painel

Checklist em `docs/P3-ATIVACAO-CAMPANHA.md`. Resumo:

| # | Ação | Status |
|---|------|--------|
| 1 | Google Ads — campanha pesquisa `mro_software_q2` | Painel Ads |
| 2 | Importar conversões GA4 (`generate_lead`, `calendly_event_scheduled`) | Painel Ads |
| 3 | LinkedIn Sponsored Content — UTM `demo_hangar_q2` | Painel LinkedIn |
| 4 | Ritmo blog 2 posts/mês | Conteúdo |

URLs com UTM prontas em `docs/CAMPANHAS-ADS-LINKEDIN.md`.

---

## Comandos úteis

```powershell
cd docs/wordpress
node run-site-audit.mjs          # → site-audit-result.json
node run-p1-launch.mjs           # checklist automatizado (purge CF se token definido)
```

Cloudflare purge via API (opcional):

```powershell
$env:CLOUDFLARE_API_TOKEN = "seu_token"
$env:CLOUDFLARE_ZONE_ID = "44a7c31ca337648abef38dea0c599e79"
cd docs/wordpress
node run-p1-launch.mjs
```

---

## Links rápidos

| Serviço | URL |
|---------|-----|
| GA4 propriedade | `G-GLP0ELSN4V` — fluxo **Aerosuite** |
| GA4 Admin eventos | Admin → Eventos |
| Search Console | `https://aerosuite.com.br/` |
| Locaweb Email | `https://painel-email.locaweb.com.br/v2/dominios/aerosuite.com.br/configurar` |
| Cloudflare DNS | zona `aerosuite.com.br` |

---

*Reexecutar checklist:* `node run-p1-launch.mjs` + `node run-site-audit.mjs`
