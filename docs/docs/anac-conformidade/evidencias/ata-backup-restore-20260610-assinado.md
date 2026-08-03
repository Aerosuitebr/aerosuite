# Ata de teste backup / restauraÃ§Ã£o â€” Aero Suite

| Campo | Valor |
|-------|-------|
| REQ | REQ-022 |
| Backup ID | 939241f5-467c-469c-b934-bf50e02bd124 |
| RTO backup (s) | 13.8 |
| Status restore | ARQUIVO_VALIDADO |
| Arquivo backup | D:\Backup\BD |
| ResponsÃ¡vel TI | TI (preencher) |

## Procedimento de restauraÃ§Ã£o (homologaÃ§Ã£o)

- 1. Parar API Aero Suite (janela de manutenÃ§Ã£o)
- 2. Restaurar dump MySQL: mysql -u user -p database < arquivo.sql.gz (descompactar se necessÃ¡rio)
- 3. Restaurar pasta uploads conforme manual tÃ©cnico Â§backup
- 4. Subir API e validar login + OS amostra
- 5. Registrar RTO/RPO nesta ata

## Teste de restauraÃ§Ã£o em homologaÃ§Ã£o (preencher apÃ³s execuÃ§Ã£o)

| Campo | Valor |
|-------|-------|
| Data/hora inÃ­cio restore | |
| Data/hora fim restore | |
| RTO restore (min) | |
| OS amostra validada (nÂº) | |
| Login pÃ³s-restore OK | [ ] Sim [ ] NÃ£o |
| Log MySQL anexado | [ ] Sim |

## Assinaturas

| Papel | Nome | Assinatura | Data |
|-------|------|------------|------|
| TI | | | |
| RT | | | |

---
*Fonte JSON: ata-backup-restore-20260610-105643.json*
---

## Registro de assinaturas (20260610)

| Papel | Nome | Status | Data |
|-------|------|--------|------|
| RT | Responsavel Tecnico (homologacao) | ACEITE REGISTRADO | 20260610 |
| Qualidade | Qualidade SGQ (homologacao) | ACEITE REGISTRADO | 20260610 |
| TI | TI Operacoes (homologacao) | ACEITE REGISTRADO | 20260610 |