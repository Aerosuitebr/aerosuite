# Compartilhar link do site com imagem (WhatsApp, LinkedIn, etc.)

O preview (título + texto + imagem) vem das meta tags **Open Graph** e **Twitter Card** no `<head>` de cada página. O plugin **Aero Suite Performance** gera isso automaticamente.

## O que o site envia hoje

| Campo | Exemplo |
|--------|---------|
| `og:title` | Título da página |
| `og:description` | Resumo |
| `og:url` | URL canônica |
| `og:image` | Print do dashboard (`dashboard-web.webp`) ou imagem destacada do post |
| `twitter:card` | `summary_large_image` (imagem grande) |

Páginas com SEO dedicado: **home**, **/solucoes/**, **/contato/**.  
**Blog e demais páginas** usam título + trecho do conteúdo + mesma imagem padrão (ou imagem destacada do post).

## Por que às vezes não aparece a imagem

1. **Cache da rede** — WhatsApp/Facebook guardam o primeiro preview por dias. Depois de mudar o site, é preciso **forçar nova leitura**.
2. **URL errada** — Compartilhe `https://aerosuite.com.br/` (com HTTPS), não só o domínio sem protocolo.
3. **Imagem inacessível** — A URL da imagem deve abrir no navegador (pública, sem login).

## Como atualizar o preview (depois de mudanças)

1. **Facebook / WhatsApp (mesmo depurador)**  
   - [Sharing Debugger](https://developers.facebook.com/tools/debug/)  
   - Cole a URL → **Depurar** → **Buscar novas informações**.

2. **LinkedIn**  
   - [Post Inspector](https://www.linkedin.com/post-inspector/)  
   - Cole a URL e inspecione.

3. **No site**  
   ```bash
   cd docs/wordpress
   node run-purge-site-cache.mjs
   ```

4. **Reinstalar plugin SEO** (se alterou `aerosuite-performance.php`)  
   ```bash
   node run-aerosuite-perf-install.mjs
   ```

## Imagem ideal (opcional, melhor ainda)

Para card perfeito em todas as redes, use **1200×630 px** (JPG ou PNG), com logo + frase curta:

1. Envie em **Mídia** no WordPress (ex.: `aerosuite-share-1200x630.jpg`).
2. Atualize a constante `AS_PERF_OG_SHARE` em `plugins/aerosuite-performance/aerosuite-performance.php` com a URL nova.
3. Rode `node run-aerosuite-perf-install.mjs` e purgue cache.
4. Depure de novo no Sharing Debugger.

## Conferir no HTML

Abra a página → ver código-fonte → procure `og:image` e `twitter:card`. Deve existir **uma** tag `id="as-seo-meta"` (sem duplicar com outro plugin de SEO).

---

*Junho/2026 — ver também `aerosuite-seo.mjs` e `build-seo-php.mjs`.*
