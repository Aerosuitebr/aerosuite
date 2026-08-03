# Feature flags por tenant (Aero Suite)

Customização por organização **sem fork de código** nem deploy dedicado: mesma aplicação, dados isolados por `tenant_id`, comportamento opcional atrás de flags validadas no backend.

**Tutorial de ativação:** [TUTORIAL-FEATURE-FLAGS-TENANT.md](./TUTORIAL-FEATURE-FLAGS-TENANT.md)

## Modelo

| Camada | Responsabilidade |
|--------|------------------|
| **`TenantFeatureCatalog` (Java)** | Catálogo oficial de códigos, módulo SaaS, metadados de governação |
| **`tenant_feature` (BD)** | Estado on/off por `tenant_id` + `feature_code` |
| **`TenantFeatureService`** | Leitura, validação (módulo habilitado), gravação |
| **Login / `GET /api/tenant/features`** | Expõe flags ativas ao cliente |
| **`TenantFeatureService` (Angular)** | `isOn('codigo')`, guard de rota, `applyUiVariants()` |
| **Organizações (operador)** | Liga/desliga flags por cliente |

## Convenção de códigos

Formato: `modulo.area.nome` (minúsculas, pontos), por exemplo:

- `estoque.saida.validacaoExtra`
- `comercial.proposta.camposExtras`

Novas flags **entram primeiro no catálogo Java** (`TenantFeatureCatalog.java`), depois nas traduções (`tenant-features-i18n.ts`) e neste documento.

## Catálogo atual

| Código | Módulo | Experimental | Comportamento quando ligada |
|--------|--------|--------------|----------------------------|
| `estoque.saida.validacaoExtra` | ESTOQUE | sim | OS + motivo (mín. 10 chars) em `POST /api/estoque/saida`; UI saída de estoque |
| `estoque.saida.exigeCertificadoPeca` | ESTOQUE | não | Bloqueia saída/reserva sem certificado completo; `GET /api/estoque/saida/regras` |
| `estoque.consultaQr.historicoExtendido` | ESTOQUE | sim | Histórico QR até 250 movimentações + detalhes; `GET /api/estoque/consulta-qr/regras` |
| `comercial.proposta.camposExtras` | COMERCIAL | sim | Referência cliente, contato técnico, centro de custo na proposta; `GET .../campos-extras/regras` |
| `mro.os.dashboardExtendido` | MRO | sim | KPIs por estágio na lista OS; `GET /api/os/painel-resumo` |
| `platform.ui.variantePremium` | PLATFORM | não | Classe `as-ui-premium` no shell (sombras/raios reforçados) |

> Flags experimentais devem ter data de revisão e decisão: promover ao core, manter como flag ou remover.

## API

| Método | Path | Quem | Descrição |
|--------|------|------|-----------|
| GET | `/api/tenant/features` | Utilizador autenticado | `{ "enabled": ["..."] }` do tenant da sessão |
| GET | `/api/tenants/{id}/features` | Operador plataforma | Catálogo + estado |
| PUT | `/api/tenants/{id}/features` | Operador plataforma | Body: `{ "enabled": ["codigo", ...] }` |
| PUT | `/api/tenants/{id}` | Operador plataforma | Campo opcional `featuresHabilitadas` (mesma semântica) |

O `UserDto` do login inclui `tenantFeatures` (lista de códigos ativos).

## Frontend

```typescript
// Serviço injetável
tenantFeatures.isOn('estoque.saida.validacaoExtra');

// Template
*ngIf="tenantFeatures.isOn('comercial.proposta.camposExtras')"

// Rota (app.routes.ts)
canActivate: [AuthGuard, TenantFeatureGuard],
data: { tenantFeature: { tenantFeaturesAny: ['mro.os.dashboardExtendido'] } }
```

## Backend

```java
@Inject TenantFeatureService tenantFeatureService;

if (tenantFeatureService.isEnabled(tenantId, TenantFeatureCodes.ESTOQUE_SAIDA_VALIDACAO_EXTRA)) {
    // ramo customizado
}
```

### Anotação `@RequiresTenantFeature`

Bloqueia o endpoint se o tenant não tiver a flag (filtro `TenantFeatureAuthorizationFilter`):

```java
@GET
@Path("/painel-resumo")
@RequiresTenantFeature(allOf = { TenantFeatureCodes.MRO_OS_DASHBOARD_EXTENDIDO })
public OsPainelResumoDto painelResumo() { ... }
```

Regra: **nunca** confiar só no `*ngIf`; validar na API quando a flag altera regra de negócio ou dados expostos.

## Política comercial (resumo)

| Tipo | Tratamento |
|------|------------|
| **Custom pontual** | Horas + flag dedicada; piloto documentado na tabela acima |
| **Produtização** | Comportamento vira padrão do core; flag removida ou default on |
| **Fork / VPS dedicado** | Só se flags + extensões não bastarem (custo de manutenção dupla) |

## Migração

- Flyway: `V27__tenant_feature.sql`
- Campos extras proposta: `V61__proposta_campos_extras.sql`
