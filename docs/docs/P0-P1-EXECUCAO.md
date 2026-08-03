# Execução P0 / P1 — Flyway, RBAC, Bling, ROI

Guia operacional alinhado ao [STATUS-ADECUACAO-PLANO-COMERCIAL.html](./STATUS-ADECUACAO-PLANO-COMERCIAL.html) e à [IMPLEMENTACAO-PLANO-SAAS.md](./IMPLEMENTACAO-PLANO-SAAS.md).

---

## 1. Flyway numa cópia da base de dados

**Objetivo:** validar o mesmo conjunto de migrações que produção usará, sem risco para o BD real.

1. **Exportar / restaurar** um dump recente para um MySQL dedicado (host ou schema separado). Ver [OPERACAO-STAGING.md](./OPERACAO-STAGING.md).
2. Apontar `QUARKUS_DATASOURCE_JDBC_URL` (ou `.env.staging`) para essa instância.
3. Confirmar ficheiros em `backend/src/main/resources/db/migration/` — sequência actual **V2__ … V63__** (tenant, comercial, conformidade, Bling, billing, branding `V63__sistema_empresa_primary_color`). O script `verify-flyway.ps1` descobre automaticamente todas as versões ≥ V8.
4. Automatizado (MySQL local): `.\scripts\test\verify-flyway.ps1` (todas as versões V8+ em `flyway_schema_history`).
5. Subir a API (ou `mvn quarkus:dev` com perfil adequado) e observar logs Flyway: **sucesso linha a linha**, sem migrações “à metade”.
6. **Antes de `V4__`** em BD com dados legados: executar o `SELECT … HAVING COUNT(*) > 1` descrito no próprio script `V4__normalizar_codigo_funcionalidade_delegacao.sql`; corrigir duplicados de `funcionalidade.codigo` manualmente se necessário.
7. Se o histórico Flyway ficar inconsistente durante testes: em **staging** pode usar `QUARKUS_FLYWAY_REPAIR_AT_START=true`; em produção definir política explícita (geralmente `false`).

---

## 2. RBAC no servidor (`@RequiresFuncionalidades`)

**Estado:** não há dependência Quarkus `quarkus-security` com `@RolesAllowed` no `pom.xml`. O RBAC é **`JwtAuthenticationFilter`** (Bearer obrigatório exceto paths públicos) + **`PermissionAuthorizationFilter`** + anotação **`@RequiresFuncionalidades`**.

**Comportamento (2026-05):** se existirem anotações na **classe** e no **método** JAX-RS do recurso, **ambas** são avaliadas em sequência (intersecção). Isto reforça endpoints onde a política da classe deve continuar a aplicar mesmo com `@RequiresFuncionalidades` no método.

**Códigos com hífen (2026-05):** `FuncionalidadeCodigoNormalizer` trata `usuarios-externos` e `USUARIOS_EXTERNOS` como equivalentes no filtro de permissões.

**Portal externo (2026-05):** `AuthExternoAccessGuard` — token `EXT:` só acede ao próprio `usuarioExternoId`; JWT interno exige `USUARIOS_EXTERNOS` / `GERENCIAR_PERMISSOES` ou perfil super. Teste: `.\scripts\test\api-rbac-smoke.ps1`.

**Resources já citados como sensíveis (exemplos):**

| Resource | Política típica |
|----------|-----------------|
| `PropostaComercialResource` | `allOf`: `propostas-comerciais` (nível classe) |
| `TemplateProdutoServicoResource` | `templates-proposta` |
| `ClientePropostaResource` | `propostas-comerciais` |
| `EstoqueResource` | `anyCodigoStartingWith`: `ESTOQUE` (nível classe) |
| `UsuarioResource` | `allOf`: `USUARIOS` (nível classe) |
| `OSResource` | `anyOf`: `ORDEM_SERVICO`, `CONSULTA_TROCAS_EVENTUAIS` (nível classe) + regras por método |

**Opcional futuro:** mapear JWT para `SecurityIdentity` e usar `@RolesAllowed` onde fizer sentido, sem remover o modelo de códigos `funcionalidade` até haver migração de política.

**Decisão 2026-06:** manter `@RequiresFuncionalidades` como modelo oficial — ver [P0-PLATFORM-STATUS.md](./P0-PLATFORM-STATUS.md).

### 2.1 Tenant (`tenant_id`) — fase 1 no código

- Tabela `tenant` + `usuario.tenant_id` (Flyway `V8__`), claim JWT `tid`, `InternalUserContext.getTenantId()`, `TenantDataAccess`, isolamento em `UsuarioService` e validação no filtro de autenticação.
- **Fase 2:** `V8__`–`V12__` (usuario, OS, comercial, estoque, FCU/fabricante/product/associacao_fcu) + `TenantDataAccess` nos serviços principais.
- **`V13__`:** uniques compostos por tenant (email, números de proposta, códigos de estoque, etc.).
- **`V14__`–`V15__`:** `tenant_id` em `ticket`, `usuario_externo`, `sistema_empresa_config` (+ uniques ticket/externo); config empresa **por tenant** (`SistemaEmpresaConfigService` + `uk_sistema_empresa_config_tenant`).
- **Fase 2b:** `TenantDataAccess`, ficheiros OS, notificações déficit, admin externo.
- **Hibernate DISCRIMINATOR (activo):** `quarkus.hibernate-orm.multitenant=DISCRIMINATOR` + `RequestTenantResolver` (JWT/`InternalUserContext` → tenant `String`). Entidades de negócio: `@TenantId` em campo **`String tenantId`** (coluna `tenant_id` BIGINT); `TenantConstants.tenantIdOf(long)` na criação. **`Usuario` / `UsuarioExterno`:** sem `@TenantId` — campo **`orgTenantId`** (evita colisão com parâmetro interno Hibernate). HQL/SQL nativo: **nunca** `:tenantId`; usar `:filterTid` quando precisar de filtro explícito.
- **Validação local (2026-05):** API Docker contra MySQL do host — login `admin@aerosuite.com` / `admin123` → JWT com **`tid":1`**, `UserDto.tenantId=1`.
- **Login multi-tenant:** campo/dropdown `tenantCodigo` no login; `GET /api/auth/login-tenants?email=`; `NativeQueryTenant` para SQL nativo; `Usuario`/`UsuarioExterno` com `orgTenantId` em todas as queries de serviço.

---

## 3. Paralelo comercial — Bling / ERP

1. Ler e fechar decisões em [COMERCIALIZACAO-BLING-ESCOPO.md](./COMERCIALIZACAO-BLING-ESCOPO.md) (MVP, autenticação, escopo fiscal vs CRM).
2. Só depois: cliente HTTP dedicado, filas ou sync batch conforme matriz escolhida.

---

## 4. Paralelo comercial — ROI + landing

1. Variáveis e narrativa: [CALCULADORA-ROI-MODELO.md](./CALCULADORA-ROI-MODELO.md).
2. Entregáveis mínimos sugeridos no doc: planilha + **uma** landing estática com case fictício + CTA “agendar demo”; pode ficar fora do monólito Angular na primeira onda.

---

## Referências rápidas

- Staging / env: [OPERACAO-STAGING.md](./OPERACAO-STAGING.md)
- Matriz técnica completa: [IMPLEMENTACAO-PLANO-SAAS.md](./IMPLEMENTACAO-PLANO-SAAS.md)
