# Escopo sugerido — integração Bling (ERP / fiscal)

Documento vivo para alinhar **comercial + jurídico + TI** antes de qualquer código de integração. Referência externa: material Bling na raiz do repositório (PDF de proposta comercial, quando existir).

## Objetivos de negócio (escolher prioridade)

1. **Só leitura (recomendado para MVP)** — buscar na Bling: clientes, produtos, NCM/CFOP de referência, status de NF-e, **sem** emitir documento fiscal pela suite.
2. **Orçamento → pedido** — criar pedido rascunho na Bling a partir de proposta aprovada (exige regras de filial, CFOP, série, alíquotas).
3. **Emissão fiscal** — **alto risco** (certificado A1/A3, contingência, cancelamento). Normalmente fica **fora** da primeira onda ou fica 100% na Bling com link manual.

## Decisões que precisam estar fechadas

| Tema | Perguntas |
|------|-----------|
| Conta | Uma conta Bling por cliente SaaS ou só Aero Suite (single-tenant atual)? |
| Token | Onde guardar `client_id` / `client_secret` (env, vault, tabela criptografada)? |
| Mapeamento | Como ligar `ClienteProposta` / cadastro interno ao `contato_id` ou `id` da Bling? |
| Idempotência | Mesma proposta não pode gerar dois pedidos; como detectar reenvio? |
| Erros | Timeout, 429, token expirado: fila de retentativa ou só mensagem ao usuário? |

## MVP técnico sugerido (fase 1)

- **Endpoint interno** (ex.: `GET /api/integracoes/bling/status`) — valida credenciais e retorna “ok / não configurado / erro”.
- **Cliente HTTP** isolado em um pacote `com.aerosuite.integration.bling` com interface `BlingClient` + implementação REST.
- **Feature flag** por variável de ambiente, ex.: `BLING_API_ENABLED=false` (padrão desligado em produção até homologação).
- **Nenhuma** migração destrutiva: tabelas novas só com Flyway (`V6__…`) quando o modelo de dados estiver definido.

## Fase 2 (quando a fase 1 estiver estável)

- **Implementado (P3):** `GET /api/integracoes/bling/contatos?pesquisa=&limit=` + botão «Importar da Bling» na proposta comercial (`BlingApiService`, diálogo de pesquisa, i18n PT/EN/ES/FR).
- **Webhook (P5.5 — MVP):** `POST /api/integracoes/bling/webhook` — HMAC `X-Bling-Signature-256`, idempotência por `event_id` (Flyway `V41`). Variáveis `AERO_SUITE_BLING_CLIENT_SECRET`, `AERO_SUITE_BLING_WEBHOOK_ENABLED`. Processamento de negócio (atualizar pedido/NF-e) ainda evolutivo.

## Fora de escopo inicial (explícito)

- Substituir o módulo de proposta interno pela Bling.
- Armazenar certificado digital da Aero Suite dentro da suite sem HSM / política de segurança definida.

## Decisões MVP (fechado para código — Maio/2026)

| Tema | Decisão |
|------|---------|
| Conta | **Uma conta Bling por tenant SaaS** (token em env global na Onda 1; tabela criptografada na Onda 2). |
| Objetivo fase 1 | **Só leitura** — validar credenciais (`GET /api/integracoes/bling/status`). |
| Token | Variáveis `AERO_SUITE_BLING_ENABLED` + `AERO_SUITE_BLING_ACCESS_TOKEN` (não commitar). |
| Mapeamento / pedidos / NF-e | **Fora** do MVP — fase 2 após piloto comercial. |
| Erros | Mensagem na UI; sem fila de retentativa no MVP. |

**Implementado:** `com.aerosuite.integration.bling.BlingHttpClient`, `BlingIntegrationResource`.

## Fase 3 — pedido ↔ proposta + NF-e (Jun/2026)

| Item | Status |
|------|--------|
| Flyway `V50` — `proposta_bling_pedido`, `bling_nfe_registro` | Implementado |
| `POST/GET …/propostas/{id}/pedido`, `GET …/nfe` | Implementado |
| Webhook pedido/NF-e → fila → `BlingWebhookProcessor` | Implementado |
| UI proposta — botão «Enviar pedido à Bling», badge, lista NF-e | Implementado |
| Testes unitários (`BlingPedidosJsonParserTest`, `PropostaBlingPedidoServiceTest`, `BlingWebhookFlowTest`, …) | Implementado |

## Roteiro — teste real ponta a ponta

Pré-requisitos de ambiente (`.env` / secrets do deploy):

| Variável | Obrigatório | Notas |
|----------|-------------|-------|
| `AERO_SUITE_BLING_ENABLED=true` | Sim | Feature flag global |
| `AERO_SUITE_BLING_CLIENT_ID` | Sim | App em [developer.bling.com.br](https://developer.bling.com.br/aplicativos) |
| `AERO_SUITE_BLING_CLIENT_SECRET` | Sim | Usado no OAuth **e** HMAC webhook (`X-Bling-Signature-256`) |
| `AERO_SUITE_BLING_REDIRECT_URI` | Sim | Ex.: `https://<api>/api/integracoes/bling/oauth/callback` |
| `AERO_SUITE_SECRETS_KEY` | Sim | 32+ chars — cifra tokens OAuth por tenant |
| `AERO_SUITE_BLING_WEBHOOK_ENABLED=true` | Sim | Recepção de eventos |
| `AERO_SUITE_BLING_SYNC_ENABLED=true` | Sim | Scheduler processa fila (~30 s) |
| Flyway até **V50** | Sim | Tabelas pedido/NF-e |
| Flyway **V51** | Sim | Config fiscal + certificado por tenant |
| API acessível pela internet | Sim | OAuth callback + webhook Bling |

### Escopos obrigatórios no app Bling

A Bling **não** usa parâmetro `scope` na URL OAuth — as permissões vêm do cadastro do app em [developer.bling.com.br/aplicativos](https://developer.bling.com.br/aplicativos). Após alterar escopos, **desconecte e reconecte** OAuth na Aero Suite.

| Módulo Bling | Permissão |
|--------------|-----------|
| Cadastros → Contatos | Gerenciar + visualizar contatos |
| Cadastros → Produtos | Gerenciar produtos (opcional) |
| Vendas → Pedidos de venda | Gerenciar + visualizar |
| Notas fiscais → NF-e | Visualizar + emitir |
| Empresa | Dados básicos |
| Webhooks | Contatos, pedidos, NF-e |

Diagnóstico na API: `GET /api/integracoes/bling/scopes`  
Bootstrap E2E: `POST /api/integracoes/bling/bootstrap/homologacao`  
Script: `.\scripts\test\api-bling-e2e.ps1`

### 1. Conectar tenant

1. Subir backend + frontend com variáveis acima.
2. Login como **admin** → **Configurações** → **Integração Bling** → **Conectar Bling**.
3. Autorizar no Bling; confirmar tag «Conta Bling conectada» e `companyId` exibido.
4. **Testar conexão** — deve retornar OK.

### 2. Webhook na Bling

1. No painel Bling / app OAuth, registrar URL:
   - Preferencial: `POST https://<api>/api/integracoes/bling/webhook` (tenant via `companyId` no payload).
   - Alternativa (staging): `POST https://<api>/api/integracoes/bling/webhook/t/<codigo-tenant>`.
2. Eventos mínimos: **contatos**, **pedidos de venda**, **NF-e** (nomenclatura conforme app Bling).
3. Disparar evento de teste; em Configurações verificar «Último webhook» e fila sem jobs mortos.

### 3. Fluxo comercial completo

1. **Proposta comercial** → aba cliente → **Importar da Bling** → buscar contato → **Usar** (cria/vincula `ClienteProposta`).
2. Preencher itens/valores; **Marcar aprovada** (status `APROVADA`).
3. Clicar **Enviar pedido à Bling** → confirmar → badge «Pedido Bling» com número/situação.
4. Na Bling: validar pedido com `numeroLoja` = `numero_proposta` da suite e itens corretos.
5. (Opcional) Alterar situação do pedido na Bling → aguardar webhook + scheduler → observações da proposta atualizadas.
6. **Concluir o serviço na OS** (data de conclusão ou fechamento) → emissão automática de NF-e (se checkbox ativo) ou retry pelo scheduler.
7. Webhook `nfe.autorizada` → lista NF-e na proposta/OS + notificação in-app + e-mail opcional ao cliente.
   - **Ou** clicar **Emitir NF-e** na proposta (API `POST …/nfe/emitir`) após certificado configurado.

### 4. Verificações técnicas

| Verificação | Como |
|-------------|------|
| Pedido idempotente | Segundo «Enviar pedido» retorna pedido existente, não duplica na Bling |
| Sync status | `GET /api/integracoes/bling/sync/status` — `mappedContacts`, `linkedPedidos`, `nfeRegistros` |
| Pedido na proposta | `GET /api/integracoes/bling/propostas/{id}/pedido` |
| NF-e na proposta | `GET /api/integracoes/bling/propostas/{id}/nfe` |
| Fila | Tabela `bling_sync_job` — status `PENDING` → `DONE`; falhas com backoff |
| Logs | `PropostaBlingPedidoService`, `BlingFiscalSyncService`, `BlingWebhookProcessor` |

### 5. Testes automatizados (local)

```powershell
cd backend
mvn test "-Dtest=BlingPedidosJsonParserTest,PropostaBlingPedidoServiceTest,BlingFiscalSyncServiceTest,BlingWebhookFlowTest,BlingWebhookServiceTest,FiscalCertificateUtilTest"
```

### 6. Smoke test PowerShell (webhook + fila + OS/NF-e)

Com API e MySQL locais rodando:

```powershell
# Secret igual ao backend (HMAC webhook)
$env:AERO_SUITE_BLING_CLIENT_SECRET = 'seu-client-secret'

# Opcional: proposta que já tem pedido Bling vinculado
$env:AEROSUITE_BLING_SMOKE_PROPOSTA_ID = '123'

.\scripts\test\api-bling-smoke.ps1 -WaitSeconds 35
```

Flags úteis:

| Flag | Efeito |
|------|--------|
| `-AllowJobFailure` | Não falha se jobs morrerem sem API Bling real |
| `-SkipMysql` | Só testes HTTP |
| `-SkipWebhook` | Pula simulação HMAC |
| `-SkipWait` | Não aguarda scheduler (30s) |

O script valida: login, status Bling, fiscal-config, webhooks assinados, `bling_webhook_event`, fila `bling_sync_job`, e (com proposta) `proposta_bling_pedido`, `os_id`, `bling_nfe_registro`.

### Capacidades implementadas no sistema (V51+)

| Recurso | Onde |
|---------|------|
| CFOP, série, NCM, alíquotas, natureza | Configurações → Bling → Configuração fiscal |
| Certificado A1/A3 (.pfx cifrado) | Mesmo painel — upload + validade |
| OS automática ao pedido Bling | Checkbox «Gerar OS automaticamente» |
| NF-e automática ou manual | Checkbox auto — **gatilho = conclusão da OS** (`dataConclusaoServ` ou `dataFechamento`); botão manual na proposta/OS |
| Retry automático do fluxo | Scheduler `BlingFluxoRetryScheduler` (~2 min) + botão «Reprocessar» na proposta/OS |
| Timeline do fluxo | Painel na proposta comercial **e** na edição da OS (`GET …/os/{osId}/fluxo`) |
| NF-e autorizada (webhook) | Notificação in-app + e-mail ao cliente (se `notificacoesEmail` ativo) |
| Emissão SEFAZ | Via API Bling (`POST /nfe`) — certificado também no painel Bling |

### Limitações conhecidas

- Emissão **direta** SEFAZ (sem Bling como intermediário) não está implementada — uso da API Bling.
- Homologação fiscal real depende de credenciamento SEFAZ e naturezas cadastradas **na conta Bling** do tenant.

## Homologação webhook (staging)

| Recurso | Onde |
|---------|------|
| Probe HMAC + fila | `POST /api/integracoes/bling/homologacao/webhook` |
| Incluso no bootstrap | `POST /api/integracoes/bling/bootstrap/homologacao` → `webhookHomologation` |
| Botão na UI | Configurações → Integração Bling → **Testar webhook** |
| URLs sugeridas | `GET` no probe: `webhookUrl` (companyId) e `webhookUrlTenant` (fallback) |

## Próximo passo operacional

1. Obter credenciais de **homologação** Bling e executar roteiro §1–§3 em staging.
2. Clicar **Testar webhook** (ou bootstrap) → registrar URL retornada no app Bling (§2).
3. Piloto com um tenant: proposta → pedido → OS → **conclusão OS** → NF-e; registrar gaps de mapeamento (situação, campos fiscais).
4. Smoke: `scripts/test/api-bling-smoke.ps1` incluído em `verify-covered-suite.ps1`.
