# Checklist de lançamento — site Aero Suite

Ordem prática para deixar [aerosuite.com.br](https://aerosuite.com.br) pronto para tráfego pago e SEO.

## Automatizado (repositório)

```bash
cd docs/wordpress

# 1. Auditoria pública (sem login)
node run-site-audit.mjs
# → site-audit-result.json

# 2. Correções no WP (permalinks, updates, teste SMTP) — requer wp-storage.json
node run-priority-fixes.mjs

# 3. Republicar footer/CSS/helpers (WPForms helper, performance CSS)
node build-gaps-deploy.mjs
node run-gaps-deploy.mjs
```

## P0 — Bloqueadores

| # | Item | Como validar | Doc |
|---|------|--------------|-----|
| 1 | **WPForms sem HTTP 500** | `run-site-audit.mjs` → `wpformsOk: true` | `WP-FORMS-CONTATO.md` |
| 2 | **Sitemap HTTP 200** | Abrir `/wp-sitemap.xml` | `GSC-OPERACIONAL.md` |
| 3 | **Deploy footer atualizado** | Contato envia ou mostra erro claro + Calendly | `build-gaps-deploy.mjs` |

### Se WPForms continuar 500

1. WP Admin → WPForms → form **#12** → Notificações → desativar e-mail → testar  
2. WP Mail SMTP → teste de envio  
3. Plugins → atualizar todos (6 pendentes)  
4. `WP_DEBUG_LOG` → `wp-content/debug.log`  
5. `node run-wpforms-isolate.mjs` — confirma se SMTP é a causa  

## P1 — Medição e indexação

| # | Item | Onde |
|---|------|------|
| 4 | Marcar conversões GA4 | Admin → Eventos → `cta_demo`, `cta_whatsapp`, `form_submit`, `calendly_event_scheduled`, `generate_lead`, `thank_you_view` |
| 5 | Search Console + sitemap `wp-sitemap.xml` | `GSC-OPERACIONAL.md` |
| 6 | Vincular GA4 ↔ GSC | Admin GA4 |
| 7 | Teste Calendly real | Agendar demo teste; DebugView GA4 |
| 8 | Purgar cache Cloudflare + plugin | Após deploy |

## P2 — Confiança e performance

| # | Item |
|---|------|
| 9 | Autorização escrita Bellows + King do Rio | **OK** — “DE ACORDO” (2026-06-04) — `PORTFOLIO-AUTORIZACAO-EMAILS.md` |
| 10 | [Rich Results Test](https://search.google.com/test/rich-results) na home |
| 11 | [PageSpeed Insights](https://pagespeed.web.dev/) mobile ≥ 70 |
| 12 | Validar schema FAQ + SoftwareApplication (`run-site-audit.mjs`) |

## P3 — Aquisição

| # | Item |
|---|------|
| 13 | Primeira campanha Google Ads / LinkedIn com UTMs | `CAMPANHAS-ADS-LINKEDIN.md` |
| 14 | Remarketing (opcional): `metaPixelId` / `linkedInPartnerId` em secrets |
| 15 | 2 posts/mês no blog |

---

## Critério “pronto para campanha”

Todos **P0** e **P1** (itens 1–8) concluídos, com `site-audit-result.json` mostrando:

```json
{
  "wpformsOk": true,
  "sitemapOk": true,
  "calendlyOk": true,
  "schemaOk": true,
  "obrigadoOk": true
}
```

---

*Junho/2026*
