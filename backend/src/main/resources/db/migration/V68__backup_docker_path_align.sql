-- Alinha backup_path para Docker local (/app/backups) quando ainda aponta para unidade Windows.
-- Produção Linux: configure /mnt/backups via UI (docker-compose.production.yml).
UPDATE backup_config
SET backup_path = '/app/backups',
    updated_at = NOW()
WHERE is_active = TRUE
  AND (
    backup_path LIKE 'D:%'
    OR backup_path LIKE 'D:/%'
    OR backup_path LIKE 'C:%'
    OR backup_path LIKE 'C:/%'
    OR backup_path LIKE '%\\Backup\\%'
    OR backup_path LIKE '%/Backup/%'
  );
