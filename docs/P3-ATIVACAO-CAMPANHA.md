# P3 — ativação da primeira campanha

Site **pronto para tráfego pago** (P0+P1+PageSpeed ≥ 70). Ative no painel Ads/LinkedIn.

## Google Ads (pesquisa)

1. **Conta:** Google Ads vinculada ao GA4 `G-GLP0ELSN4V`
2. **Objetivo:** Leads (formulário / Calendly)
3. **Orçamento:** R$ 50–100/dia (~R$ 1.500–3.000/mês)
4. **Campanha:** `mro_software_q2`
5. **Grupos de anúncio:** software gestão oficina aeronáutica · sistema mro brasil · estoque peças aeronáuticas · ordem serviço manutenção aeronaves
6. **URL final (copiar):**

```
https://aerosuite.com.br/contato/?utm_source=google&utm_medium=cpc&utm_campaign=mro_software_q2&utm_content=grupo_os
```

7. **Conversões:** importar do GA4 → `generate_lead`, `calendly_event_scheduled`, `form_submit`

## Campanhas orgânicas (custo zero) — ver `CAMPANHAS-ADS-LINKEDIN.md`

1. GSC indexação: `node run-gsc-campaign-index.mjs` (ou manual no browser)
2. LinkedIn Page + 4 posts orgânicos (`demo_hangar_q2`, etc.)
3. Bing Webmaster + Facebook Debugger (OG cache)

## LinkedIn — campanha orgânica Q2

1. **Público:** Gerente MRO, Diretor técnico, Owner oficina aeronáutica — Brasil
2. **Formato:** Sponsored content (1 post/semana)
3. **URL:**

```
https://aerosuite.com.br/?utm_source=linkedin&utm_medium=social&utm_campaign=demo_hangar_q2
```

4. **Copy sugerida:** ver `docs/CAMPANHAS-ADS-LINKEDIN.md`

## Monitoramento semanal

- GSC → Consultas + páginas
- GA4 → Conversões por `utm_campaign`
- Pausar keywords CTR &lt; 1% sem conversão

---

*Junho/2026 — complemento a `CAMPANHAS-ADS-LINKEDIN.md`.*
