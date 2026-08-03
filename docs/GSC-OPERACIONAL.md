# Google Search Console — passo a passo (Aero Suite)

Checklist operacional para indexação e baseline de métricas.

## 1. Propriedade

1. Acesse [Google Search Console](https://search.google.com/search-console).
2. Use a propriedade de **domínio**: **`aerosuite.com.br`** (`sc-domain:aerosuite.com.br`) — é a que tem acesso verificado.
3. O prefixo `https://aerosuite.com.br/` pode dar *“sem acesso”* na conta atual; prefira sempre o domínio.
4. Link direto: `https://search.google.com/search-console?resource_id=sc-domain%3Aaerosuite.com.br`

## 1.1 Logo da marca nos resultados do Google

O site publica **Organization** em JSON-LD com logo quadrado:

- URL: `https://aerosuite.com.br/wp-content/uploads/2026/06/aerosuite-site-icon-512.png` (512×512)

**Logo nos resultados:**

1. O site já envia **Organization** + logo 512×512 no JSON-LD (todas as páginas principais).
2. No GSC desta propriedade **não há** menu separado “Informações da empresa” (depende do país/tipo de conta).
3. O Google usa o schema + sinal de marca; confirme que a imagem abre em aba anônima (HTTP 200).
4. Opcional: [Perfil da Empresa no Google](https://business.google.com/) com o mesmo logo.

**Importante:** o Google **não garante** logo nem sitelinks em toda busca; pode levar semanas após reindexação. A meta description e os links extras no snippet dependem do algoritmo — o site envia `meta description`, bloco “Explore a Aero Suite” e `ItemList` schema com âncoras (`#prontidao-regulatoria`, `#recursos`, etc.).

**Inspeção de URL** (barra superior do GSC) → cole cada URL → **Solicitar indexação**.

| URL | Status (04/06/2026) |
|-----|---------------------|
| `https://aerosuite.com.br/` | **Indexada** |
| `https://aerosuite.com.br/solucoes/` | Detectada, **não indexada** — solicitar de novo quando a cota diária liberar |
| `https://aerosuite.com.br/contato/` | Inspecionar e solicitar (cota: ~10 pedidos/dia por propriedade) |

Automação: `node run-gsc-logo-index.mjs` (salva sessão em `gsc-storage.json`).

## 2. Sitemap

O site usa o sitemap nativo do WordPress (sem Yoast/Rank Math):

1. Confirme que `https://aerosuite.com.br/robots.txt` contém:
   ```
   Sitemap: https://aerosuite.com.br/wp-sitemap.xml
   ```
2. Teste no browser: `https://aerosuite.com.br/wp-sitemap.xml` deve retornar **HTTP 200** (XML).
3. Se retornar **500**:
   ```bash
   cd docs/wordpress
   node run-priority-fixes.mjs   # flush permalinks + updates (requer wp-storage.json)
   node run-site-audit.mjs       # revalidar
   ```
   Se persistir: logs PHP no horário do acesso ao sitemap; isolar **Sugar Calendar**, **TranslatePress** ou **Complianz** temporariamente.
4. No GSC → **Sitemaps** → envie: `wp-sitemap.xml` (não `sitemap_index.xml` — este site não usa Yoast).
5. Aguarde status “Êxito” (24–72 h).

## 3. Indexação prioritária

Inspecione URL e solicite indexação para:

- `https://aerosuite.com.br/`
- `https://aerosuite.com.br/contato/` (meta e bloco “Como falar com a Aero Suite”)
- `https://aerosuite.com.br/solucoes/` (meta e bloco “Navegue pelas soluções”)
- `https://aerosuite.com.br/solucoes/`
- `https://aerosuite.com.br/sobre/`
- `https://aerosuite.com.br/blog/`
- `https://aerosuite.com.br/aero-suite-vs-planilhas/`
- `https://aerosuite.com.br/casos/`
- `https://aerosuite.com.br/casos/bellows-servicos-aeronauticos/`
- `https://aerosuite.com.br/casos/king-do-rio-pecas-aeronauticas/`
- Cada página pilar (5 URLs em `/software-gestao-...`, etc.)
- Posts do blog publicados

## 4. Relatórios mensais

| Relatório | Uso |
|-----------|-----|
| Desempenho → Consultas | Ajustar títulos/H2 conforme buscas reais |
| Desempenho → Páginas | Ver quais pilares convertem em cliques |
| Experiência → Core Web Vitals | Correlacionar com PageSpeed |
| Indexação → Páginas | Detectar “Rastreada, não indexada” |

## 5. GA4 alinhado ao GSC

- Vincular propriedade GA4 (`G-GLP0ELSN4V`) ao Search Console (Admin GA4 → links).
- Comparar cliques GSC × sessões orgânicas GA4 (nunca serão iguais, mas tendência deve acompanhar).

## 6. Após cada deploy de conteúdo

1. Purgar cache do site (Cloudflare + plugin).
2. Reenviar sitemap se novas páginas/posts.
3. Inspecionar 2–3 URLs novas.
4. Rodar `node run-site-audit.mjs`.

---

*Junho/2026 — complemento a `docs/MARKETING-SEO-AEROSUITE.md`.*
