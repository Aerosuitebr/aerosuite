# Tutorial — ativação de feature flags por organização

Guia para **operadores da plataforma** e **administradores de tenant** sobre como ligar/desligar customizações da Aero Suite sem deploy dedicado.

**Relacionado:** [TENANT-FEATURES.md](./TENANT-FEATURES.md)

---

## 1. Quem pode alterar flags?

| Perfil | Onde altera | Escopo |
|--------|-------------|--------|
| **Operador plataforma** | Menu **Organizações** (`/organizacoes`) → editar tenant → seção *Feature flags* | Qualquer organização |
| **Usuário do tenant** | Não altera flags | Apenas consome o comportamento após login |

Alterações gravam na tabela `tenant_feature` e passam a valer no próximo request (UI) ou no próximo login (se o cliente já estava com sessão aberta, peça **novo login** ou aguarde refresh de `GET /api/tenant/features`).

---

## 2. Passo a passo (painel Organizações)

1. Entre com usuário **operador** (perfil com acesso a `/organizacoes`).
2. Abra **Organizações** e localize o tenant (código, razão social ou e-mail).
3. Clique em **Editar** na linha da organização.
4. Role até **Feature flags** (lista com nome traduzido + descrição).
5. Marque as flags desejadas e **Salvar**.
6. Confirme que o módulo SaaS do tenant inclui o módulo da flag (ex.: flag **COMERCIAL** exige módulo comercial habilitado em *Módulos*).
7. Peça a um usuário do tenant que faça **logout/login** (ou F5 na tela afetada) para recarregar `tenantFeatures` no JWT.

### API equivalente (automação)

```http
PUT /api/tenants/{tenantId}/features
Content-Type: application/json

{
  "enabled": [
    "estoque.saida.validacaoExtra",
    "comercial.proposta.camposExtras"
  ]
}
```

---

## 3. Catálogo e efeito de cada flag

| Código | Módulo | O que muda quando **ligada** |
|--------|--------|------------------------------|
| `estoque.saida.validacaoExtra` | ESTOQUE | Saída manual exige **OS** + motivo com **mín. 10 caracteres** (API + tela Saída de estoque). |
| `estoque.saida.exigeCertificadoPeca` | ESTOQUE | Bloqueia saída/reserva se certificado de peça obrigatório estiver incompleto (lista de itens + API). |
| `estoque.consultaQr.historicoExtendido` | ESTOQUE | Consulta QR: histórico até **250** movimentações (padrão 50), com OS, local e observações na timeline. |
| `comercial.proposta.camposExtras` | COMERCIAL | Aba *Condições* da proposta ganha **Referência do cliente**, **Contato técnico** e **Centro de custo** (persistidos na proposta). |
| `mro.os.dashboardExtendido` | MRO | Lista de OS exibe KPIs por estágio da fila (aguardando, execução, peças, inspeção, AOG, CRS pendente). |
| `platform.ui.variantePremium` | PLATFORM | Tema visual reforçado (sombras, raios, hero) em todo o shell interno (`body.as-ui-premium`). |

> Flags **experimental** no catálogo Java devem ter data de revisão; promova ao core ou desligue após piloto.

---

## 4. Como validar após ativar

### Estoque — validação extra

1. Ative `estoque.saida.validacaoExtra`.
2. Login no tenant → **Estoque → Saída**.
3. Tente baixar sem OS: deve bloquear com mensagem i18n.
4. `GET /api/estoque/saida/regras` deve retornar `validacaoExtra: true`.

### Estoque — consulta QR estendida

1. Ative `estoque.consultaQr.historicoExtendido`.
2. **Estoque → Consulta QR** → busque um item → **Ver histórico**.
3. Badge *Histórico estendido (até 250 registros)* e campos extras na timeline.

### Comercial — campos extras

1. Ative `comercial.proposta.camposExtras`.
2. **Comercial → Nova proposta** → aba final → seção **Campos extras**.
3. Preencha e salve; reabra a proposta e confirme persistência.

### MRO — painel OS

1. Ative `mro.os.dashboardExtendido`.
2. **Ordens de serviço** → barra de filtros mostra KPIs adicionais.
3. `GET /api/os/painel-resumo` retorna contagens (403 se flag off).

### Plataforma — UI premium

1. Ative `platform.ui.variantePremium`.
2. Novo login: cards e hero com sombras/raios mais marcados.
3. Inspecione `<body class="as-ui-premium">` no DevTools.

---

## 5. Boas práticas

- **Piloto:** documente tenant piloto e data de revisão na planilha interna antes de ligar flags experimentais.
- **Backend primeiro:** regras de negócio são validadas na API; a UI só espelha — nunca confie só em `*ngIf`.
- **Rollback:** desmarque a flag em Organizações; dados já gravados (ex. campos extras em propostas antigas) permanecem no BD, mas deixam de ser editáveis/exibidos se a flag for desligada.
- **Suporte:** se o cliente não vê a customização, verifique módulo habilitado, flag marcada e sessão renovada.

---

## 6. Referências técnicas

- Catálogo Java: `TenantFeatureCatalog.java`
- Migração BD: `V27__tenant_feature.sql`, `V61__proposta_campos_extras.sql`
- Frontend: `TenantFeatureService`, `tenant-features-i18n.ts`
- Filtro API: `@RequiresTenantFeature`, `TenantFeatureAuthorizationFilter`
