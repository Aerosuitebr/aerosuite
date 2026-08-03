-- P4.1: vínculo proposta comercial → ordem de serviço (1:1 por proposta no MVP).
-- os_id é INT para alinhar com os.id (schema legado). Idempotente para BD já parcialmente migrado.

SET @col := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'os_id'
);
SET @sql := IF(@col = 0,
    'ALTER TABLE proposta_comercial ADD COLUMN os_id INT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_type := (
    SELECT DATA_TYPE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'os_id'
    LIMIT 1
);
SET @sql := IF(@col_type = 'bigint',
    'ALTER TABLE proposta_comercial MODIFY COLUMN os_id INT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'os_gerada_em'
);
SET @sql := IF(@col = 0,
    'ALTER TABLE proposta_comercial ADD COLUMN os_gerada_em DATETIME NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'os_gerada_por'
);
SET @sql := IF(@col = 0,
    'ALTER TABLE proposta_comercial ADD COLUMN os_gerada_por VARCHAR(100) NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial'
      AND CONSTRAINT_NAME = 'fk_proposta_comercial_os'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE proposta_comercial ADD CONSTRAINT fk_proposta_comercial_os FOREIGN KEY (os_id) REFERENCES os (id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial'
      AND INDEX_NAME = 'idx_proposta_comercial_os_id'
);
SET @sql := IF(@idx = 0,
    'CREATE INDEX idx_proposta_comercial_os_id ON proposta_comercial (os_id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
