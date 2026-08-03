# Aero Suite — Brief e prompts para IA (logo + marca lateral)

> **Copia e cola rápido (footer claro/escuro + favicon + 6 entregas):** [PROMPT-IA-MARCA-COPIA-E-COLA.md](./PROMPT-IA-MARCA-COPIA-E-COLA.md)

Documento para alimentar ferramentas de geração de imagem (Midjourney, DALL·E, Ideogram, Flux, Leonardo, etc.) com o **espírito real** do produto, não um “aviãozinho genérico”.

---

## 1. Essência da marca (contexto obrigatório para a IA)

| Dimensão | Conteúdo |
|----------|----------|
| **Nome** | Aero Suite |
| **Tagline** | Gestão aeronáutica |
| **Proposta** | Plataforma SaaS para **MRO** (Maintenance, Repair & Overhaul): ordens de serviço, FCU, estoque com rastreio, propostas comerciais, conformidade, portal do cliente — **um cockpit digital** onde operação, manutenção e inventário convergem. |
| **Tom** | Precisão de instrumentação, confiança regulatória, software enterprise premium — **não** marketing turístico nem clipart de avião. |
| **Metáfora visual** | **Cockpit / flight deck**: painéis, horizonte sintético, vetores de voo, trilhas de dados, nós de rastreio — **suite** = conjunto integrado de módulos, não uma única função. |
| **Paleta oficial (UI)** | Navy `#0f172a` · Slate `#1e293b` · Sky `#38bdf8` / `#0284c7` · Gold `#c9a227` / `#e8c547` · Fundos claros `#f1f5f9` |
| **Evitar** | Avião cartoon, asas literais óbvias, gradientes “startup 2015”, vermelho alarme dominante, serifas decorativas, 3D pesado com sombras, texto ilegível na imagem, marcas de terceiros (Boeing, Airbus, etc.) |

**Frase-norte para criativos:**  
*“O cockpit onde oficina, estoque e conformidade voam no mesmo painel.”*

---

## 2. Entregáveis desejados

| Artefato | Uso | Formato ideal |
|----------|-----|----------------|
| **A — Símbolo (logomark)** | Favicon, app icon, selo em documentos | Quadrado 1:1, fundo transparente, legível a 32×32 px |
| **B — Wordmark** | Cabeçalhos, propostas comerciais | Horizontal; tipografia custom ou integrada ao símbolo |
| **C — Marca lateral (sidebar)** | Menu escuro do app (`~200–260 px` largura; área do logo `~48–64 px` altura) | Versão **clara sobre navy**; pode ser símbolo + “Aero Suite” compacto ou só símbolo refinado |
| **D — Versão mono** | Gravação, bordado, laser | Branco puro e preto puro |

---

## 3. Parâmetros técnicos para qualidade “impecável”

Use estes parâmetros em **qualquer** ferramenta:

### Resolução e pós-produção
- Gerar no **máximo** suportado (4K se disponível: 4096×4096 para símbolo; 4096×2304 para wordmark).
- Exportar **PNG 24-bit com alpha** (símbolo e sidebar).
- Pedir à IA **vetor** só se a ferramenta suportar (Illustrator “Image Trace” ou recriação manual em Figma — logos finais devem ser vetoriais).

### Composição
- **Margem de segurança**: 12–15% de padding em torno do símbolo (evita corte em favicon).
- **Contraste**: testar símbolo sobre `#0f172a` (sidebar) e sobre `#ffffff` (login claro).
- **Espessura de traço**: mínimo equivalente a 2 px em 64 px de altura — detalhes microscópicos somem no menu.

### Estilo visual recomendado
- **Geometric precision** + **subtle aviation metaphor** (horizon line, arc, waypoint, instrument ring).
- **Flat ou soft 3D** (bevel mínimo); preferir **flat com um único highlight** sky/gold.
- **2–3 cores** no símbolo (navy + sky + opcional gold); wordmark em branco ou navy.

### Negative prompt universal (cole em toda geração)
```
cartoon airplane, wings clipart, photorealistic aircraft, cockpit photo, busy background, 
lens flare, drop shadow blob, neon cyberpunk, rainbow gradient, comic style, 
handwritten script, illegible text, watermark, mockup on phone, 
low resolution, blurry, pixelated, embossed leather texture, 
Boeing Airbus logo, military insignia, airline livery
```

---

## 4. Prompt principal — LOGOMARK (símbolo)

**Copie o bloco em inglês** (melhor resultado na maioria das IAs). Ajuste o nome da ferramenta conforme a interface.

### Prompt A1 — Símbolo “cockpit integrado” (recomendado)

```
Professional enterprise software logomark for "Aero Suite", aviation MRO management platform. 
Abstract geometric symbol: a minimal horizon arc merged with a circular instrument gauge ring, 
a subtle forward vector (flight path) and three small connected nodes suggesting integrated modules 
(stock, work orders, compliance). 

Style: ultra-clean vector logo design, flat design with one soft sky-blue accent (#38bdf8) 
on deep navy (#0f172a), optional thin gold accent line (#c9a227), precise geometric construction, 
golden-ratio proportions, symmetrical balance, premium B2B SaaS aesthetic, Swiss design discipline.

No airplane silhouette, no wings, no photographic elements. 
Centered composition, pure white or transparent background, 
studio lighting for crisp edges, 8K, logo design sheet, Behance quality, 
isolated mark only, no text, no mockup.
```

**Negative:** (use a seção 3)

### Prompt A2 — Símbolo “monograma AS” (alternativa mais corporativa)

```
Minimal monogram logo "AS" for Aero Suite aviation operations software. 
Letters constructed from instrument panel geometry: split horizon line, 
precision corners, aviation dateline aesthetic. 

Flat vector, navy #0f172a and sky #38bdf8 only, 
high legibility at small sizes, geometric sans influence, 
transparent background, logo design, ultra sharp, no 3D render, no airplane.
```

### Prompt A3 — Símbolo “trilha + hangar digital” (ligado ao domínio MRO)

```
Abstract logo mark: stylized aircraft maintenance workflow — 
a single continuous path (traceability) looping through a simplified hangar bay shape, 
forming a cohesive hexagon or rounded square emblem. 

Enterprise software branding, flat vector, navy and sky blue palette, 
gold micro-accent dot at path origin, technical but elegant, 
MRO aviation industry, transparent background, logo sheet, 8K clarity.
```

---

## 5. Prompt principal — WORDMARK

```
Professional wordmark typography: "Aero Suite" — custom geometric sans-serif, 
slightly wide tracking, open apertures, aviation-industrial precision (not futuristic sci-fi). 
"Aero" in medium weight, "Suite" in lighter weight or separated by subtle vertical rule. 

Color: deep navy #0f172a on white background OR white on transparent for dark UI. 
Optional: tiny sky-blue dot or line under "Suite" suggesting data sync. 

Pure typography logo, horizontal layout, vector logo design, 
extremely clean kerning, no icon, no slogan, no mockup, 8K.
```

**Variação com símbolo:** gere símbolo e wordmark **em sessões separadas**; alinhe no Figma. Pedir “logo lockup” na mesma sessão costuma desalinhar kerning.

---

## 6. Prompt principal — MARCA LATERAL (sidebar)

Contexto: menu lateral **fundo navy escuro** (`#0f172a`–`#1e293b`), logo em área ~**260×80 px** lógicos; hoje o produto usa moldura “etched” com imagem em cover.

### Prompt C1 — Lockup sidebar (símbolo + nome)

```
Sidebar brand lockup for dark navy aviation software UI (#0f172a background). 
Left: compact geometric logomark (instrument arc + connected nodes). 
Right: "Aero Suite" wordmark in clean white sans-serif, 
subtitle "Gestão aeronáutica" in smaller muted slate-blue gray. 

Horizontal layout, generous padding, premium enterprise dashboard branding, 
flat UI design, no mockup of laptop, no full sidebar — only the brand strip itself, 
crisp anti-aliased edges, designed for 280px width, 
subtle soft glow on symbol in sky blue (very restrained).
```

### Prompt C2 — Símbolo isolado para sidebar (só ícone)

```
App sidebar icon brand mark, square format, 
geometric aviation operations symbol on solid navy #0f172a rounded rectangle 16px corner radius, 
symbol in white and sky #38bdf8, minimal gold accent, 
flat UI icon style, iOS/macOS quality, 
centered, high contrast, readable at 48px height, 8K, no text.
```

### Prompt C3 — Ilustração “flight deck strip” (marca mais elaborada)

Use só se quiser uma **peça de identidade** mais rica (não substitui logomark simples):

```
Wide horizontal brand illustration for software sidebar header, 3:1 aspect ratio, 
abstract stylized flight deck silhouette: layered panels, horizon glow in sky blue, 
tiny gold status LEDs, depth through flat layers (parallax paper-cut style), 
no text, navy palette, premium aerospace enterprise, 
vector illustration quality, subtle grain, no photorealism.
```

---

## 7. Sugestões para resultados realmente “ultra quality”

### Escolha da ferramenta
| Ferramenta | Melhor para | Dica |
|------------|-------------|------|
| **Ideogram** | Logos com texto | Use modo “Design”; refine “Aero Suite” em passo separado |
| **Midjourney v6** | Símbolos abstratos premium | `--style raw --stylize 150`; `repeat` 4 variações |
| **DALL·E 3 / GPT-4o** | Iteração rápida + editar fundo | Peça “transparent background PNG” explicitamente |
| **Flux Pro (Fal/Replicate)** | Precisão geométrica | Bom para flat vector look |
| **Recraft** | Estilo vector explícito | Ative “vector illustration / logo” |

### Workflow em 5 passos
1. **Brief fixo**: cole a seção 1 + negative prompt em toda conversa.
2. **Símbolo**: gere 20 variações (4 prompts × 5 seeds); escolha 2 finalistas.
3. **Teste de legibilidade**: reduza a 32×32 e 64×64 no Figma; elimine finalistas fracos.
4. **Wordmark**: só depois do símbolo aprovado; alinhe altura-x e baseline.
5. **Sidebar**: exporte lockup em 2× (retina): 520×160 px PNG; versão só ícone 128×128 px.

### Pós-produção profissional (vale o investimento)
- Vetorizar no **Figma** ou **Illustrator** (não usar PNG raster como logo final).
- Unificar espessuras de stroke (ex.: 1,5 px @ 64 px escala).
- Gerar **favicon** ICO/PNG 16, 32, 48, 180, 512 a partir do SVG.
- Atualizar `frontend/src/assets/branding.json` (`logoUrl`, `wordmarkUrl`).

### Checklist de aprovação
- [ ] Legível em 32×32 (favicon)
- [ ] Contraste AA sobre navy e sobre branco
- [ ] Não parece “companhia aérea” — parece **software de manutenção**
- [ ] Máximo 3 cores no símbolo
- [ ] Funciona em monocromático branco
- [ ] Não infringe marcas de aviação conhecidas

---

## 8. Prompt “mestre” único (colar como system / primeira mensagem)

Use isto como **primeira mensagem** em um chat com IA de imagem, depois peça cada entrega:

```
You are a senior brand designer specializing in B2B aviation and enterprise SaaS.

Brand: Aero Suite — "Gestão aeronáutica" (aviation management).
Product: MRO platform — work orders, airworthiness (FCU), inventory traceability, 
commercial proposals, compliance, multi-tenant cloud. Metaphor: digital cockpit / 
integrated flight deck where operations, maintenance and stock converge.

Visual DNA: deep navy #0f172a, slate #1e293b, sky accent #38bdf8, gold accent #c9a227. 
Precision, trust, regulation-ready, premium UI — NOT tourist aviation, NOT cartoon planes.

Deliverables I will request one at a time:
1) Logomark only (transparent PNG, vector-like, 1:1)
2) Wordmark "Aero Suite" only
3) Sidebar lockup for dark navy menu (~280px wide)
4) Monochrome white version

Always: geometric clarity, small-size legibility, 2-3 colors, Behance-level logo craft.
Never: photorealistic aircraft, wings clipart, busy backgrounds, illegible embedded text.

Confirm you understand; then wait for my first deliverable request.
```

**Pedidos seguintes (exemplos):**
- *“Deliverable 1: logomark using Prompt A1 from our brief.”*
- *“Deliverable 3: sidebar lockup, symbol left + white Aero Suite + muted tagline.”*
- *“Remove background, increase contrast, thicken strokes for 48px display.”*

---

## 9. Onde encaixar no produto (referência técnica)

| Arquivo | Uso |
|---------|-----|
| `frontend/src/assets/branding.json` | URLs do logo e wordmark |
| `frontend/src/assets/LOGO_AERO.png` | Logo atual |
| `frontend/src/assets/LOGO_LETRA.png` | Wordmark atual |
| Sidebar `app-layout` | Área `.sidebar-brand-logo-etched` ~6.5rem altura |

Dimensões sugeridas para export:
- `LOGO_AERO.png` — símbolo 512×512 px (transparente)
- `LOGO_LETRA.png` — wordmark ~1200×300 px
- `sidebar-brand.png` — lockup 520×160 px (@2x)

---

## 10. Variações criativas opcionais (se quiser explorar)

Peça à IA **uma mood board** antes do logo:

```
Mood board collage, aviation enterprise software branding, 
deep navy UI dashboards, instrument panels, minimal geometric logos, 
gold and sky blue accents, Swiss typography, 
no airplanes, 4x4 grid, design presentation quality.
```

Isso alinha expectativa antes de gastar créditos no logomark final.

---

*Documento gerado para o repositório Aero Suite — alinhado a `branding.json`, design tokens e copy da home (`home.hero.lead`).*
