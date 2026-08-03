# Sprint 1 — Isolamento multi-tenant (checklist)

## Pré-requisitos

1. Flyway **V8–V16** aplicado na cópia da BD (staging ou dump local).
2. API com `quarkus.hibernate-orm.multitenant=DISCRIMINATOR`.
3. Utilizador no tenant **default** (`tid=1`) com `GERENCIAR_PERMISSOES`.

## Centro de Organizações (UI)

1. Login `admin@aerosuite.com` com tenant **default** (`tid=1`).
2. Menu **Controle de Acesso → Organizações** (`/organizacoes`) — requer `GERENCIAR_PERMISSOES` e tenant plataforma.
3. **Provisionar organização**: wizard em 4 passos (identidade, branding, admin opcional, revisão); opção **enviar e-mail de boas-vindas**.
4. **Editar** nome, display, e-mail de suporte, ativo/inativo (tenant `default` não pode ser suspenso).
5. **Painel** (sidebar): utilizadores, OS e propostas vs. totais da plataforma.
6. **Reenviar boas-vindas**: diálogo com opção de gerar nova senha temporária.

## Provisão do 2.º tenant

**API (recomendado):**

```http
POST /api/tenants
Authorization: Bearer <JWT tid=1>
Content-Type: application/json

{
  "codigo": "demo",
  "nome": "Organização Demo",
  "adminEmail": "admin@demo.local",
  "adminNome": "Admin Demo",
  "displayName": "Demo MRO",
  "supportEmail": "suporte@demo.local",
  "sendWelcomeEmail": true
}
```

**Gestão adicional:**

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/tenants` | Lista com KPIs e stats por organização |
| GET | `/api/tenants/{id}` | Detalhe + stats vs. plataforma |
| PUT | `/api/tenants/{id}` | Atualizar / suspender / reativar |
| POST | `/api/tenants/{id}/welcome-email` | Reenviar boas-vindas (`resetAdminPassword` opcional) |
| GET | `/api/tenants/check-codigo?codigo=` | Disponibilidade do código |

**SQL manual:** `db/scripts/provision_tenant_demo.sql`

## Testes de isolamento

| # | Cenário | Esperado |
|---|---------|----------|
| 1 | Login `admin@aerosuite.com` + tenant `default` | JWT `tid: 1`; listagens só dados tenant 1 |
| 2 | Login utilizador tenant `demo` | JWT `tid: 2` (ou id criado); sem OS/utilizadores do tenant 1 |
| 3 | `GET /api/os` com JWT tenant 2 | Não devolve OS do tenant 1 |
| 4 | `GET /api/os/{id}` com id de OS do outro tenant | 404 |
| 5 | E-mail em dois tenants: login sem código | `TENANT_REQUIRED` |
| 6 | Forgot-password mesmo e-mail em 2 tenants | `TENANT_REQUIRED` até escolher organização |
| 7 | SQL nativo estoque/rastreio/kit | Sem linhas de outro `tenant_id` |
| 8 | `POST /api/tenants` com JWT `tid≠1` | 403 |

## Homologação rápida

```powershell
# Validar env
.\scripts\validate-env.ps1

# API (MySQL host ou docker-compose.local-mysql.yml)
docker compose -f docker-compose.yml -f docker-compose.local-mysql.yml up -d api

# Cenarios 5-6 (mesmo e-mail em default + demo)
.\scripts\test\provision-multi-tenant-login-test.ps1
.\scripts\test\api-tenant-isolation.ps1 -ProvisionDemoIfMissing
```

Verificar logs Flyway até **V16** e smoke login + criação tenant demo.
