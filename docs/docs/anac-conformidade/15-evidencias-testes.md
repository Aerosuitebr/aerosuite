# 15. Índice de evidências e testes

## 15.1 Execução consolidada (recomendado)

```powershell
cd D:\Desenvolvimento\aerosuite
.\scripts\test\anac-conformidade-evidencias.ps1
```

**Saída:** `docs/anac-conformidade/evidencias/ultima-execucao.json`

## 15.2 Testes unitários / integração (Java)

| Teste | Requisito | Caminho |
|-------|-----------|---------|
| `Part145CrsSegregationTest` | REQ-002 | `backend/src/test/.../crs/` |
| `Part145CrsSegregationEmitTest` | REQ-002, REQ-005 | idem |
| `ConformidadeEnforcementTest` | REQ-018 | `backend/src/test/.../conformidade/` |
| `ConformidadeEnforcementP1IT` | REQ-017, 018, 020, 021 | `backend/src/test/.../integration/` |
| `ConformidadeApiAuthIT` | REQ-010 | idem |
| `ConformidadeOndaDFunctionalIT` | REQ-016, 019 | idem |
| `CertificadoPecaUtilTest` | REQ-014 | `backend/src/test/.../estoque/` |
| `DossieAuditoriaLabelsTest` | REQ-001 | `backend/src/test/.../dossie/` |

```powershell
cd backend
mvn test -Dtest=Part145CrsSegregationTest,Part145CrsSegregationEmitTest,ConformidadeEnforcementTest,ConformidadeEnforcementP1IT,ConformidadeApiAuthIT,ConformidadeOndaDFunctionalIT,CertificadoPecaUtilTest,DossieAuditoriaLabelsTest
```

## 15.3 Smokes PowerShell (API)

| Script | Requisito |
|--------|-----------|
| `api-conformidade-enforcement-smoke.ps1` | REQ-017, 018, 021 |
| `api-conformidade-onda-d-smoke.ps1` | REQ-016, 025 |
| `api-conformidade-relatorios-smoke.ps1` | REQ-025 |
| `api-hangar-offline-sync-smoke.ps1` | REQ-004 |
| `api-rbac-smoke.ps1` | REQ-010 |
| `api-tenant-isolation.ps1` | REQ-012 |
| `verify-flyway.ps1` | Infra schema |

## 15.4 E2E Playwright

| Spec | Requisito |
|------|-----------|
| `e2e/tests/conformidade-painel-hangar.spec.ts` | REQ-017, hangar |
| `e2e/tests/hangar-offline.spec.ts` | REQ-004 |
| `e2e/tests/auth-login.spec.ts` | REQ-011 |

```powershell
cd e2e
npx playwright test conformidade-painel-hangar.spec.ts hangar-offline.spec.ts
```

## 15.5 Evidências manuais (arquivar em `evidencias/`)

| Arquivo sugerido | Conteúdo |
|------------------|----------|
| `os-amostra-dossie.pdf` | Export dossiê OS demo |
| `pacote-auditoria.zip` | Pacote multi-OS |
| `crs-amostra.pdf` | CRS emitido |
| `ata-validacao-YYYYMMDD.pdf` | Relatório assinado |
| `ata-restore-backup-YYYYMMDD.pdf` | Teste restauração |
| `ata-contingencia-YYYYMMDD.pdf` | Simulação indisponibilidade |
| `escopo-assinado.pdf` | [02-declaracao-escopo](./02-declaracao-escopo-regulatorio.md) |
| `screenshot-auditoria-os.png` | UI trilha auditoria |

## 15.6 Mapeamento REQ → teste rápido

Ver colunas **Teste** e **Evidência** em [03-matriz-requisitos.csv](./03-matriz-requisitos.csv).
