# Manual Aero Suite — Homologação

Manual do usuário em PDF para homologação do sistema.

## Gerar o PDF

```bash
node scripts/build-manual-pdf.mjs
```

**Saída:** `manuals/Manual_Aero_Suite_Homologacao.pdf`

**Pré-requisito:** Puppeteer instalado em `frontend/` (`npm install` no frontend).

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `manual-styles.css` | Identidade visual (cores Aero Suite, componentes didáticos) |
| `manual-chapters.html` | Conteúdo dos capítulos (editável) |
| `Manual_Aero_Suite.html` | HTML montado (gerado automaticamente) |

## Estrutura

1. Cadastro trial e organização  
2. Primeiro login e LGPD  
3. Assistente de configuração da empresa (4 etapas)  
4. Configurações essenciais  
5–18. Módulos (MRO, estoque, comercial, portal, suporte…)  
19. Certificação ANAC — habilitação do produto  
Apêndice A — Checklist homologação (Fases 1–7, SGQ)  
Apêndice B — Checklist certificação ANAC (Fase 8)

**Versão atual:** 3.0 (jun/2026)

Para atualizar o manual, edite `manual-chapters.html` e regere o PDF:

```bash
node scripts/build-manual-pdf.mjs
```

## Enviar e-mail com PDF anexo (direção)

Destinatários padrão em `docs/templates/directorio-email-direcao.json`. Hero: logo A light + texto **Aero Suite**.

```bash
node scripts/build-manual-pdf.mjs
node scripts/send-manual-homologacao-email.mjs --dry-run
node scripts/send-manual-homologacao-email.mjs
```

Template: `email-homologacao-v3.html` · SMTP Gmail (`.env` → `QUARKUS_MAILER_*`).

