# Aero Studio — escopo MVP (materiais promocionais)

Módulo **P5.1** do [ROADMAP-DIFERENCIACAO-MRO.md](./ROADMAP-DIFERENCIACAO-MRO.md): geração de **arte para impressão** (sangria, marcas de corte) a partir da identidade do tenant já configurada na Aero Suite.

**Estado:** **MVP em código** (Flyway `V24`, rota `/studio`, API `/api/studio/*`).

**Premissa:** o motor de layout é HTML/CSS → PDF (OpenHTMLToPDF) com sangria; ver implementação em `AeroStudioService` / `AeroStudioHtmlBuilder`.

---

## 1. Problema e oportunidade

Part 145 e oficinas aeronáuticas SME investem em:

- Cartão de visita, papel timbrado, folder para operador/FBO  
- Faixa/banner no hangar, adesivo de bancada  
- Post/redes (export imagem, não só PDF)

Hoje: **Canva** (dados desatualizados) + designer (custo) + logo antiga no armazém.

A suite já tem:

- `sistema_empresa_config` (logo, nome, contactos, cores via branding)  
- Catálogo de **tipos de serviço** e **propostas comerciais** (texto de oferta)  
- **White-label** por tenant  

**Diferencial:** *“A mesma marca da proposta no cartão e no banner do hangar.”*

---

## 2. Posicionamento

| | |
|---|---|
| **Nome UI** | Aero Studio (ou Centro de Marca) |
| **Rota** | `/studio` ou `/marca/studio` |
| **Permissão** | `studio-marca` ou extensão de `configuracao-empresa` |
| **Plano** | Add-on **Marca+** ou incluso em plano Pro |
| **Também inclui** | Editor visual drag-and-drop (estilo Canva) com export PDF |

---

## 3. Personas

| Persona | Necessidade |
|---------|-------------|
| Dono / comercial | Cartão e folder rápidos após fechar identidade na suite |
| Chefe de oficina | QR no hangar apontando para portal externo |
| Marketing terceirizado | PDF print-ready com sangria para gráfica |

---

## 4. MVP — inclusões (v1)

### 4.1 Templates fixos (parametrizados)

Mínimo **4 modelos** no MVP:

| ID | Formato | Tamanho final | Sangria | Saída |
|----|---------|---------------|---------|-------|
| `cartao-visita` | Cartão | 90×50 mm | 3 mm | PDF + PNG preview (UI e opcional no ZIP) |
| `papel-timbrado` | A4 | 210×297 mm | 3 mm | PDF |
| `folder-1dobra` | A4 → folder | 210×297 mm (arte desenvolvida) | 3 mm | PDF |
| `banner-hangar` | Faixa | 2000×800 mm | 5 mm | PDF (job assíncrono) |
| `custom-canvas` | Editor livre | configurável (presets) | 3–5 mm | PDF + layout JSON |

\* *CMYK-ready* = aviso na UI se RGB; conversão final na gráfica (documentar limitação).

Cada template expõe **slots**:

- `logo` (de `logoUrl` / upload empresa)  
- `displayName`, `tagline`, `supportEmail`, `telefone`, `siteUrl`  
- `endereco` (bloco fiscal da empresa)  
- `qrPortal` (opcional: URL `FRONTEND_URL/externo/login?tenant={codigo}`)  
- `listaServicos` (top N tipos de serviço ou texto livre curto)  
- `coresPrimaria` / `coresSecundaria` (de branding ou picker limitado)

### 4.2 Fluxo UI (Angular)

1. Menu **Aero Studio** → galeria de templates (preview).  
2. Wizard 3 passos: **Modelo** → **Identidade ou editor visual** (drag-and-drop: texto, formas, logo, QR) → **Exportar**.  
3. Ações: **Descarregar PDF**, **Descarregar pacote ZIP** (PDF + `README-grafica.txt`).  
4. Histórico: últimas **10 gerações** na UI (metadados + re-download; sem reeditar).

### 4.3 Backend

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/studio/templates` | Lista metadados dos templates |
| `POST /api/studio/render` | Body: `templateId`, overrides; resposta: PDF stream ou job async |
| `GET /api/studio/jobs/{id}` | Estado do job (banner / assíncrono) |
| `GET /api/studio/jobs/{id}/download` | Ficheiro gerado |
| `GET /api/studio/jobs/{id}/preview` | PNG de pré-visualização |
| `POST /api/studio/preview` | Pré-visualização PNG sem gravar job |
| `GET /api/studio/history` | Últimas 10 gerações |

**Dados:** agregar `SistemaEmpresaConfigService` + `BrandingService` + tenant `codigo` para QR.

**Motor de render:** serviço Java (OpenHTMLtoPDF, Flying Saucer, ou Chromium headless) — decisão técnica na implementação; contrato de API estável.

### 4.4 Sangria e marcas de corte

- Área útil vs área de sangria documentada por template (JSON).  
- PDF com **crop marks** opcionais (toggle “incluir marcas de corte”).  
- `README-grafica.txt` no ZIP: dimensões, sangria, perfil de cor, fontes embutidas.

### 4.5 i18n

Chaves `studio.*` em PT/EN/ES/FR (regra `.cursor/rules/i18n-frontend.mdc`).  
Templates podem ter **variante de idioma** no rodapé legal (“Part 145” vs texto genérico).

---

## 5. Editor visual — capacidades completas

- **Elementos:** texto, retângulo, círculo, linha, ícone, imagem (upload), logo, QR.  
- **Stock:** biblioteca integrada (`GET /api/studio/stock`) + pesquisa por tags.  
- **Filtros:** grayscale, sépia, brilho, contraste, desfoque, vívido (CSS no PDF).  
- **Animação:** fade, slide, pulse, bounce — pré-visualização no editor; ZIP inclui `animated-preview.html` e `preview.gif` quando aplicável.  
- **Colaboração:** SSE `GET /api/studio/collab/{sessionId}/stream` + `PUT` para sincronizar o layout em tempo real (mesmo tenant).

## 6. Fora do MVP (v1 explícito)

- Impressão / envio à gráfica pela suite.  
- Redes sociais (tamanhos Instagram) — v1.1.  
- Vídeo longo / timeline multi-cena.

---

## 6. Modelo de dados (mínimo)

```text
studio_render_job (
  id, tenant_id, template_id, status, file_path,
  created_by, created_at, parameters_json
)
```

Flyway `V24__studio_marca.sql` (tabela `studio_render_job` + funcionalidade `STUDIO_MARCA`).

---

## 7. Segurança e RBAC

- Apenas utilizadores internos com permissão `studio-marca` ou admin empresa.  
- Utilizador externo **não** acede.  
- PDFs gerados em pasta tenant-scoped (`empresa-assets/studio/` ou S3 futuro).  
- Sem PII de clientes nas artes default (só dados da **empresa**).

---

## 8. Métricas de sucesso

| Métrica | Meta MVP |
|---------|----------|
| Tempo até primeiro PDF | &lt; 5 min após identidade publicada |
| Templates usados / tenant ativo | ≥ 2 em 30 dias |
| Suporte “como exportar para gráfica” | &lt; 5% dos tickets Studio |

---

## 9. Estimativa e dependências

| Item | Esforço |
|------|---------|
| Contrato API + 4 templates HTML | 2 sem |
| UI galeria + wizard | 2 sem |
| Integração branding + i18n | 1 sem |
| Testes + doc utilizador | 1 sem |
| **Total** | **~6 semanas** (1 dev full-stack + designer 1 template batch) |

**Depende de:** Fase D estável; `sistema_empresa_config` e upload logo já em produção (P3).

---

## 10. Ligação comercial

- Banner na lista de propostas: “Personalize sua marca no Aero Studio”.  
- Após **publicar** identidade no wizard empresa: CTA “Criar cartão de visita”.  
- Pacote **Marca+** no pricing do [PLANO-COMERCIALIZACAO-SUITE.html](./PLANO-COMERCIALIZACAO-SUITE.html).

---

## 11. Riscos

| Risco | Mitigação |
|-------|-----------|
| Scope creep (virar Canva) | Paridade funcional alcançada no editor; evoluções = mais templates stock |
| PDF pesado (banner) | Job assíncrono + notificação |
| Cores RGB vs CMYK | Disclaimer + perfil “print-safe” opcional v1.1 |
