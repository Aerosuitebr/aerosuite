-- Moeda da proposta e totais por moeda (USD / BRL / EUR)
-- MySQL / MariaDB
--
-- Preferir Flyway: backend/src/main/resources/db/migration/V64__proposta_comercial_moeda.sql
-- Use este script só para correção manual pontual (Workbench) se Flyway não estiver disponível.
SET @db = DATABASE();

SET @has_moeda := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'moeda_proposta'
);
SET @sql_moeda := IF(@has_moeda = 0,
  'ALTER TABLE proposta_comercial ADD COLUMN moeda_proposta VARCHAR(3) DEFAULT ''USD'' COMMENT ''Moeda de exibição/negociação: USD, BRL ou EUR''',
  'SELECT ''moeda_proposta already exists'' AS info');
PREPARE stmt FROM @sql_moeda; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_total_brl := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'total_geral_brl'
);
SET @sql_total_brl := IF(@has_total_brl = 0,
  'ALTER TABLE proposta_comercial ADD COLUMN total_geral_brl DECIMAL(15,2) DEFAULT NULL COMMENT ''Total geral na moeda BRL quando moeda_proposta=BRL''',
  'SELECT ''total_geral_brl already exists'' AS info');
PREPARE stmt FROM @sql_total_brl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_total_eur := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'proposta_comercial' AND COLUMN_NAME = 'total_geral_eur'
);
SET @sql_total_eur := IF(@has_total_eur = 0,
  'ALTER TABLE proposta_comercial ADD COLUMN total_geral_eur DECIMAL(15,2) DEFAULT NULL COMMENT ''Total geral na moeda EUR quando moeda_proposta=EUR''',
  'SELECT ''total_geral_eur already exists'' AS info');
PREPARE stmt FROM @sql_total_eur; EXECUTE stmt; DEALLOCATE PREPARE stmt;
