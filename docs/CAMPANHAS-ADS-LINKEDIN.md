# Campanhas — Google Ads e LinkedIn (Aero Suite)

Modelos prontos para tráfego qualificado. Use sempre UTMs; o site repassa parâmetros aos eventos GA4.

---

## Campanhas orgânicas (custo zero) — ativar agora

| # | Canal | Status / ação | UTM / métrica |
|---|-------|---------------|---------------|
| 1 | **GSC — indexação** | ✅ `/radar-mro-anac-fiscalizacao-oficinas-2026/` solicitada 05/06/2026 · continuar cota diária | `node run-gsc-campaign-index.mjs --only=radar-mro-anac-fiscalizacao-oficinas-2026` |
| 2 | **LinkedIn — post #1** | ✅ Publicado 05/06/2026 na Page **`aero-suite-mro`** | `demo_hangar_q2` |
| 2b | **LinkedIn — post #2 (estoque)** | ✅ Publicado 05/06/2026 · preview OG estoque | `demo_estoque_q2` |
| 2c | **LinkedIn — post #3 (OS)** | ✅ Publicado 05/06/2026 · compartilhado no perfil | `demo_os_q2` |
| 2d | **LinkedIn — post #6 (conformidade)** | 🟡 Composer aberto — falta upload manual 4 PNG + publicar | `demo_conformidade_q2` |
| 3 | **LinkedIn Post Inspector** | ✅ OG validado (`/`, `/aero-suite-vs-planilhas/`, `/radar-mro-anac-fiscalizacao-oficinas-2026/`) | [Post Inspector Radar MRO](https://www.linkedin.com/post-inspector/inspect/https:%2F%2Faerosuite.com.br%2Fradar-mro-anac-fiscalizacao-oficinas-2026%2F) |
| 4 | **LinkedIn — post #4 (planilhas)** | ✅ Agendado **12/06/2026 09:30** (Horário de Brasília) | `demo_planilhas_q2` |
| 4b | **LinkedIn — Page setup** | ✅ CTA **Entre em contato conosco** → `/contato/?utm_campaign=page_cta` · ✅ localidade **Rio de Janeiro, RJ, Brasil** (Sede, sem endereço) · ✅ destaque **Post #5 Radar MRO** (05/06/2026) · ✅ domínio `@aerosuite.com.br` | ver abaixo |
| 4c | **LinkedIn — convites** | ✅ **50/50** créditos usados (20 + 30 em 05/06/2026) | 50 créditos/mês |
| 5 | **WhatsApp / e-mail** | Link `/contato/` | `utm_source=whatsapp` |
| 6 | **Bing Webmaster** | Enviar `wp-sitemap.xml` | [Bing WMT](https://www.bing.com/webmasters) |
| 7 | **Facebook Debugger** | Cache OG (WhatsApp) | [Sharing Debugger](https://developers.facebook.com/tools/debug/) |
| 8 | **Blog → LinkedIn** | ✅ Post Radar MRO ANAC publicado 03/06/2026 · repost perfil | `radar_mro_q2` · `blog_radar-mro-anac-fiscalizacao-oficinas-2026` |

Script GSC: `docs/wordpress/run-gsc-campaign-index.mjs` · Resultado: `gsc-campaign-index-result.json`

**Não gratuitos:** Google Ads, LinkedIn Sponsored — seções abaixo (budget).

---

## Landing pages por intenção

| Intenção | URL recomendada |
|----------|-----------------|
| Software MRO genérico | `https://aerosuite.com.br/` |
| Estoque / peças | `https://aerosuite.com.br/estoque-pecas-aeronauticas-rastreabilidade/` |
| OS / job card | `https://aerosuite.com.br/ordem-servico-manutencao-aeronaves/` |
| Planilhas → software | `https://aerosuite.com.br/aero-suite-vs-planilhas/` |
| Contato direto | `https://aerosuite.com.br/contato/?utm_source=...` |

## Google Ads (pesquisa)

**Orçamento inicial:** R$ 1.500–3.000/mês · **Objetivo:** leads (formulário / Calendly).

**Grupos de anúncio (exemplos)**

1. software gestão oficina aeronáutica  
2. sistema mro brasil  
3. software estoque peças aeronáuticas  
4. ordem de serviço manutenção aeronaves  

**URL com UTM (copiar e colar)**

```
https://aerosuite.com.br/contato/?utm_source=google&utm_medium=cpc&utm_campaign=mro_software_q2&utm_content=grupo_os
```

**Conversões no Google Ads**

Importar do GA4: `generate_lead`, `calendly_event_scheduled`, `form_submit`.

## LinkedIn — campanha orgânica Q2 (custo zero)

### Slug da Page — conflito `aerosuite`

A URL [linkedin.com/company/aerosuite](https://www.linkedin.com/company/aerosuite) **já existe** e é de **outra empresa** (software de aeroportos / “airport intelligence”, hashtags `#AirportSoftware`, `#PowerPlatform`) — **não** é a Aero Suite MRO Brasil (`aerosuite.com.br`).

**Não solicite acesso** a essa Page (risco de confusão de marca).

**Page ativa:** [linkedin.com/company/aero-suite-mro](https://www.linkedin.com/company/aero-suite-mro)

**Enquanto a Page nova não existir:** publique pelo **perfil pessoal** (Wellem Lyra) — campanha orgânica funciona igual; UTMs no GA4 registram `utm_campaign`.

**Insight Tag (opcional, grátis):** Campaign Manager → Account Assets → Insight Tag → Partner ID → `setup-marketing-ids.mjs --linkedin-partner=…`

**Logo Page (colorido, nítido):** `node docs/wordpress/build-linkedin-page-logo.mjs` → `static/aerosuite-linkedin-logo-1024.png` (upload no LinkedIn)

- Estilo: logomark **colorido** (navy + seta cyan + check dourado) sobre gradiente azul — igual ao app.
- **Não** envie capturas de tela nem PNG &lt;512px (ficam borrados).
- **Não** use `aerosuite-site-icon-512.png` (vem de favicon 32×32).

### Mídia LinkedIn — capa, posts e carrossel

Gerar tudo: `node docs/wordpress/build-linkedin-media.mjs`

| Arquivo | Uso | Dimensão |
|---------|-----|----------|
| `static/aerosuite-linkedin-cover-1128x191.png` | **Capa da Page** (upload manual) | 1128×191 · fonte `frontend/src/assets/Linkedin_back.png` |
| `static/aerosuite-linkedin-post-hangar-1200x627.png` | Post #1 com screenshot dashboard | 1200×627 |
| `static/aerosuite-linkedin-post-estoque-1200x627.png` | Post #2 estoque | 1200×627 |
| `static/aerosuite-linkedin-post-os-1200x627.png` | Post #3 OS | 1200×627 |
| `static/aerosuite-linkedin-post-planilhas-1200x627.png` | Post #4 comparativo | 1200×627 |
| `static/aerosuite-linkedin-post-radar-anac-1200x627.png` | Post #5 Radar MRO / ANAC | 1200×627 |
| `static/aerosuite-linkedin-carousel-{1-4}-1080.png` | Carrossel “produto em 4 telas” | 1080×1080 |
| `static/aerosuite-linkedin-carousel-radar-{1-4}-1080.png` | Carrossel checklist Radar MRO | 1080×1080 |
| `static/aerosuite-linkedin-post-conformidade-1200x627.png` | Post #6 capa / alternativa single | 1200×627 |
| `static/aerosuite-linkedin-carousel-conformidade-{1-4}-1080.png` | **Carrossel Post #6** — adequação SGQ | 1080×1080 |

Cópia rápida na Área de Trabalho: `Desktop/aerosuite-linkedin-media/`

**Upload de imagem no LinkedIn:** só manual (browser automation bloqueia `input[type=file]`). Ao publicar, preferir **Adicionar mídia** + PNG do produto **antes** do link — alcance ~2× vs. só preview OG.

**Capa da Page:** Painel admin → **Editar imagem de fundo** → Adicionar imagem de capa → `aerosuite-linkedin-cover-1128x191.png`

**Destaques:** Editar página → aba **Em destaque** → **Gerenciar em destaque** → Post #5 Radar MRO/ANAC fixado em 05/06/2026 (substituiu Post #1 hangar).

**Convites:** Admin → **Convidar para seguir** → marcar conexões (sem “Convite enviado”) → **Exibir mais resultados** → **Convidar**. **50/50** créditos usados em 05/06/2026.

**Botão CTA (feito 05/06/2026):** Editar página → Botões → **Entre em contato conosco** → `https://aerosuite.com.br/contato/?utm_source=linkedin&utm_medium=social&utm_campaign=page_cta`

**Localidade (feito 05/06/2026):** Editar página → Localidades → Brasil · **Rio de Janeiro, RJ** · Sede · “Minha organização não tem um endereço”.

**Domínio e-mail (feito 05/06/2026):** Configurações → Vagas → **Adicionar domínio** → `@aerosuite.com.br` (toast “O domínio de e-mail foi adicionado”). *Verificação DNS adicional no LinkedIn, se solicitada posteriormente.*

### Post 1 — Hangar integrado (publicar agora)

**Link:**

```
https://aerosuite.com.br/?utm_source=linkedin&utm_medium=social&utm_campaign=demo_hangar_q2&utm_content=post_hangar
```

**Texto:**

> Planilhas não sustentam rastreio de peça nem OS auditável.
>
> Na **Aero Suite**, hangar, estoque FIFO e portal do cliente conversam na mesma plataforma — do recebimento da peça à liberação da aeronave.
>
> Demonstração de 30 min: link nos comentários ou em aerosuite.com.br/contato
>
> #MRO #Aviação #ManutençãoAeronáutica #Software #Gestão

### Post 2 — Estoque / peças ✅ publicado 05/06/2026

**Link:** `https://aerosuite.com.br/estoque-pecas-aeronauticas-rastreabilidade/?utm_source=linkedin&utm_medium=social&utm_campaign=demo_estoque_q2&utm_content=post_estoque`

**Imagem nativa (opcional, recomendado):** `aerosuite-linkedin-post-estoque-1200x627.png`

**Texto:**

> Peça sem rastreio = risco em auditoria.
>
> FIFO, lote, certificado e vínculo com OS na mesma base — sem planilha paralela.
>
> Veja como funciona: [link]

### Post 3 — OS / job card ✅ publicado 05/06/2026

**Link:** `https://aerosuite.com.br/ordem-servico-manutencao-aeronaves/?utm_source=linkedin&utm_medium=social&utm_campaign=demo_os_q2&utm_content=post_os`

**Texto:**

> Job card digital, apontamento de horas e histórico por aeronave — pronto para auditoria interna.
>
> Conheça a Aero Suite: [link]

### Post 4 — Planilhas → software (semana 4)

**Link:** `https://aerosuite.com.br/aero-suite-vs-planilhas/?utm_source=linkedin&utm_medium=social&utm_campaign=demo_planilhas_q2&utm_content=post_planilhas`

**Texto:**

> Ainda gerencia oficina MRO em planilha?
>
> Comparativo honesto: onde planilha quebra e o que muda com software dedicado.
>
> [link]

### Post 5 — Radar MRO / ANAC ✅ publicado 03/06/2026

**Link:** `https://aerosuite.com.br/radar-mro-anac-fiscalizacao-oficinas-2026/?utm_source=linkedin&utm_medium=social&utm_campaign=radar_mro_q2&utm_content=blog_radar-mro-anac-fiscalizacao-oficinas-2026`

**Short link Page:** `https://lnkd.in/dVFykz7Y`

**Texto (Page):**

> ANAC anunciou corte de 40% na fiscalização do setor — e supervisão de oficinas RBAC 145 está no escopo.
>
> Menos visitas presenciais não significa menos responsabilidade. Para hangar e manutenção, este é o momento de reforçar compliance interno: rastreio de peça, OS auditável, documentação sempre pronta.
>
> Radar MRO Aero Suite — leitura especializada + checklist de 5 ações: [link]
>
> #MRO #Aviação #ANAC #ManutençãoAeronáutica #RBAC145

**Repost perfil (Wellem Lyra):** compartilhado no feed pessoal com intro “Novo Radar MRO — leitura prática para gestores de oficina e qualidade.”

**Imagem nativa (recomendado):** `aerosuite-linkedin-post-radar-anac-1200x627.png` — upload manual no post (ou republicar com mídia). Carrossel opcional: `aerosuite-linkedin-carousel-radar-{1-4}-1080.png`.

### Post 6 — Adequação & conformidade SGQ (carrossel)

**Gerar mídia:** `node docs/wordpress/build-linkedin-media.mjs` → `static/aerosuite-linkedin-carousel-conformidade-{1-4}-1080.png` (+ cópia em `Desktop/aerosuite-linkedin-media/`).

**Link (comentário fixado):**

```
https://aerosuite.com.br/conformidade-regulatoria/?utm_source=linkedin&utm_medium=social&utm_campaign=demo_conformidade_q2&utm_content=post_conformidade_carousel
```

**Texto (Page):**

> Sua oficina está pronta para a próxima auditoria — ou só “acha” que está?
>
> Planilha de MOE, calibração em Excel e NC em e-mail não escalam quando o fiscal, o cliente ou a ANAC pedem evidência na hora.
>
> Na Aero Suite, lançamos um pacote de adequação integrado ao MRO — não é SGQ “paralelo”: conversa com OS, hangar, estoque e CRS.
>
> 👉 Deslize o carrossel: documentos controlados, NC/CAPA, treinamentos, calibração, ASL, AD/SB, dossiê multi-OS, export SGQ e bloqueios operacionais.
>
> Gestores de qualidade e diretores técnicos: qual evidência mais dói hoje na sua oficina — documento, treinamento ou calibração?
>
> Demonstração de 30 min → link no primeiro comentário ou aerosuite.com.br/contato
>
> #MRO #Aviação #ManutençãoAeronáutica #RBAC145 #Qualidade #SGQ #ANAC

**Repost perfil (Wellem Lyra):** *“Pacote de adequação que integramos ao MRO — para quem vive auditoria de verdade. Carrossel com o que entrou na suíte.”*

**Publicação (melhor formato):**

1. Page **aero-suite-mro** → Criar publicação → **Adicionar documento** ou carrossel de imagens (4 PNG na ordem 1→4).
2. Colar texto acima **sem** link no corpo (link só no comentário fixado).
3. Publicar → comentar com UTM → fixar comentário.
4. **Em destaque:** fixar este post na Page (substitui Radar MRO se necessário).
5. Repost no perfil pessoal 2–4 h depois.

**Slides do carrossel:**

| # | Arquivo | Mensagem |
|---|---------|----------|
| 1 | `carousel-conformidade-1-1080.png` | Adequação integrada ao MRO |
| 2 | `carousel-conformidade-2-1080.png` | MOE, POP, NC/CAPA, export SGQ |
| 3 | `carousel-conformidade-3-1080.png` | Treino, calibração, ASL, bloqueios |
| 4 | `carousel-conformidade-4-1080.png` | Dossiê auditoria + CTA demo |

### Depois do orgânico — Sponsored (pago)

Quando houver budget, impulsionar o **Post 1** (melhor engajamento esperado) para:

- **Público:** Gerente MRO, Diretor técnico, Owner oficina aeronáutica — Brasil  
- **Objetivo:** Tráfego para o site / conversões do Insight Tag  
- **URL:** mesma do Post 1 com `utm_campaign=demo_hangar_q2`

## LinkedIn (resumo pago)

**Público:** Gerente MRO, Diretor técnico, Owner oficina aeronáutica, Brasil.

**Formato:** Sponsored content + Message Ads (teste A/B).

**URL**

```
https://aerosuite.com.br/?utm_source=linkedin&utm_medium=social&utm_campaign=demo_hangar_q2
```

**Roteiro de post (curto)**

> Planilhas não sustentam rastreio de peça nem OS auditável. Na Aero Suite, hangar, estoque FIFO e portal do cliente conversam na mesma plataforma. Demonstração de 30 min — link na bio.

## Remarketing

1. Configure `metaPixelId` e/ou `linkedInPartnerId` em `aerosuite-site-secrets.local.mjs`.  
2. Visitante precisa aceitar **Aceitar todos** no banner de cookies.  
3. Público: visitou `/` ou pilares, não converteu em 7 dias.

## Checklist semanal

- [ ] Revisar termos de pesquisa (GSC + Google Ads)
- [ ] Pausar keywords com CTR &lt; 1% e sem conversão
- [ ] 1 post LinkedIn com link UTM
- [ ] Responder leads WhatsApp em &lt; 24h

---

*Complemento a `docs/MARKETING-SEO-AEROSUITE.md`.*
