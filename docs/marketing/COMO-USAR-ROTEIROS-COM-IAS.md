# Como usar os roteiros de vídeo Aero Suite com outras IAs

Arquivo principal (copiar/colar ou importar): **`AERO-SUITE-ROTEIROS-VIDEO.json`**

---

## Formato recomendado

| Ferramenta | O que copiar do JSON |
|------------|----------------------|
| **ElevenLabs / Play.ht** | `videos[n].voiceover_full` + `master_prompts_for_specialized_ai.elevenlabs_voice_direction` |
| **Runway / Kling / Pika / Sora** | Cada `scenes[].prompts.video` + template `master_prompts_for_specialized_ai.runway_or_kling_scene_template` |
| **Midjourney / Flux / DALL·E** | `scenes[].prompts.image` + template Midjourney do JSON |
| **HeyGen / Synthesia** | `voiceover_full` como script + cenário hangar do `visual_identity` |
| **CapCut / Premiere** | Roteiro por cena: `time`, `on_screen_text`, `voiceover`, `duration_seconds` |
| **ChatGPT / Claude (roteiro)** | Cole o objeto `videos[n]` inteiro e peça: "refine para 30s Reels mantendo claims legais" |
| **Meta Ads / YouTube** | `social.caption` + `social.hashtags` + `hook_3_seconds` como primary text |

---

## Pacote mínimo para enviar a uma IA de vídeo

Cole este bloco e substitua `{VIDEO_ID}`:

```
Contexto de marca: [copiar meta.positioning + meta.brand_voice]
Evitar afirmar: [copiar meta.avoid_claims]
Vídeo: [copiar objeto videos onde id = VIDEO_ID]
Tarefa: Gerar storyboard shot-a-shot e prompts de vídeo 4s por cena, mantendo pt-BR.
```

---

## Lista de vídeos

| ID | Título | Duração | Formato | Uso |
|----|--------|---------|---------|-----|
| V01_HERO | Manifesto principal | 60s | 16:9 | Site, YouTube |
| V02_UM_SISTEMA | Um sistema só | 45s | 9:16 | Reels |
| V03_OS_MRO | OS aeronáutica | 50s | 16:9 | LinkedIn |
| V04_ESTOQUE_RASTREIO | Almoxarifado QR | 45s | 9:16 | Reels |
| V05_DOSSIE_AUDITORIA | Dossiê auditoria | 55s | 16:9 | Vendas Part 145 |
| V06_PORTAL_CLIENTE | Portal cliente | 40s | 9:16 | WhatsApp Status |
| V07_COMERCIAL_PROPOSTA | Propostas | 45s | 16:9 | Comercial |
| V08_VS_MERCADO | Comparativo mercado | 50s | 16:9 | Landing |
| V09_FCU_ESPECIALISTA | FCU / componentes | 40s | 16:9 | Nicho técnico |
| V10_CONFIANCA_SAAS | Segurança / LGPD | 35s | 16:9 | Due diligence |
| V11_CTA_DEMO | CTA demo 15 min | 30s | 9:16 | Ads |
| V12_CONFORMIDADE_PART145 | Conformidade Onda B | 55s | 16:9 | Vendas Part 145, LinkedIn |
| V13_RNC_CAPA_HERO | RNC/CAPA integrado | 60s | 16:9 | Site, YouTube, qualidade |
| V14_ISO9001_LINKEDIN | Cláusula 10.2 no hangar | 45s | 16:9 | LinkedIn ISO/SGQ |
| V15_RNC_REELS | NC 90 dias aberta | 30s | 9:16 | Reels, Shorts |
| V16_DEMO_WALKTHROUGH | Walkthrough SGQ demo | 12min | 16:9 | Loom, sales enablement |

Arquivo dedicado SGQ/ISO: **`ROTEIRO-VIDEO-SGQ-ISO9001.json`** · Material HTML: **`docs/comercial/Material_Comercial_SGQ_ISO9001_20260625.html`**

---

## Revisão de claims (2026-05-18)

Prioridade concluída no roadmap de conformidade. No JSON:

- `meta.avoid_claims` — lista ampliada
- `meta.claim_replacements` — substituições sugeridas para IAs
- `meta.compliance_review` — registo da revisão
- `meta.product_capabilities_onda_b` — funcionalidades B1–B7 para roteiros e demos

**Títulos alterados:** V05 deixou de usar «Auditoria ANAC» como headline (risco de parecer endorsement).

**Novo roteiro:** `V12_CONFORMIDADE_PART145` — CRS, certificado de peça, quarentena, retenção, hangar, AD/SB, habilitações.

---

## Gravação de tela real (recomendado)

Para credibilidade, intercale B-roll de IA com **screen capture** do ambiente de demo:

- Login → dashboard
- Abrir OS com campos TSN/AD
- Escanear QR no estoque
- Exportar dossiê PDF
- Portal externo (visão cliente)
- Emitir CRS (checklist) e baixar PDF
- Certificado de peça + quarentena
- Hangar / job card no tablet
- AD/SB com alerta de prazo
- Habilitações técnicas (RT / inspetor)

Use os mesmos `on_screen_text` do JSON como overlays.

---

## Compliance de marketing

Sempre que a IA inventar copy, validar contra `meta.avoid_claims` e preferir redações de `meta.claim_replacements`. Frases seguras estão em `meta.legal_safe_phrases`.

Hashtags como `#ANAC` referem-se ao **público** (oficinas sob regulamentação brasileira), não à homologação do software pela autoridade.

No produto, erros regulatórios (CRS, habilitação, quarentena) retornam **chaves i18n** — ao gravar demos, confirme que a UI mostra a mensagem traduzida, não «Requisição inválida».
