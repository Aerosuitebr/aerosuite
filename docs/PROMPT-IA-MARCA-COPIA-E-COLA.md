# Aero Suite — Prompts copia e cola para IA (pacote completo)

Use este arquivo ao pedir a nova identidade a uma IA de imagem (ChatGPT, Ideogram, Midjourney, Flux, etc.).

**Ordem recomendada:** cole o **Bloco 0** uma vez → depois cole **um bloco por vez** (1 a 6). Não peça tudo numa imagem só — wordmark claro e escuro precisam ser entregas separadas.

**Referência técnica do app:** footer e sidebar = fundo escuro → wordmark **branco**; home e telas claras → wordmark **navy**; favicon = símbolo simplificado + fundo sky (gerado depois no projeto).

---

## Bloco 0 — Brief mestre (cole primeiro)

```
You are a senior brand designer for B2B aviation enterprise SaaS.

Brand name: Aero Suite
Tagline (do not always render in logo): Gestão aeronáutica
Product: MRO platform — work orders, FCU/airworthiness, inventory traceability, commercial proposals, compliance, multi-tenant cloud. Metaphor: digital cockpit / integrated flight deck where operations, maintenance and inventory converge.

Visual DNA (strict palette):
- Navy #0f172a (primary dark UI)
- Slate #1e293b
- Sky #38bdf8 and #0284c7 (accent, favicon gradient)
- Gold #c9a227 (micro-accent only, max 5% of mark)
- Light UI background #f1f5f9

Style: geometric precision, instrument-panel metaphor (horizon arc, gauge ring, flight path vector, 3 connected nodes = modules). Premium Swiss-style flat logo. NOT cartoon airplane, NOT wings clipart, NOT airline livery, NOT photorealistic aircraft.

I will request these deliverables ONE AT A TIME (separate images):
1) Logomark full color, transparent PNG
2) Logomark white monochrome, transparent PNG
3) Wordmark "Aero Suite" DARK (navy text) for light backgrounds
4) Wordmark "Aero Suite" LIGHT (white text) for dark footer/sidebar
5) Favicon source — simplified logomark only, high contrast at 32px
6) Optional sidebar lockup (symbol + white name + muted tagline)

Technical rules for ALL outputs:
- PNG 24-bit with alpha (transparent background unless stated)
- 12–15% safe padding inside canvas
- Strokes readable at 32×32 px (no hairlines, no micro-detail)
- Maximum 3 colors in symbol; wordmarks are 1 color only
- No watermark, no mockup device, no embedded slogan unless asked
- 4096px longest edge when possible

Confirm you understand. Wait for my deliverable number.
```

**Negative prompt universal** (cole junto em toda geração, se a ferramenta tiver campo separado):

```
cartoon airplane, wings clipart, photorealistic aircraft, cockpit photo, busy background, lens flare, heavy drop shadow, neon cyberpunk, rainbow gradient, comic style, handwritten script, illegible text, watermark, mockup on phone, low resolution, blurry, pixelated, embossed leather, Boeing, Airbus, airline logo, military insignia, tourist aviation poster, 3D chrome blob, gradient mesh startup 2015
```

---

## Bloco 1 — Logomark colorido (`LOGO_AERO` base / sidebar)

**Salvar como:** `logomark-color.png` → depois `frontend/src/assets/LOGO_AERO.png` (ou fonte para favicon)

```
Deliverable 1 — LOGOMARK ONLY (no text).

Professional enterprise logomark for "Aero Suite" aviation MRO software.
Abstract geometric symbol: minimal horizon arc merged with a circular instrument gauge ring, a subtle forward flight-path vector, and three small connected nodes (integrated modules: stock, work orders, compliance).

Colors: deep navy #0f172a as main shape, sky blue #38bdf8 as single accent, optional one thin gold line #c9a227 (very small).
Style: ultra-clean flat vector logo, golden-ratio proportions, symmetrical, Behance-quality logo sheet.

Pure transparent background. Centered. Square 1:1 canvas. 15% safe margin. No text. No airplane silhouette. No wings. 8K sharp edges.
```

---

## Bloco 2 — Logomark branco (`logomark-white.png`)

```
Deliverable 2 — LOGOMARK MONOCHROME WHITE.

Same geometric symbol as Deliverable 1 (instrument arc + gauge ring + flight path + three nodes), but ENTIRE mark in pure white #FFFFFF only on transparent background.

For dark navy UI sidebar (#0f172a). Flat vector, no gray, no gradient, no gold. Maximum contrast. Readable at 48px height. Square 1:1, 15% padding. No text.
```

---

## Bloco 3 — Wordmark escuro (`LOGO_LETRA.png` — home, fundos claros)

**Salvar como:** `wordmark-dark.png` → `frontend/src/assets/LOGO_LETRA.png`

```
Deliverable 3 — WORDMARK DARK (for LIGHT backgrounds).

Typography only: "Aero Suite"
Custom geometric sans-serif, slightly wide letter-spacing, open apertures, aviation-industrial precision (not sci-fi, not script).
"Aero" medium weight, "Suite" lighter weight OR subtle vertical rule between words.

TEXT COLOR: solid deep navy #0f172a only. No gradients on letters.
Optional: tiny sky #38bdf8 dot or line under "Suite" (minimal).

Horizontal layout, wide aspect ratio ~4:1, transparent background, pure typography, no icon, no tagline, no mockup. 8K, perfect kerning.
```

---

## Bloco 4 — Wordmark claro (`LOGO_LETRA_LIGHT.png` — footer)

**Salvar como:** `wordmark-light.png` → uso no rodapé (fundo `#0f172a`–`#020617`)

```
Deliverable 4 — WORDMARK LIGHT (for DARK backgrounds).

EXACT same typography and layout as Deliverable 3 ("Aero Suite", same proportions and kerning).

TEXT COLOR: pure white #FFFFFF only. No gray, no navy, no shadow baked into the image.
Transparent background. Horizontal ~4:1. No icon, no tagline, no glow effects in the image.

This file will sit on a dark navy footer — must be high contrast white-on-transparent.
```

---

## Bloco 5 — Fonte do favicon (`favicon-source.png`)

**Salvar como:** `favicon-source.png` → `frontend/src/assets/Aero_suite_logo.png` (ou ajustar script `generate-favicon.mjs`)

```
Deliverable 5 — FAVICON SOURCE (simplified logomark).

Same brand symbol as Deliverable 1 but SIMPLIFIED for 16×32 pixel legibility:
- Thicker strokes (minimum 2px equivalent at 32px size)
- Fewer nodes (3 max), no thin gold lines
- Symbol fills ~70% of canvas center
- Colors: symbol in white OR very light sky #e0f2fe on transparent OR symbol navy on transparent (choose highest contrast)

Square 512×512 or 1024×1024, transparent background, NO text, NO rounded square background in this file (background will be added by our build script as sky gradient #0ea5e9 to #0284c7).

Flat vector, crisp edges, app icon design quality.
```

**Depois no projeto:** `node frontend/scripts/generate-favicon.mjs` e alinhar `theme-color` em `index.html` se mudar a paleta.

---

## Bloco 6 — Lockup sidebar (opcional)

```
Deliverable 6 — SIDEBAR BRAND LOCKUP (optional).

Horizontal brand strip for dark navy software sidebar (#0f172a).
Left: compact logomark (white + sky #38bdf8 accent).
Right: "Aero Suite" in white sans-serif; below it smaller tagline "Gestão aeronáutica" in muted slate #94a3b8.

Aspect ratio ~3.25:1 (e.g. 520×160 px). Flat UI branding. No laptop mockup. No full sidebar chrome — only the brand strip. Restrained sky glow on symbol only.
```

---

## Prompt único — pacote em uma mensagem (só se a IA aceitar múltiplas saídas)

Use se a ferramenta gerar **várias imagens** ou **várias páginas** de uma vez (ex.: GPT com “4 variations”). Caso contrário, prefira Blocos 0→6.

```
Senior B2B aviation SaaS brand designer. Brand: Aero Suite (MRO cockpit software). Palette: navy #0f172a, sky #38bdf8/#0284c7, gold #c9a227 micro-accent. Style: flat geometric instrument-panel metaphor — horizon arc, gauge ring, flight path, 3 nodes. NO cartoon plane, NO wings clipart, NO airline logos.

Generate SIX separate PNG exports with transparent background (except none need colored backdrop):

(1) LOGOMARK color: navy + sky + optional tiny gold, 1:1, 15% margin, no text.
(2) LOGOMARK white monochrome #FFFFFF only, 1:1, same geometry as (1).
(3) WORDMARK "Aero Suite" — navy #0f172a letters only, horizontal 4:1, light UI use.
(4) WORDMARK "Aero Suite" — white #FFFFFF letters only, same layout as (3), dark footer use.
(5) FAVICON SOURCE: simplified (1) for 32px, thicker strokes, 512×512, no text, no background square.
(6) SIDEBAR LOCKUP: white symbol + white "Aero Suite" + gray tagline "Gestão aeronáutica", ~520×160.

All: vector-like, 8K, Behance logo quality, safe padding, max 3 colors in symbols.

Negative: cartoon airplane, wings clipart, photorealistic aircraft, busy background, neon, rainbow gradient, illegible text, watermark, mockup, blurry, Boeing Airbus.
```

---

## Checklist após a IA entregar

| Arquivo | Cor | Onde testar |
|---------|-----|-------------|
| `logomark-color.png` | Navy + sky | Sidebar clara, documentos |
| `logomark-white.png` | Branco | Sidebar navy `#0f172a` |
| `wordmark-dark.png` → `LOGO_LETRA.png` | Navy `#0f172a` | Home hero (fundo claro) |
| `wordmark-light.png` | Branco `#fff` | Footer (fundo escuro) |
| `favicon-source.png` | Simplificado | Reduzir a 32×32 — ainda legível? |

- [ ] Wordmark escuro legível na home (sem sumir no cinza claro)
- [ ] Wordmark claro legível no footer (sem sumir no navy)
- [ ] Símbolo legível em 32×32
- [ ] Não parece companhia aérea — parece **software MRO**
- [ ] Vetorizar no Figma/Illustrator (PNG é rascunho; produção final em SVG)
- [ ] Rodar `node frontend/scripts/generate-favicon.mjs`
- [ ] Atualizar `frontend/src/assets/branding.json` (e `wordmarkLightUrl` se implementado no código)

---

## Onde colocar no repositório

| Entrega IA | Caminho sugerido no projeto |
|------------|----------------------------|
| Logomark color | `frontend/src/assets/LOGO_AERO.png` |
| Wordmark escuro | `frontend/src/assets/LOGO_LETRA.png` |
| Wordmark claro | `frontend/src/assets/LOGO_LETRA_LIGHT.png` (footer) → `node scripts/import-wordmark.mjs --light` |
| Fonte favicon | `frontend/src/assets/Aero_suite_logo.png` |
| Favicons gerados | `frontend/src/favicon.*`, `apple-touch-icon.png` (script) |

Documento complementar: [IDENTIDADE-VISUAL-PROMPTS-IA.md](./IDENTIDADE-VISUAL-PROMPTS-IA.md) (variações criativas A1–A3, mood board, ferramentas).
