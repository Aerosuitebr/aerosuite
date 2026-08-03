# Aero Suite — assets e deploy WordPress

Artefatos para o site institucional [aerosuite.com.br](https://aerosuite.com.br/).

## Arquivos principais

| Arquivo | Uso |
|---------|-----|
| `aerosuite-premium.css` | Estilos premium (cards showcase, KPI, CTA, WPForms, hero) |
| `capture-app-screenshots.mjs` | Captura telas em app.aerosuite.com.br (login manual ou `AEROSUITE_APP_EMAIL` / `AEROSUITE_APP_PASSWORD`) |
| `apresentacao-jornada-oficina.html` | Slides interativos: oficina → cadastro trial → onboarding → módulos (setas ← →) |
| `record-demo-jornada-oficina.mjs` | Grava vídeo + `GUIA-EDICAO.md` com timestamps para clip promocional |
| `demo-jornada-oficina-scenario.mjs` | Roteiro/capítulos compartilhados (slides + Playwright) |
| `screenshots/web/*.webp` | Versões otimizadas para o site (geradas por `resize-screenshots.mjs`) |
| `snippets/showcase-modules-screenshots.html` | Showcase com `<img>` reais (placeholders `{{URL_*}}`) |
| `aerosuite-phone-mask.js` | Máscara telefone BR nos formulários WPForms |
| `snippets/showcase-modules.html` | Grid de módulos com mockups de UI |
| `snippets/cta-band.html` | Faixa CTA final |
| `browser-deploy.js` | Script de referência para deploy via `wp.apiFetch` |

## Deploy

Com sessão aberta em **wp-admin**, execute no console (ou via CDP):

```js
await window.aerosuiteDeploy() // ver browser-deploy.js
```

Ou use os scripts gerados `expr-*.txt` / `build-*.mjs` após `node build-inline-css-footer.mjs`.

### Máscara de telefone

- Formato: `(DD) NNNNN-NNNN` ou `(DD) NNNN-NNNN`
- Validação no `blur` se o número tiver menos de 10 dígitos
- Injetado no **footer** do tema Extendable (`<script id="aerosuite-phone-mask-js">`)

### Estilos

- Injetados como `<style id="aerosuite-premium-css">` no footer (WordPress bloqueia upload `.css` na mídia por padrão)
- Logo real: `Pictureandletter.png` do repositório (`frontend/src/assets/`)

## Marketing e SEO (pacote completo)

Ver **[MARKETING-SEO-AEROSUITE.md](../MARKETING-SEO-AEROSUITE.md)** — plano, checklist e deploy.

```bash
node build-marketing-deploy.mjs
# Gera .marketing-manifest.json e .deploy-marketing-once.js (~130KB)
```

No wp-admin (console), com pasta servida em `http://127.0.0.1:8765`:

```js
fetch('http://127.0.0.1:8765/.deploy-marketing-once.js').then(r=>r.text()).then(eval)
```

Antes do deploy (opcional mas recomendado), configure GA4 e Calendly:

```bash
node setup-marketing-ids.mjs --ga4 G-... --calendly https://calendly.com/.../...
```

Guia: **[SETUP-GA4-CALENDLY.md](./SETUP-GA4-CALENDLY.md)** — IDs em `aerosuite-site-secrets.local.mjs` (não versionado).

## Páginas atualizadas (IDs)

- **21** — Home (hero + showcase + schema + hub de guias + formulário)
- **20** — Soluções
- **16** — Sobre
- **18** — Contato (Calendly + formulário + tracking)
- **slug `blog`** — Índice do blog
- **5 pilares** — slugs em `aerosuite-site-config.mjs` (`PILLAR_PAGES`)
- **1 post modelo** — `substituir-planilhas-gestao-oficina-mro`
