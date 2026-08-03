-- Uniques compostos: ticket.numero, usuario_externo.email

SET @idx := (
    SELECT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = 'ticket'
      AND s.NON_UNIQUE = 0 AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
    HAVING GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.SEQ_IN_INDEX) = 'numero'
    LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE ticket DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'ticket'
      AND CONSTRAINT_NAME = 'uk_ticket_tenant_numero'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE ticket ADD CONSTRAINT uk_ticket_tenant_numero UNIQUE (tenant_id, numero)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
    SELECT s.INDEX_NAME
    FROM information_schema.STATISTICS s
    WHERE s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = 'usuario_externo'
      AND s.NON_UNIQUE = 0 AND s.INDEX_NAME <> 'PRIMARY'
    GROUP BY s.INDEX_NAME
    HAVING GROUP_CONCAT(s.COLUMN_NAME ORDER BY s.SEQ_IN_INDEX) = 'email'
    LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, CONCAT('ALTER TABLE usuario_externo DROP INDEX `', @idx, '`'), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario_externo'
      AND CONSTRAINT_NAME = 'uk_usuario_externo_tenant_email'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE usuario_externo ADD CONSTRAINT uk_usuario_externo_tenant_email UNIQUE (tenant_id, email)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
