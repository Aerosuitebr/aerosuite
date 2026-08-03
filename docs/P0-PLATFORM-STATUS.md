# P0 Plataforma — estado consolidado (2026-06)

Referência rápida para itens de infraestrutura e segurança do [IMPLEMENTACAO-PLANO-SAAS.md](./IMPLEMENTACAO-PLANO-SAAS.md).

## RBAC (`@RolesAllowed` vs `@RequiresFuncionalidades`)

| Decisão | Detalhe |
|---------|---------|
| **Modelo em produção** | `JwtAuthenticationFilter` + `PermissionAuthorizationFilter` + `@RequiresFuncionalidades` |
| **`@RolesAllowed`** | **Não adoptado** — opcional a longo prazo; exigiria `quarkus-security` + bridge JWT → `SecurityIdentity` sem ganho imediato face ao modelo de códigos `funcionalidade` |
| **Evidência** | `.\scripts\test\api-rbac-smoke.ps1`; [P0-P1-EXECUCAO.md](./P0-P1-EXECUCAO.md) §2 |

## Auditoria de acesso (`acesso_auditoria`)

| Evento | Origem |
|--------|--------|
| `LOGIN_SUCCESS` / `LOGIN_FAILURE` | `AuthService`, `AuthResource`, `AuthExternoResource` |
| `RBAC_DENIED` | `PermissionAuthorizationFilter` (403 com utilizador autenticado) |
| `AUTH_UNAUTHORIZED` | `JwtAuthenticationFilter` (401: Bearer ausente/inválido) e filtro RBAC quando endpoint exige auth |

Flag: `aero.suite.audit.enabled` / `AERO_SUITE_AUDIT_ENABLED`.

## JWT

| Tipo | Estado |
|------|--------|
| **Interno HS256** | Padrão — login emite via `JwtTokenService.mintInternalToken` |
| **Interno Base64 legado** | **Desligado** por omissão (`aero.suite.auth.allow-legacy-internal-base64=false`). Rollback temporário: `AERO_SUITE_ALLOW_LEGACY_INTERNAL_BASE64=true` |
| **Externo `EXT:`** | Mantido para portal cliente — independente da flag acima |

## Flyway

| Item | Estado |
|------|--------|
| Migrações | `V2`…`V63` em `backend/src/main/resources/db/migration/` |
| Validação automática | `.\scripts\test\verify-flyway.ps1` descobre **todas** as versões ≥ V8 |
| Suite CI/local | Incluído em `verify-covered-suite.ps1`, `final-suite.ps1`, `sprint1-homologacao.ps1` |
| Playbook operacional | [P0-P1-EXECUCAO.md](./P0-P1-EXECUCAO.md) §1, [OPERACAO-STAGING.md](./OPERACAO-STAGING.md) |

## Qualidade frontend (ligado a P0)

| Item | Estado |
|------|--------|
| Testes unitários | `npm run test:unit` (Vitest) — utilitários P0/P1 |
| WCAG | axe 33 rotas CI; modo escuro em configurações e editor comercial; listas estoque/comercial via `_legacy-list-premium.global.scss` |
| Meta P2 | Playwright E2E + cobertura UI ampliada — [P2-ENTERPRISE-EXECUCAO.md](./P2-ENTERPRISE-EXECUCAO.md) |
