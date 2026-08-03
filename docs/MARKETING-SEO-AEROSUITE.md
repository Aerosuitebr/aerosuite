# Marketing, SEO e captação de demonstrações — Aero Suite

Plano operacional para [aerosuite.com.br](https://aerosuite.com.br/): visibilidade em buscas qualificadas (MRO, oficina aeronáutica, peças aeronáuticas) e conversão para **agendamento de demonstração**.

---

## 1. O que foi implementado no repositório

| Artefato | Descrição |
|----------|-----------|
| `docs/wordpress/aerosuite-site-config.mjs` | GA4, Calendly, URLs, slugs das páginas pilares |
| `docs/wordpress/aerosuite-schema.mjs` | JSON-LD: Organization, SoftwareApplication, FAQ, Breadcrumb, Article |
| `docs/wordpress/aerosuite-pillar-pages.mjs` | 5 páginas pilares (conteúdo + SEO) |
| `docs/wordpress/aerosuite-contact-page.mjs` | Contato com Calendly + formulário |
| `docs/wordpress/aerosuite-blog.mjs` | Índice do blog + post modelo |
| `docs/wordpress/aerosuite-analytics.js` | GA4 + `cta_demo` / `cta_whatsapp` / `form_submit` / `calendly_event_scheduled` / `generate_lead` |
| `docs/wordpress/aerosuite-solucoes-page.mjs` | Página Soluções (showcase + hub + schema) |
| `docs/wordpress/aerosuite-sobre-page.mjs` | Página Sobre (missão + KPIs + schema) |
| `docs/wordpress/build-conversion-deploy.mjs` | Deploy rápido: footer JS + Soluções + Sobre |
| `docs/wordpress/build-gaps-deploy.mjs` | Blog (5 posts), legal, comparativo, obrigado, LGPD, sticky CTA |
| `docs/wordpress/aerosuite-consent.js` | Banner cookies LGPD |
| `docs/wordpress/aerosuite-marketing-pixels.js` | Meta / LinkedIn (opcional, pós-consentimento) |
| `docs/GSC-OPERACIONAL.md` | Checklist Search Console (operação) |
| `docs/GA4-CONVERSOES.md` | Marcar eventos como conversão no GA4 |
| `docs/CAMPANHAS-ADS-LINKEDIN.md` | UTMs, Google Ads e LinkedIn |
| `docs/wordpress/aerosuite-footer-template.mjs` | Rodapé global + preload do logo no header |
| `docs/wordpress/aerosuite-content.mjs` | Home atualizada: schema, hub de guias, CTAs rastreáveis |
| `docs/wordpress/aerosuite-premium.css` | Estilos pilares, blog, contato, hub |
| `docs/wordpress/build-marketing-deploy.mjs` | Gera `.marketing-manifest.json` e `.deploy-marketing-once.js` |
| `docs/wordpress/static/robots.txt` | Modelo para a raiz do site |

---

## 2. Antes do deploy — configurar

Edite `docs/wordpress/aerosuite-site-config.mjs`:

```js
export const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // ID real do GA4
export const CALENDLY_EMBED_URL = 'https://calendly.com/SUA-CONTA/demo-aero-suite';
```

Crie o evento no Calendly (30 min, online) e o fluxo de dados no [Google Analytics](https://analytics.google.com/).

---

## 3. Deploy no WordPress

**Deploy lacunas** (blog, legal, comparativo, obrigado, home, footer LGPD):

```bash
cd docs/wordpress
node build-gaps-deploy.mjs
node run-gaps-deploy.mjs
```

**Deploy rápido** (só analytics de conversão + Soluções + Sobre):

```bash
cd docs/wordpress
node build-conversion-deploy.mjs
node run-conversion-deploy.mjs
```

**Remarketing (opcional):** em `aerosuite-site-secrets.local.mjs` defina `metaPixelId` e/ou `linkedInPartnerId`. Pixels só carregam após “Aceitar todos” no banner.

**Deploy completo** (home, contato, blog, pilares, footer):

1. Gere o pacote:
   ```bash
   cd docs/wordpress
   node build-marketing-deploy.mjs
   ```
2. Sirva a pasta localmente (ex.: porta 8765):
   ```bash
   npx --yes serve . -p 8765
   ```
3. Abra **wp-admin** → F12 → Console:
   ```js
   fetch('http://127.0.0.1:8765/.deploy-marketing-once.js').then(r=>r.text()).then(eval)
   ```
4. Confirme `ok: true`, `hasSchema: true`, `hasCalendly: true` e lista de `pillarResults`.

**Páginas atualizadas**

- ID **21** — Home (schema + hub de guias)
- ID **20** — Soluções (showcase + guias)
- ID **16** — Sobre (missão + CTAs)
- ID **18** — Contato (Calendly + formulário)
- Slug **blog** — Índice do blog (criada se não existir)
- 5 slugs pilares (criados/atualizados por slug)
- 1 post: `substituir-planilhas-gestao-oficina-mro`

**Footer** — CSS premium + JS (hero, zoom, máscara telefone, analytics) + `AEROSUITE_SITE`.

---

## 4. SEO técnico pós-deploy (checklist)

### Google Search Console

- [ ] Adicionar propriedade `https://aerosuite.com.br`
- [ ] Verificar domínio (DNS ou HTML)
- [ ] Enviar sitemap: `https://aerosuite.com.br/sitemap_index.xml`
- [ ] Solicitar indexação da home e das 5 pilares

### Google Analytics 4

- [ ] Confirmar recebimento de `page_view`
- [ ] Marcar eventos como conversões: `cta_demo`, `cta_whatsapp`, `form_submit`, `calendly_event_scheduled`, `generate_lead`
- [ ] Criar relatório “Origem da sessão → conversões”

### WordPress / plugins

- [ ] Plugin SEO (Rank Math ou Yoast): títulos não duplicados; usar os do manifesto
- [ ] `robots.txt` na raiz (ver `static/robots.txt`)
- [ ] Permalinks: “Nome do post”
- [ ] Cache/CDN: não cachear `wp-admin`; purgar cache após deploy
- [ ] Imagens WebP já no hero/showcase; manter lazy-load

### Schema (validação)

- [ ] [Rich Results Test](https://search.google.com/test/rich-results) na home (FAQ + SoftwareApplication)
- [ ] Testar uma página pilar (BreadcrumbList)

### Performance

- [ ] PageSpeed Insights mobile ≥ 70 (meta inicial)
- [ ] Core Web Vitals no Search Console

---

## 5. Palavras-chave (foco Brasil)

**Prioridade alta (intenção comercial)**

- software gestão oficina aeronáutica
- sistema MRO Brasil
- software para oficina MRO
- gestão ordem de serviço aviação
- estoque peças aeronáuticas software
- portal cliente oficina aeronáutica

**Evitar como meta principal** (muito genérico, baixa conversão)

- aeronaves, aviação, peças aeronáuticas (sem “software” / “gestão”)

Cada página pilar no site cobre um cluster; o hub na home interliga tudo.

---

## 6. Conteúdo contínuo (blog)

**Cadência sugerida:** 2 artigos/mês.

**Modelo:** `aerosuite-blog.mjs` → `buildBlogPost({ ... })` → incluir no array `posts` em `build-marketing-deploy.mjs` ou publicar manualmente.

**Temas iniciais**

1. Substituir planilhas na gestão MRO *(já no deploy)*
2. FIFO e rastreio de peças na RBAC 145
3. Portal do cliente: menos ligação, mais transparência
4. Proposta comercial alinhada à OS
5. Checklist digital para auditoria interna

Todo post deve terminar com CTA “Agendar demonstração” (bloco `blogDemoCtaBlock`).

---

## 7. Promoção e demonstrações

### Funil

```
Busca / LinkedIn / indicação / evento
  → aerosuite.com.br (ou página pilar)
  → /contato/ (Calendly ou formulário)
  → Demo 30 min → proposta comercial
```

### Canais

| Canal | Ação |
|-------|------|
| **Google Ads** | Campanhas só em termos de intenção; landing = pilar ou home; UTMs |
| **LinkedIn** | 1 post/semana + anúncios para “Gerente MRO”, “Diretor técnico”, aviação BR |
| **Prospecção** | Base `PROSPECCAO-CLIENTES-MRO-BRASIL.html` + link Calendly |
| **WhatsApp** | (21) 99040-3514 — resposta &lt; 24h |
| **Eventos** | QR → `/contato/?utm_source=evento&utm_campaign=labace` |

### Script da demo (20 min)

1. Painel e perfis (2 min)
2. OS + job card + documentos (6 min)
3. Estoque FIFO + peça na OS (6 min)
4. Proposta + portal cliente (4 min)
5. Próximos passos e proposta (2 min)

### UTMs (exemplos)

```
?utm_source=linkedin&utm_medium=social&utm_campaign=demo_q2
?utm_source=google&utm_medium=cpc&utm_campaign=mro_software
?utm_source=email&utm_medium=outbound&utm_campaign=prospeccao_om
```

---

## 8. KPIs mensais

| Métrica | Meta inicial |
|---------|----------------|
| Impressões GSC (consultas MRO/oficina) | Crescimento mês a mês |
| Cliques orgânicos | +15% após 90 dias de conteúdo |
| Eventos `cta_demo` + formulário | Baseline no 1º mês |
| Demos realizadas | Alinhar com capacidade comercial |
| Taxa visita → lead (tráfego qualificado) | 2–5% |

---

## 9. Cronograma sugerido

| Período | Ações |
|---------|--------|
| **Semana 1** | Config GA4/Calendly, deploy marketing, Search Console, validar schema |
| **Semana 2–4** | 2 posts blog, LinkedIn semanal, teste Ads R$ 1–3k |
| **Mês 2–3** | Case de cliente, remarketing, revisar top queries GSC |
| **Mês 6+** | Expandir pilares, guest posts, parcerias RBAC |

---

## 10. Manutenção do código

```bash
# Após editar conteúdo ou CSS
node build-marketing-deploy.mjs
# Republicar via .deploy-marketing-once.js no wp-admin
```

Arquivos que mais mudam:

- `aerosuite-site-config.mjs` — IDs e links
- `aerosuite-pillar-pages.mjs` — textos SEO
- `aerosuite-blog.mjs` — novos posts
- `aerosuite-premium.css` — visual

---

## 11. Limitações honestas

- **Não** ranquear em 30 dias para “aeronaves” ou termos amplos — exige autoridade e backlinks.
- **Sim** ranquear em 3–6 meses para long-tail MRO/software com conteúdo + técnico ok.
- Calendly/GA4 com placeholder **não** disparam até você configurar IDs reais.

---

*Última atualização: junho/2026 — alinhado ao pacote `build-marketing-deploy.mjs`.*
