-- ============================================
-- Script para adicionar campos de Motor na tabela OS
-- Campos: marcas_matricula, motor, sn_motor
-- Compatível com MySQL
-- ============================================

-- Verificar e adicionar coluna marcas_matricula
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'os' 
    AND COLUMN_NAME = 'marcas_matricula'
);
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE os ADD COLUMN marcas_matricula VARCHAR(50) NULL', 
    'SELECT "Coluna marcas_matricula já existe"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar coluna motor
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'os' 
    AND COLUMN_NAME = 'motor'
);
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE os ADD COLUMN motor VARCHAR(30) NULL', 
    'SELECT "Coluna motor já existe"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar e adicionar coluna sn_motor
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'os' 
    AND COLUMN_NAME = 'sn_motor'
);
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE os ADD COLUMN sn_motor VARCHAR(30) NULL', 
    'SELECT "Coluna sn_motor já existe"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar se as colunas foram adicionadas
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'os' 
AND COLUMN_NAME IN ('marcas_matricula', 'motor', 'sn_motor');
