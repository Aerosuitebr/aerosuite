# 4. Descrição do sistema

## 4.1 Objetivo

Centralizar a operação de manutenção aeronáutica (Part 145) com rastreabilidade, evidências para auditoria e controles de qualidade operacional, em modelo SaaS multi-tenant.

## 4.2 Stack tecnológica

| Camada | Tecnologia |
|--------|------------|
| Backend | Quarkus 3, Java 21, Hibernate ORM Panache |
| Frontend | Angular 18, PWA (hangar offline) |
| Banco | MySQL 8 (Flyway migrations) |
| Autenticação | JWT, RBAC por funcionalidades |
| PDF | Geração server-side (dossiê, CRS, rastreio) |
| Infra | Docker Compose, nginx, Cloudflare Tunnel (produção) |

## 4.3 Módulos e rotas principais

| Módulo | Rota UI | Função regulatória |
|--------|---------|-------------------|
| Ordens de serviço | `/os` | Registro de manutenção, ciclo de vida OS |
| Auditoria OS | `/os-auditoria` | Trilha de alterações |
| Dossiê auditoria | `/dossie-auditoria` | Export PDF/ZIP para fiscalização |
| Hangar / Job card | `/hangar` | Execução, apontamentos, assinaturas, offline |
| CRS | Dialog na OS | Liberação para serviço |
| Estoque | `/estoque/*` | Peças, certificados, quarentena, rastreio |
| AD/SB | `/aero/diretrizes` | Diretrizes aeronáuticas e alertas |
| Conformidade SGQ | `/conformidade/*` | Docs, treinos, calibração, NC, painel |
| Habilitações | `/conformidade/habilitacoes` | RT, inspetor, mecânico |
| Go-live | `/go-live-migracao` | Migração e checklist 30 dias |
| Portal externo | `/externo/*` | Cliente — visualização controlada |

## 4.4 Usuários típicos

| Perfil | Código | Uso |
|--------|--------|-----|
| Responsável técnico | `P145_RT` | CRS, dossiê, visão operacional |
| Inspetor / qualidade | `P145_INSPETOR` | Inspeção, CRS, auditoria |
| Mecânico / execução | `P145_EXECUCAO` | Job card, OS (sem CRS) |
| Almoxarifado | `P145_ALMOX` | Estoque, certificados |
| Administrador | `ADMIN` | Configuração, RBAC |
| Usuário externo | Portal | Consulta OS/documentos concedidos |

## 4.5 APIs de conformidade (referência)

```
GET  /api/dossie-auditoria/numero/{n}/pdf
GET  /api/dossie-auditoria/pacote/zip
GET  /api/conformidade/retencao/export/zip
GET  /api/os/{id}/crs/pdf
POST /api/os/{id}/crs/emitir
GET  /api/os-auditoria/os/{id}
GET  /api/conformidade/painel
GET  /api/conformidade/relatorios/sgq.zip
GET  /api/conformidade/enforcement
PUT  /api/conformidade/enforcement
```

Lista completa: [ROADMAP-CONFORMIDADE-REGULATORIA.md](../ROADMAP-CONFORMIDADE-REGULATORIA.md).

## 4.6 Limitações declaradas

1. Não substitui MOM/MCQ físico certificado.
2. Assinatura job card: vínculo usuário + imagem PNG, não ICP-Brasil nativo.
3. Edição de OS fechada: auditada; bloqueio hard em desenvolvimento (REQ-009).
4. MFA: configuração UI; implementação backend planejada (REQ-023).
5. Integração fiscal (NF-e) via Bling — escopo comercial, não regulatório de manutenção.

## 4.7 Multi-tenancy e isolamento

Cada organização (`tenant`) possui dados isolados por `tenant_id`. Teste: `scripts/test/api-tenant-isolation.ps1`.
