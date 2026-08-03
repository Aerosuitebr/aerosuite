-- Moeda de negociação da proposta (USD / BRL / EUR) e totais snapshot por moeda.
-- Idempotente: ambientes que já rodaram db/scripts/alter_proposta_comercial_moeda.sql não falham.

SET @col := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'moeda_proposta'
);
SET @sql := IF(@col = 0,
    'ALTER TABLE proposta_comercial ADD COLUMN moeda_proposta VARCHAR(3) DEFAULT ''USD'' COMMENT ''Moeda de exibição/negociação: USD, BRL ou EUR''',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'total_geral_brl'
);
SET @sql := IF(@col = 0,
    'ALTER TABLE proposta_comercial ADD COLUMN total_geral_brl DECIMAL(15,2) DEFAULT NULL COMMENT ''Total geral em BRL quando moeda_proposta=BRL''',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'total_geral_eur'
);
SET @sql := IF(@col = 0,
    'ALTER TABLE proposta_comercial ADD COLUMN total_geral_eur DECIMAL(15,2) DEFAULT NULL COMMENT ''Total geral em EUR quando moeda_proposta=EUR''',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
