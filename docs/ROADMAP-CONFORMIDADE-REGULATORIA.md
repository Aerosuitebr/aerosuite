# Roadmap — Aero Compliance (conformidade regulatória)

Programa de produto para apoiar oficinas Part 145 / MRO na preparação para auditorias (ANAC, EASA, FAA). O software **não substitui** o SGQ certificado da organização; implementa evidências operacionais integradas.

## Onda A — Feito

| ID | Entrega | Estado |
|----|---------|--------|
| A1 | Dossiê de auditoria 2.0 (checklist + peças com rastreio/certificado no PDF) | **Feito** (PDF) |
| A2 | Linha do tempo da peça (`/estoque/rastreio` + API + PDF) | **Feito** |
| A3 | Pacote auditoria do tenant (ZIP multi-OS) | **Feito** |
| A4 | Perfis regulados (papéis Part 145) + `CRS_EMITIR` + segregação execução/CRS | **Feito** |
| A5 | Kit conformidade 30 dias (CSV SGQ + checklist persistido) | **Feito** ([KIT-GOLIVE-30-DIAS.md](./KIT-GOLIVE-30-DIAS.md)) |

## APIs novas (A2 / A3)

| Método | Path |
|--------|------|
| GET | `/api/estoque/rastreio/{codigo}/linha-tempo` |
| GET | `/api/estoque/itens/{id}/linha-tempo` |
| GET | `/api/estoque/rastreio/{codigo}/linha-tempo/pdf?locale=pt-BR` |
| GET | `/api/dossie-auditoria/pacote/resumo?dataInicio&dataFim&limite&numerosOs` |
| GET | `/api/dossie-auditoria/pacote/zip?...&locale=pt-BR` |

## UI

- **Estoque → Rastreio de peça** (`/estoque/rastreio`)
- Atalho na **Consulta QR** → rastreio completo
- **Dossiê de auditoria** → secção *Pacote de auditoria (organização)* (pré-visualizar + ZIP)

## Onda B — Feito

| ID | Entrega | Estado |
|----|---------|--------|
| B1 | CRS / liberação para serviço (checklist + PDF) | **Feito** |
| B2 | Certificado de peça estruturado + anexo + bloqueio na saída | **Feito** |
| B3 | Quarentena de material (fluxo completo) | **Feito** |
| B4 | Retenção / export de registros de manutenção (arquivo morto) | **Feito** |
| B5 | Job card mobile / hangar (MVP) | **Feito** |
| B6 | AD/SB e alertas aeronáuticos | **Feito** |
| B7 | Habilitações técnicas (mecânicos / inspetores / RT) | **Feito** |
| M8 | Revisão de claims de marketing (`AERO-SUITE-ROTEIROS-VIDEO.json`) | **Feito** |

### APIs B1

| Método | Path |
|--------|------|
| GET | `/api/os/{osId}/crs/checklist` |
| GET | `/api/os/{osId}/crs` |
| POST | `/api/os/{osId}/crs/emitir` |
| GET | `/api/os/{osId}/crs/pdf?locale=pt-BR` |

### UI B1

- **Ordens de serviço** → editar OS → **Emitir CRS**

## Fechado neste ciclo (A3/B1 complementos)

- Campos **CRS** expostos no `OSDto` / listagem de OS (ícone + tooltip).
- Pacote ZIP inclui **anexos binários** (`os/OS_<n>/anexos/`) e **CRS PDF** quando emitido.

### A4 — perfis Part 145 (Flyway `V29`)

| Código perfil | Papel |
|---------------|--------|
| `P145_RT` | Responsável técnico — operacional + CRS + dossiê |
| `P145_INSPETOR` | Inspetor / qualidade — OS leitura + CRS + dossiê |
| `P145_EXECUCAO` | Mecânico — como `OPERADOR`, **sem** `CRS_EMITIR` |
| `P145_ALMOX` | Almoxarifado — família `ESTOQUE*` |
| `P145_COMERCIAL` | Comercial — `propostas-comerciais` |

Funcionalidade oculta no menu: **`CRS_EMITIR`**. Regra de independência: utilizador que criou/alterou a OS na trilha `os_auditoria` não emite CRS (exceto `P145_RT`, `P145_INSPETOR`, `ADMIN`, `QUALIDADE`, etc.).

### B2 — certificado de peça (Flyway `V30`)

| Campo / regra | Descrição |
|---------------|-----------|
| `cert_tipo` | FAA_8130_3, EASA_FORM1, ANAC, DUAL_RELEASE, OUTRO |
| `cert_numero`, `cert_emissor`, `cert_data_emissao`, `cert_orgao_aprovacao` | Metadados estruturados |
| Anexo | PDF/JPEG/PNG em `uploads/estoque-certificados/` (ou `estoque.certificados.base.path`) |
| Flag tenant | `estoque.saida.exigeCertificadoPeca` (ativa por defeito na migração) |
| Saída | Bloqueada se certificado incompleto (itens legados só com texto `certificado_conformidade` continuam válidos) |

| Método | Path |
|--------|------|
| GET | `/api/estoque/saida/regras` |
| GET/PUT | `/api/estoque/itens/{id}/certificado` |
| POST | `/api/estoque/itens/{id}/certificado/anexo` |
| GET | `/api/estoque/itens/{id}/certificado/anexo` |

### B3 — quarentena (Flyway `V31`)

| Ação | Descrição |
|------|-----------|
| Enviar | Itens `DISPONIVEL` / `RESERVADO` → status `QUARENTENA` + movimentação |
| Resolver | `LIBERAR_ESTOQUE`, `DESCARTAR` ou `DEVOLVER_FORNECEDOR` |
| Bloqueio | Saída/consumo em OS recusada para `QUARENTENA` e `BLOQUEADO` |

| Método | Path |
|--------|------|
| GET | `/api/estoque/quarentena` |
| POST | `/api/estoque/itens/{id}/quarentena` |
| POST | `/api/estoque/itens/{id}/quarentena/liberar` |

UI: **Estoque → Quarentena**; botão escudo na lista de itens.

### B4 — retenção de registros (Flyway `V32`)

| Item | Descrição |
|------|-----------|
| Política | `retencao_registros_anos` em `sistema_empresa_config` (padrão 5 anos, 1–50) |
| Inventário | Contagem de OS fechadas dentro/fora do prazo + amostra |
| Export | ZIP arquivo morto (dossiê + CRS + anexos) filtrado por **data de fechamento** + `RETENCAO.txt` |

| Método | Path |
|--------|------|
| GET | `/api/conformidade/retencao` |
| PUT | `/api/conformidade/retencao` |
| GET | `/api/conformidade/retencao/inventario` |
| GET | `/api/conformidade/retencao/export/zip` |

UI: **Dossiê de auditoria** → secção *Retenção de registros*.

Pacote de auditoria: query opcional `periodoCampo=fechamento` nos endpoints `/pacote/*`.

### B5 — Job card mobile / hangar (Flyway `V33`)

| Recurso | Descrição |
|---------|-----------|
| Lista | OS abertas (`dataFechamento` nulo, ativas) com busca |
| Execução | Atualização de início/fim/observações + trilha `os_auditoria` |
| Horas | Apontamentos por data (`os_job_card_apontamento`) |
| Fotos | Upload via API existente `/api/os-files/os/{id}/upload` |
| Assinatura | Canvas → PNG (`EXECUCAO`, `INSPECAO`) |

| Método | Path |
|--------|------|
| GET | `/api/os/job-card/abertas` |
| GET | `/api/os/job-card/{osId}` |
| POST | `/api/os/job-card/{osId}/apontamentos` |
| PUT | `/api/os/job-card/{osId}/execucao` |
| POST | `/api/os/job-card/{osId}/assinatura` |

UI: **Hangar (job card)** (`/hangar`) — layout mobile-first.

### B6 — AD/SB e alertas (Flyway `V34`)

| Recurso | Descrição |
|---------|-----------|
| Cadastro | Tipo AD/SB/OUTRO, número, título, emissor, ATA, FCU, P/N, SN |
| Prazos | `data_limite_cumprimento`, status e OS de cumprimento |
| Alertas | Vencidas e próximas (janela configurável em dias) |
| Contexto OS | `GET /aplicaveis?fcuId&partNumber&serialNumber` |

| Método | Path |
|--------|------|
| GET | `/api/aero/diretrizes` |
| GET | `/api/aero/diretrizes/alertas?dias=30` |
| GET | `/api/aero/diretrizes/aplicaveis` |
| POST/PUT/DELETE | `/api/aero/diretrizes/{id}` |

Funcionalidade menu: **`AD_SB_ALERTAS`**. UI: `/aero/diretrizes`.

Os campos legados `tituloAds` / `boletinsServAfins` na OS permanecem; o cadastro estruturado substitui o uso apenas em texto livre.

### B7 — Habilitações técnicas (Flyway `V35`)

| Recurso | Descrição |
|---------|-----------|
| Cadastro | Tipo MECANICO / INSPETOR / RT / OUTRO, escopo, identificador, emissor, datas |
| Alertas | Vencidas e próximas (janela em dias) |
| CRS | Emissão exige habilitação RT ou inspetor válida (override: ADMIN, GERENTE, QUALIDADE, etc.) |

| Método | Path |
|--------|------|
| GET | `/api/conformidade/habilitacoes` |
| GET | `/api/conformidade/habilitacoes/alertas?dias=60` |
| GET | `/api/conformidade/habilitacoes/usuario/{usuarioId}` |
| POST/PUT/DELETE | `/api/conformidade/habilitacoes/{id}` |

Funcionalidade menu: **`HABILITACAO_TECNICA`**. UI: `/conformidade/habilitacoes`.

### M8 — Marketing / claims (2026-05-18)

| Item | Descrição |
|------|-----------|
| `avoid_claims` | Lista ampliada (homologação, garantia de fiscalização, SGQ, endorsement ANAC) |
| `claim_replacements` | Guia para IAs e copywriters |
| V05 | Título sem «Auditoria ANAC»; voiceover reforça que não substitui SGQ |
| V01, V03, V04 | Ajustes de linguagem + capacidades Onda B |
| V12 | Novo roteiro *Conformidade Part 145* (B1–B7) |

Documentação: [COMO-USAR-ROTEIROS-COM-IAS.md](./marketing/COMO-USAR-ROTEIROS-COM-IAS.md).

## Reforço de confiabilidade (auditoria de lacunas — 2026-05-18)

| Área | Correção |
|------|----------|
| API erros | `GlobalExceptionMapper` expõe chave i18n em `error`, `message` e `code` |
| CRS | Segregação falha se `userId` nulo; bloqueio de reemissão; validações com chaves i18n |
| CRS UI | Dialog usa `translateApiError` (lê `message` do backend) |
| Habilitações | Busca no JPQL; tenant do usuário; validade obrigatória para CRS RT/inspetor |
| Quarentena | Sem fallback usuário `1L`; exige autenticação |
| Hangar | Flyway `V36` — funcionalidade `HANGAR_JOB_CARD` no menu |
| i18n | Chaves `habilitacao.error.*`, `hangar.jobcard.error.*`, `aero.diretriz.error.*`, `crs.error.*`, certificado alias |
| Testes | `GlobalExceptionMapperI18nTest`, `Part145CrsSegregationEmitTest` |

### Lacunas conhecidas (backlog) — concluídas 2026-05-19

- [x] Testes `@QuarkusTest` — `ConformidadeApiAuthIT` (401/403 sem JWT).
- [x] Painel AD/SB na OS — `app-os-ad-sb-aplicaveis` + `GET /aplicaveis`.
- [x] Aviso hangar — `alertaCrsSegregacao` no job card + banner i18n.
- [x] Índice `idx_item_estoque_tenant_status` — Flyway `V37`.
- [x] Remoção fallback `uid = 1L` em mutações de estoque — `requireAuthenticatedUserId`.

## P5 — Qualidade de release (2026-06-07)

| ID | Entrega | Estado |
|----|---------|--------|
| P5.1 | E2E Playwright — painel qualidade, NC, hangar | **Feito** (`e2e/tests/conformidade-painel-hangar.spec.ts`) |
| P5.2 | Smoke browser hangar offline (IndexedDB / SW / fila sync) | **Feito** (`e2e/tests/hangar-offline.spec.ts` + `provision-e2e-hangar-os.ps1`) |
| P5.2b | Manual homologação — Fase 7 SGQ (Apêndice A + cap. 11) | **Feito** — atualizado P5.3 SMS + P5.4 relatório SGQ (`manual-chapters.html`) |
| P5.2c | Smoke enforcement API — calibração + treino + subcontratação | **Feito** (`api-conformidade-enforcement-smoke.ps1`, 8 asserts) |
| P5.3 | SMS / indicadores avançados (evolução pós-MVP NC) | **Feito** (`GET /api/conformidade/sms/indicadores` + painel UI) |
| P5.4 | Relatórios SGQ exportáveis (além do pacote auditoria) | **Feito** (`GET /api/conformidade/relatorios/sgq.zip` + `api-conformidade-relatorios-smoke.ps1`) |

**Cobertura regulatória MVP + pós-MVP P5:** Ondas A–D + P1–P4 + P5.1–P5.4 ≈ **100 %** do escopo documentado (MVP + evolução SMS/relatórios).

## Próximo

Ondas A–D, P1–P4 e **P5.1–P5.4** conformidade **encerradas** no código. **Fase D infra** (deploy produção) ou merge `desenv` → `master` — ver [PROXIMOS-PASSOS-DESENV.md](./PROXIMOS-PASSOS-DESENV.md).

## Onda C — SGQ operacional (2026-06-06)

> **Disclaimer:** O Aero Suite **não substitui** o SGQ certificado da organização (MOE/POP físicos, auditorias de processo, SMS completo). Também **não existe “homologação ANAC do software”** como produto — o valor está em evidências operacionais integradas.

| ID | Lacuna regulatória | Entrega | Estado |
|----|-------------------|---------|--------|
| C1 | SGQ / MOE / POPs | Cadastro de documentos controlados (tipo, revisão, vigência, status) | **Feito** |
| C2 | Treinamento formal | Registros por usuário + alertas de validade | **Feito** |
| C3 | Calibração | Ferramentas/instrumentos + alertas | **Feito** |
| C4 | ASL fornecedores | Campos ASL no cadastro de fornecedores | **Feito** |
| C5 | Subcontratação | Registro Part 145 subcontratados + OS vinculada | **Feito** |
| C6 | SMS / NC | Ocorrências, severidade, ações corretivas | **Feito** (MVP) |
| C7 | Controle documental | Revisão obrigatória + alertas de vigência | **Feito** (C1) |
| C8 | Offline hangar | PWA / service worker job card | **Feito** (SW + fila localStorage) |
| C9 | Kit go-live checklist | Persistência BD + API PUT | **Feito** (V53) |
| C10 | Homologação ANAC software | N/A — documentação apenas | **N/A** |

### Flyway `V57`

Colunas de anexo PDF em `sgq_documento_controlado` (`arquivo_path`, `arquivo_nome`, …). Upload em `uploads/sgq-documentos/` (config `sgq.documentos.base.path`).

| Método | Path |
|--------|------|
| POST | `/api/conformidade/documentos/{id}/arquivo` (multipart PDF, máx. 25 MB) |
| GET | `/api/conformidade/documentos/{id}/arquivo` |

### Hangar offline (C8)

| Camada | Descrição |
|--------|-----------|
| Fila | `localStorage` — execução, horas, fotos, assinaturas |
| Sync | `HangarOfflineSyncService` — flush automático ao voltar online |
| PWA | `hangar-sw.js` + `manifest.webmanifest` — shell cacheado em produção |
| UI | Banner offline, botão *Sincronizar agora*, hint instalar na tela inicial |

Instalação mobile: abrir `/hangar` → *Adicionar à tela inicial* (Safari/Chrome).

### Flyway `V56`

Tabelas: `sgq_documento_controlado`, `conformidade_treinamento`, `conformidade_calibracao_ferramenta`, `conformidade_nao_conformidade`, `conformidade_subcontratacao`; colunas ASL em `fornecedor`.

### APIs C1–C6

| Método | Path |
|--------|------|
| GET/POST/PUT/DELETE | `/api/conformidade/documentos` |
| GET | `/api/conformidade/documentos/alertas?dias=60` |
| GET/POST/PUT/DELETE | `/api/conformidade/treinamentos` |
| GET | `/api/conformidade/treinamentos/alertas?dias=60` |
| GET/POST/PUT/DELETE | `/api/conformidade/calibracao` |
| GET | `/api/conformidade/calibracao/alertas?dias=30` |
| GET/POST/PUT/DELETE | `/api/conformidade/nao-conformidades` |
| GET/POST/PUT/DELETE | `/api/conformidade/subcontratacao` |
| GET | `/api/conformidade/subcontratacao/alertas?dias=60` |
| PUT | `/api/go-live-migracao/checklist` (persistência C9) |

### UI Onda C

| Rota | Funcionalidade |
|------|----------------|
| `/conformidade/documentos` | `SGQ_DOCUMENTO_CONTROLADO` |
| `/conformidade/treinamentos` | `CONFORMIDADE_TREINAMENTO` |
| `/conformidade/calibracao` | `CONFORMIDADE_CALIBRACAO` |
| `/conformidade/nao-conformidades` | `CONFORMIDADE_NC` |
| `/conformidade/subcontratacao` | `CONFORMIDADE_SUBCONTRATACAO` |
| Estoque → Fornecedores | ASL no formulário existente |
| `/go-live-migracao` | Checklist persistido (C9) |

Relacionado: [DOSSIE-AUDITORIA.md](./DOSSIE-AUDITORIA.md) · [ROADMAP-DIFERENCIACAO-MRO.md](./ROADMAP-DIFERENCIACAO-MRO.md) · **[Dossiê ANAC (submissão)](./anac-conformidade/README.md)**

## Onda D — Evidências SGQ para auditoria (2026-06-07)

| ID | Entrega | Estado |
|----|---------|--------|
| D1 | Pacote ZIP/PDF com bloco SGQ (NC, treinos, calib, docs, ASL) | **Feito** |
| D2 | Painel qualidade (`/conformidade/painel`) | **Feito** |
| D3 | Enforcement ASL na entrada de material; alertas calibração no hangar | **Feito** |
| D4 | CAPA workflow NC (causa, contenção, eficácia) | **Feito** |
| D5 | Revisão documental + histórico + obsoletar rev. anterior | **Feito** |
| D6 | Treinamento obrigatório por função + alertas OS/hangar | **Feito** |
| D7 | Testes auth Onda C/D + kit go-live semana 5 | **Feito** |
| D8 | Hangar IndexedDB + cache SW job-card | **Feito** |

### Flyway `V58`

CAPA em `conformidade_nao_conformidade`, `sgq_documento_revisao_historico`, `conformidade_treinamento_obrigatorio`, funcionalidades `CONFORMIDADE_PAINEL` e `CONFORMIDADE_TREINAMENTO_OBRIG`.

| Método | Path |
|--------|------|
| GET | `/api/conformidade/painel?dias=60` |
| GET/POST/PUT/DELETE | `/api/conformidade/treinamentos-obrigatorios` |
| GET | `/api/conformidade/documentos/historico/{codigo}` |
| POST | `/api/conformidade/documentos/{id}/nova-revisao` |
| GET | `/api/os/{id}/conformidade-alertas` |

Pacote auditoria: pasta `sgq/resumo.csv` + `sgq/snapshot.json`. PDF do dossiê inclui secção SGQ.

## P1 — Enforcement operacional (2026-06-07)

| ID | Entrega | Estado |
|----|---------|--------|
| P1.1 | Bloqueio calibração vencida (saída estoque + hangar) | **Feito** (flag tenant) |
| P1.2 | Bloqueio treino obrigatório (hangar + CRS) | **Feito** (flag tenant) |
| P1.3 | Bloqueio subcontratação certificado vencido na OS | **Feito** (flag tenant) |
| P1.4 | ASL na entrada direta de estoque (`entradaEstoque`) | **Feito** |

Flyway `V59`: flags em `sistema_empresa_config`, `ferramenta_identificador` em apontamento hangar.

| Método | Path |
|--------|------|
| GET/PUT | `/api/conformidade/enforcement` |

UI: toggles no **Painel qualidade** (`/conformidade/painel`).

## P2 — UX e operação (2026-06-07)

| ID | Entrega | Estado |
|----|---------|--------|
| P2.1 | Painel qualidade — janela `dias` configurável na UI | **Feito** |
| P2.2 | Grid NC — coluna CAPA com tag visual | **Feito** |
| P2.3 | Dossiê — hint pasta `sgq/` no pacote ZIP | **Feito** |
| P2.4 | Home — card atalho alertas SGQ | **Feito** |
| P2.5 | Smoke API hangar offline sync | **Feito** (`api-hangar-offline-sync-smoke.ps1`) |

## P3 — CAPA guiado, perfis e hangar (2026-06-07)

| ID | Entrega | Estado |
|----|---------|--------|
| P3.1 | Dialog NC — stepper CAPA por fase (REGISTRO → FECHADA) | **Feito** |
| P3.2 | Flyway V60 — `CONFORMIDADE_PAINEL` / `CONFORMIDADE_TREINAMENTO_OBRIG` para perfis SGQ existentes | **Feito** |
| P3.3 | Hangar — campo `ferramentaIdentificador` no apontamento (online + fila offline) | **Feito** |

Flyway `V60`: backfill de perfis com módulos Onda C/D e perfis Part 145 (`P145_RT`, `P145_INSPETOR`, etc.).

## P4 — CI, go-live NC e polish (2026-06-07)

| ID | Entrega | Estado |
|----|---------|--------|
| P4.1 | Hangar — alertas SGQ com `translateApiMessage` (i18n correto) | **Feito** |
| P4.2 | Smoke API enforcement na suite CI | **Feito** (`api-conformidade-enforcement-smoke.ps1`) |
| P4.3 | Kit go-live — CSV seed `nao-conformidades.csv` + import | **Feito** |
| P4.4 | Painel qualidade — cards clicáveis para módulos SGQ | **Feito** |
