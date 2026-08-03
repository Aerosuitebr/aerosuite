-- Script seguro para adicionar coluna ultimo_acesso na tabela usuario (MySQL)
-- Este script verifica se a coluna existe antes de tentar adicionar

-- Verificar se a coluna já existe
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'usuario' 
      AND COLUMN_NAME = 'ultimo_acesso'
);

-- Adicionar coluna apenas se não existir
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `usuario` ADD COLUMN `ultimo_acesso` DATETIME NULL DEFAULT NULL AFTER `data_cadastro`',
    'SELECT "Coluna ultimo_acesso já existe" AS mensagem'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar último acesso para usuários existentes com a data de criação ou data atual
UPDATE `usuario` 
SET `ultimo_acesso` = COALESCE(`created_at`, NOW()) 
WHERE `ultimo_acesso` IS NULL;

