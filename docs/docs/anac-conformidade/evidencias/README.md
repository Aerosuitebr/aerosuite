# Pasta de evidências — dossiê ANAC

Armazene aqui artefatos **gerados na validação** e amostras para submissão.

## Arquivos gerados automaticamente

| Arquivo | Origem |
|---------|--------|
| `ultima-execucao.json` | `scripts/test/anac-conformidade-evidencias.ps1` |
| `ata-contingencia-*.json` | `scripts/test/anac-contingencia-simulacao.ps1` |
| `ata-backup-restore-*.json` | `scripts/test/anac-backup-restore-evidencia.ps1` |

## Arquivos a produzir manualmente

| Arquivo | Quando |
|---------|--------|
| `escopo-assinado.pdf` | Após preencher [02-declaracao-escopo](../02-declaracao-escopo-regulatorio.md) |
| `relatorio-validacao-YYYYMMDD.pdf` | Após [plano de validação](../06-plano-validacao.md) |
| `pacote-auditoria.zip` | Export UI `/dossie-auditoria` |
| `os-amostra-dossie.pdf` | Export uma OS demo |
| `crs-amostra.pdf` | CRS da OS demo |
| `ata-restore-backup-YYYYMMDD.pdf` | Teste restauração |
| `ata-contingencia-YYYYMMDD.pdf` | Simulação indisponibilidade |
| `aceite-migracao-assinado.pdf` | Go-live |
| `treinamento-YYYYMMDD.pdf` | Lista presença |

## Git

Arquivos grandes (ZIP, PDF) podem ser ignorados no `.gitignore` local se contiverem dados reais. Manter `ultima-execucao.json` e README versionados.

## Privacidade

Não commitar dados de clientes reais. Usar tenant demo sanitizado (`db/scripts/sanitize-demo-tenant-homologacao.sql`).
