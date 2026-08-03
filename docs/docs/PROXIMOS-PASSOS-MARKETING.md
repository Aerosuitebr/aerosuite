# Próximos passos — site Aero Suite

Estado em **junho/2026** após portfólio Bellows, blog (6 posts), LGPD, comparativo e navegação complementar.

## Já no ar (código + deploy)

- Home premium, 5 pilares SEO, 6 posts blog, casos Bellows + King com logo
- Contato Calendly + formulário, `/obrigado/`, analytics de conversão
- Legal (privacidade, termos), segurança, comparativo vs planilhas
- Rodapé institucional, barra de navegação no header, sticky CTA mobile
- Banner cookies LGPD, remarketing opcional (Meta/LinkedIn)
- WPForms + sitemap OK; GA4 conversões + GSC indexação
- Autorização portfólio Bellows + King — **DE ACORDO** (2026-06-04)
- PageSpeed mobile **85**

## Próximo (operação)

| Prioridade | Ação | Doc |
|------------|------|-----|
| **P2** | Primeira campanha Google Ads / LinkedIn com UTMs | `CAMPANHAS-ADS-LINKEDIN.md`, `P3-ATIVACAO-CAMPANHA.md` |

## Próximo lote sugerido (código)

1. Segundo cliente no portfólio (quando houver logo + OK)
2. Vídeo demo YouTube embed na home ou Sobre
3. Lead magnet PDF (checklist MRO) + captura de e-mail
4. Sincronizar menu nativo do tema Extendable com links do `as-supplemental-nav` (evitar duplicata visual)
5. `hreflang` / EN — só se expandir mercado

## Deploy habitual

```bash
cd docs/wordpress
node build-gaps-deploy.mjs
node run-gaps-deploy.mjs
```

Logo de cliente novo: `node run-upload-bellows-logo.mjs` (adaptar para outro arquivo).
