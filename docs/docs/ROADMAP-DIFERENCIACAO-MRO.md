# Roadmap de diferenciação MRO — Aero Suite

Documento vivo: cruza **dores do mercado** (Part 145 / oficinas aeronáuticas SME) com o que já existe no repositório e o backlog **P4 / P5** pós go-live de código (Fase D — infra).

**Relacionados:** [IMPLEMENTACAO-PLANO-SAAS.md](./IMPLEMENTACAO-PLANO-SAAS.md) · [PROXIMOS-PASSOS-DESENV.md](./PROXIMOS-PASSOS-DESENV.md) · [PLANO-COMERCIALIZACAO-SUITE.html](./PLANO-COMERCIALIZACAO-SUITE.html)

---

## 1. Tese de produto

O mercado não precisa de mais um ERP genérico nem de um MRO “de companhia aérea”. Oficinas Part 145 (especialmente no Brasil/LATAM) precisam de uma **suite SaaS integrada**:

**comercial → execução (OS) → estoque → cliente → marca**, num único tenant, com onboarding rápido e preço acessível.

**Frase de posicionamento:**

> *Aero Suite — da cotação à peça na OS, com o cliente a acompanhar no portal.*

---

## 2. Mapa de dores do setor (pesquisa 2024–2026)

Fontes: guias MRO (AeroNextGen, Sensus), IATA *Adopting Aircraft Electronic Records*, McKinsey/BCG sobre MRO 2.0, operadores Part 145.

| # | Dor | Sintoma na oficina | Oferta típica no mercado | Lacuna |
|---|-----|-------------------|---------------------------|--------|
| D1 | **Silos de sistemas** | Mesmos dados em Excel, ERP, MRO, estoque, e-mail | 8–14 ferramentas desconectadas | Integração cara ou inexistente |
| D2 | **“Digital” com papel** | Job cards, CRS, anexos ainda em PDF/papel | ERP com módulo aviação “opcional” | Hangar continua em papel em grande parte das fases |
| D3 | **Software pesado** | Implementação longa, migração cara, sem IT | AMOS, Trax, RAMCO, Quantum | Part 145 pequeno fica de fora |
| D4 | **Portal do cliente fraco** | Cliente liga para saber status e aprovar horas | Portal só em suites enterprise | WhatsApp/e-mail como “CRM” |
| D5 | **Proposta ≠ OS** | Orçamento aprovado; OS aberta à mão | CRM + MRO separados | Perda de margem e rastreio |
| D6 | **Rastreabilidade de peça** | Auditoria pergunta PN/SN/lote; demora horas | Módulos de peças desligados da OS | Back-to-birth não “num clique” |
| D7 | **Chão de oficina** | Técnico no hangar sem mobile/offline | Apps genéricos ou add-on caro | Pouca adoção real |
| D8 | **Capacidade / AOG** | Fila opaca, prioridade mal comunicada | Planilha + quadro branco | Cliente e chefe de oficina desalinhados |
| D9 | **Migração / medo** | “Se trocar o sistema, paro a oficina” | Vendor vende licença, não entrada | 80%+ citam dados como barreira à digitalização |
| D10 | **Compliance em dossiê** | Auditor pede trilha; export manual | Logs espalhados | Dossiê único raro em SME |

---

## 3. O que a Aero Suite já cobre (P0–P5 — código em `desenv`)

| Dor | Capacidade no repo | Notas |
|-----|-------------------|--------|
| D1 (parcial) | OS, estoque FIFO/QR, propostas, portal externo, biblioteca, chat, suporte | Mesmo login tenant; reforçar narrativa “uma suite” |
| D3 (parcial) | SaaS multi-tenant, trial, white-label, módulos por plano | vs. projeto enterprise 18 meses |
| D4 (v2) | Portal externo: OS, documentos, **propostas** (aprovar/rejeitar), perfil | [PORTAL-CLIENTE-2-PROPOSTA-OS.md](./PORTAL-CLIENTE-2-PROPOSTA-OS.md) § B |
| D5 | Proposta → OS (`POST .../gerar-os`, Flyway `V20`) + comercial completo | Killer P4.1 **feito** |
| D6 (parcial) | Estoque por lote + rastreio/dossiê peça | `/estoque/rastreio`, pacote auditoria |
| D8 | Quadro capacidade / AOG (P5.3) | `/capacidade`, hangares, drag, notificações, SLA portal — [QUADRO-CAPACIDADE-P53.md](./QUADRO-CAPACIDADE-P53.md) |
| D9 (parcial) | Kit go-live 30 dias (CSV + checklist) | [KIT-GOLIVE-30-DIAS.md](./KIT-GOLIVE-30-DIAS.md) — checklist persistido (`V53`); CSV SGQ semana 5 (fornecedores, treinos, documentos, calibração) |
| D10 | Dossiê + pacote ZIP + retenção | P4.4 + Onda A/B conformidade |
| — | LGPD, billing Stripe, Aero Studio, hangar job card | P1/P5 |

**Backlog pós-código (operação / fora do monólito):** homologação Bling webhooks em staging (P5.5 MVP feito), deploy Fase D, Stripe prod. (ROI/landing: [`marketing/landing-roi/`](./marketing/landing-roi/) — feito)

---

## 4. Priorização P4 / P5

### P4 — Diferenciação comercial imediata (pós go-live infra)

Ordem recomendada de implementação:

| Prioridade | Entrega | Dores | Doc de escopo |
|------------|---------|-------|----------------|
| **P4.1** | **Proposta → OS** (killer #1) | D5, D1 | [PORTAL-CLIENTE-2-PROPOSTA-OS.md](./PORTAL-CLIENTE-2-PROPOSTA-OS.md) § Proposta→OS |
| **P4.2** | **Portal cliente 2.0** | D4, D8 | [PORTAL-CLIENTE-2-PROPOSTA-OS.md](./PORTAL-CLIENTE-2-PROPOSTA-OS.md) § Portal |
| **P4.3** | **Kit go-live 30 dias** | D9 | CSV + checklist + templates — [KIT-GOLIVE-30-DIAS.md](./KIT-GOLIVE-30-DIAS.md) |
| **P4.4** | **Dossiê de auditoria** | D10 | PDF: OS + anexos + estoque + trilhas — [DOSSIE-AUDITORIA.md](./DOSSIE-AUDITORIA.md) |

Estimativa indicativa: **10–14 semanas** de desenvolvimento focado (1 equipa), após Fase D estável.

### P5 — Expansão de valor e receita

| Prioridade | Entrega | Dores | Doc de escopo |
|------------|---------|-------|----------------|
| **P5.1** | **Aero Studio** (materiais promocionais) | Marca local, marketing | [AERO-STUDIO-MVP-ESCOPO.md](./AERO-STUDIO-MVP-ESCOPO.md) — **em código** |
| **P5.2** | **Mobile hangar (MVP)** | D2, D7 | Consulta OS, horas, foto, assinatura, sync |
| **P5.3** | **Quadro capacidade / AOG** | D8 | **Fechado** — [QUADRO-CAPACIDADE-P53.md](./QUADRO-CAPACIDADE-P53.md) |
| **P5.4** | **Alertas aero** | Vertical | AD/SB/vencimentos ligados a FCU/aeronave |
| **P5.5** | Bling fase 3 (webhooks pedido/NF) | D1 | [COMERCIALIZACAO-BLING-ESCOPO.md](./COMERCIALIZACAO-BLING-ESCOPO.md) |

### Fora do roadmap próximo (parceiro ou nunca)

- ERP fiscal completo (Bling basta).  
- PLM / engenharia de projeto.  
- Planning nível companhia aérea.  
- Pagar.me checkout real (usar Stripe em produção).

---

## 5. Pilares de marketing (alinhados ao produto)

| Pilar | Mensagem | Módulos |
|-------|----------|---------|
| **Operar** | Menos Excel entre hangar e almoxarifado | MRO, estoque, biblioteca |
| **Vender e fidelizar** | Da proposta ao “sim” do cliente | Comercial, portal, WhatsApp, Bling |
| **Crescer a marca** | Mesma identidade na proposta e no cartão | White-label + **Aero Studio** (P5) |

---

## 6. Empacotamento comercial sugerido

| Plano | Inclui | Add-on |
|-------|--------|--------|
| **Base** | Plataforma + 1 módulo | — |
| **MRO Pro** | MRO + estoque + comercial | Portal cliente 2.0 |
| **Marca+** | — | Aero Studio (templates print) |

Feature flags existentes: `tenant.modulos_habilitados` + menu `/meu-menu`.

---

## 7. Critérios de “feito” por fase

- **P4.1:** Proposta `APROVADA` → botão gera OS com vínculo bidirecional; cliente e peças copiados; smoke API (opcional E2E `gerar-os`).  
- **P4.2:** Cliente externo aprova/rejeita proposta; vê OS vinculada (leitura). Aditivo no portal = v1.1.  
- **P5.1:** ≥4 templates export PDF com sangria 3 mm a partir de `sistema_empresa_config`.  
- **P5.3:** Quadro por estágio + AOG + hangares + notificações; cliente vê fila/SLA no portal e recebe e-mail/WhatsApp em mudança de estágio (se configurado).

---

## 8. Atualização de documentos legados

Ao iniciar P4, atualizar:

- `PROXIMOS-PASSOS-DESENV.md` — secção P4/P5 (abaixo).  
- `IMPLEMENTACAO-PLANO-SAAS.md` — matriz comercial/MRO.  
- `COMERCIALIZACAO-BLING-ESCOPO.md` — C4 fechado (import cliente na proposta).

---

## Referências externas (leitura)

- [Aviation maintenance software — wrong solution (2026)](https://www.aero-nextgen.com/insights/aviation-maintenance-software-why-most-mro-operations-are-still-using-the-wrong-solution-in-2026)  
- [Paperless paradox in MRO — Sensus](https://sensus.aero/paperless-mro-operations/)  
- [IATA — Adopting Aircraft Electronic Records (PDF)](https://www.iata.org/en/publications/electronic-records/)
