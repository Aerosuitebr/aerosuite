# Padrão Aero Suite — documentação executiva e e-mails

**Versão:** 1.0 · **Vigência:** jun/2026  
**Referência visual:** `docs/ux-relatorio-executivo/relatorio-styles.css`

---

## Quando usar

- Comunicados internos (comercial, diretoria, consultores)
- Relatórios executivos para PDF
- E-mails transacionais com anexo formal
- Dossiês ANAC e evidências para stakeholders não técnicos

---

## Identidade visual

| Token | Valor | Uso |
|-------|-------|-----|
| Navy | `#051a3d` / `#0f172a` | Capa, hero e-mail |
| Azul | `#0369a1` | Títulos, links |
| Ouro | `#c9a227` | Destaques, linha decorativa |
| Superfície | `#f4f6fa` / `#f8fafc` | Fundo e-mail |
| Texto | `#0f172a` / `#334155` | Corpo |
| Sucesso | `#15803d` / `#ecfdf5` | Métricas 100% |

**Fontes (obrigatório legibilidade):**

- PDF/HTML: `'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif`
- E-mail: `'Segoe UI', Arial, Helvetica, sans-serif` — **mín. 14px** no corpo, **22px** no hero H1

**Logos:**

- Capa escura: `frontend/src/assets/LOGO_LETRA_LIGHT.png`
- Cabeçalho interno: `frontend/src/assets/LOGO_LETRA.png`

**Hero de e-mail (padrão obrigatório desde v3.0):**

- Ícone **A** branco (`frontend/src/assets/LOGO_AERO_WHITE.png`) + texto **Aero Suite** lado a lado no hero navy
- Placeholder no HTML: `{{LOGO_CID_SRC}}` — o script `send-documento-direcao.mjs` embute via **CID** (não usar data URI; muitos clientes bloqueiam)
- Referência: `docs/manual-homologacao/email-homologacao-v3.html`

---

## Destinatários direção (todos os envios de documentação)

Configuração central: `docs/templates/directorio-email-direcao.json`

| Papel | E-mail |
|-------|--------|
| Comercial | timmaia@bellowscontrols.com.br |
| Diretoria de TI | wellemlyra@aerosuite.com.br |
| Qualidade | rafaellanottesconsultoria@gmail.com |
| Marketing | thiagolyra18@gmail.com |

Envio automatizado:

```bash
node scripts/send-documento-direcao.mjs \
  --html docs/.../email.html \
  --subject "Assunto" \
  --attach path/ao/documento.pdf
```

Atalho manual de homologação:

```bash
node scripts/build-manual-pdf.mjs
node scripts/send-manual-homologacao-email.mjs
```

Atalho certificação WCAG (dossiê + roteiro PDF + e-mail equipe):

```bash
node scripts/build-wcag-certificacao-pdfs.mjs
node scripts/send-wcag-certificacao-equipe-email.mjs --dry-run
node scripts/send-wcag-certificacao-equipe-email.mjs
```

---

## Estrutura PDF (A4)

1. **Capa** — badge, título, subtítulo, meta (data, versão, destinatário)
2. **Sumário executivo** — 1 página, métricas em cards
3. **Corpo** — seções numeradas, tabelas, listas de passos
4. **Consolidação técnica** — o que foi feito (bullets objetivos)
5. **Próximos passos** — tabela responsável × ação
6. **Assinatura** — bloco com linha, nome, cargo, data

Gerar PDF:

```bash
node scripts/build-comunicado-certificacao-anac-pdf.mjs
```

---

## Estrutura e-mail

1. **Hero** (fundo navy, texto claro, fontes grandes)
2. **Abertura** — tom positivo e direto (ex.: “Oba, …”)
3. **Card métrica** — número grande (11/11, 30/30)
4. **Bullets** — o que o anexo contém
5. **CTA** — próximo passo para o destinatário
6. **Rodapé** — marca + link aerosuite.com.br

Template: `docs/comercial/templates/email-executivo-base.html`

---

## Assinatura padrão (TI)

| Campo | Valor |
|-------|-------|
| Nome | Wellem Lyra |
| Cargo | Diretor de TI |
| Organização | Aero Suite |
| E-mail | wellemlyra@aerosuite.com.br |

---

## Nomenclatura de arquivos

```
docs/comercial/Comunicado_<tema>_<YYYYMMDD>.html
docs/comercial/Comunicado_<tema>_<YYYYMMDD>.pdf
docs/comercial/Previsao_Precificacao_Aero_Suite.html
docs/comercial/emails/email-<tema>-<YYYYMMDD>.html
```

Gerar PDF precificação:

```bash
node scripts/build-previsao-precificacao-pdf.mjs
```
