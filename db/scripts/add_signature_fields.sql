-- Script para adicionar campos de assinatura na tabela proposta_comercial (MySQL)
-- Execute este script para habilitar a funcionalidade de assinatura digital

-- Adicionar campo assinatura_nome se não existir
SET @dbname = DATABASE();
SET @tablename = 'proposta_comercial';
SET @columnname = 'assinatura_nome';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Campo assinatura_nome já existe"',
  'ALTER TABLE proposta_comercial ADD COLUMN assinatura_nome VARCHAR(200)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Adicionar campo assinatura_estilo se não existir
SET @columnname = 'assinatura_estilo';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Campo assinatura_estilo já existe"',
  'ALTER TABLE proposta_comercial ADD COLUMN assinatura_estilo VARCHAR(50)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Adicionar campo assinatura_font_family se não existir
SET @columnname = 'assinatura_font_family';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Campo assinatura_font_family já existe"',
  'ALTER TABLE proposta_comercial ADD COLUMN assinatura_font_family VARCHAR(100)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Adicionar campo assinatura_color se não existir
SET @columnname = 'assinatura_color';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Campo assinatura_color já existe"',
  'ALTER TABLE proposta_comercial ADD COLUMN assinatura_color VARCHAR(30)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Adicionar campo assinatura_timestamp se não existir
SET @columnname = 'assinatura_timestamp';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
  'SELECT "Campo assinatura_timestamp já existe"',
  'ALTER TABLE proposta_comercial ADD COLUMN assinatura_timestamp DATETIME'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verificar os campos adicionados
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'proposta_comercial' 
AND COLUMN_NAME LIKE 'assinatura%'
ORDER BY ORDINAL_POSITION;

SELECT 'Script executado com sucesso!' AS resultado;
