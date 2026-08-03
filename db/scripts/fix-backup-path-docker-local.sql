/*
 * Backup Docker local — caminho /app/backups + host MySQL acessível do container.
 * Uso: mysql -u root -p aerosuite < db/scripts/fix-backup-path-docker-local.sql
 */
USE aerosuite;

UPDATE backup_config
SET backup_path = '/app/backups',
    db_host = 'host.docker.internal',
    updated_at = NOW()
WHERE is_active = TRUE;

SELECT id, db_host, backup_path, schedule_enabled, is_active
FROM backup_config
WHERE is_active = TRUE;
