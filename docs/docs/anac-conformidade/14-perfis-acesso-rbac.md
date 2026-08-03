# 14. Matriz de perfis e acesso (RBAC Part 145)

Flyway `V29__part145_perfis.sql`. Funcionalidades controladas por `@RequiresFuncionalidades` e menu por tenant.

## 14.1 Perfis regulados

| Código | Papel | CRS emitir | OS editar | Dossiê | Hangar | Estoque | SGQ |
|--------|-------|------------|-----------|--------|--------|---------|-----|
| `P145_RT` | Responsável técnico | ✅ | ✅ | ✅ | ✅ | Leitura | ✅ |
| `P145_INSPETOR` | Inspetor / qualidade | ✅ | Leitura* | ✅ | Inspeção | Leitura | ✅ |
| `P145_EXECUCAO` | Mecânico | ❌ | ✅ | ❌ | ✅ | Consumo | Alertas |
| `P145_ALMOX` | Almoxarifado | ❌ | ❌ | ❌ | ❌ | ✅ | — |
| `P145_COMERCIAL` | Comercial | ❌ | ❌ | ❌ | ❌ | — | — |
| `ADMIN` | Administrador | ✅** | ✅ | ✅ | ✅ | ✅ | ✅ |
| `QUALIDADE` | Qualidade (legado) | ✅** | ✅ | ✅ | ✅ | Leitura | ✅ |

\* Conforme permissões `ORDEM_SERVICO` atribuídas.  
\** Bypass segregação e habilitação — uso apenas administrativo excepcional.

## 14.2 Funcionalidades críticas (códigos)

| Código | Descrição | Perfis típicos |
|--------|-----------|----------------|
| `ORDEM_SERVICO` | CRUD OS | RT, execução, admin |
| `CRS_EMITIR` | Emissão CRS | RT, inspetor (oculto menu) |
| `DOSSIE_AUDITORIA` | Export dossiê | RT, inspetor, qualidade |
| `HANGAR_JOB_CARD` | Job card mobile | Execução, RT |
| `HABILITACAO_TECNICA` | Cadastro habilitações | RT, qualidade |
| `AD_SB_ALERTAS` | Diretrizes | RT, qualidade |
| `SGQ_DOCUMENTO_CONTROLADO` | Documentos MOE | Qualidade |
| `CONFORMIDADE_PAINEL` | Painel qualidade | Qualidade, RT |
| `GO_LIVE_MIGRACAO` | Kit migração | Admin |

Lista tenant: [TENANT-FEATURES.md](../TENANT-FEATURES.md).

## 14.3 Segregação CRS (regra de negócio)

Implementação: `Part145CrsSegregation.java`

- Usuário com registro em `os_auditoria` como CRIACAO/ALTERACAO/UPLOAD na mesma OS **não emite CRS**.
- Exceção: perfis `P145_RT`, `P145_INSPETOR`, `ADMIN`, `QUALIDADE`, etc. (`BYPASS_PERFIL_CODIGO`).
- `userId` nulo → bloqueio.

**Testes:** `Part145CrsSegregationTest`, `Part145CrsSegregationEmitTest`.

## 14.4 Habilitação técnica (CRS)

- Emissão exige habilitação **RT ou inspetor** válida (`UsuarioHabilitacaoService.assertHabilitacaoValidaParaCrs`).
- Override: `BYPASS_HABILITACAO_CRS` (admin/gerente/qualidade).

## 14.5 Enforcement configurável

Painel `/conformidade/painel` — flags:

- `bloquearCalibracaoVencida`
- `bloquearTreinoObrigatorio`
- `bloquearSubcontratacaoVencida`

API: `GET/PUT /api/conformidade/enforcement`.

## 14.6 Testes de autorização

```powershell
.\scripts\test\api-rbac-smoke.ps1
```

Backend: `ConformidadeApiAuthIT` (401/403 sem JWT).

## 14.7 Política de senhas

| Regra | Estado |
|-------|--------|
| Mínimo 8 caracteres | ✅ |
| Histórico últimas 5 senhas | ✅ |
| Primeiro login troca senha | ✅ |
| MFA | ⏳ Planejado REQ-023 |

Configuração UI: `/configuracoes` → segurança.
