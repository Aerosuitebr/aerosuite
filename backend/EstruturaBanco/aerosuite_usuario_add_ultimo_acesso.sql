-- Script para adicionar coluna ultimo_acesso na tabela usuario
-- Execute este script no banco de dados para adicionar o campo de último acesso
-- MySQL não suporta IF NOT EXISTS em ADD COLUMN, então verifique manualmente se a coluna já existe

-- Verificar se a coluna já existe antes de adicionar (execute esta query primeiro para verificar)
-- SELECT COLUMN_NAME 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() 
--   AND TABLE_NAME = 'usuario' 
--   AND COLUMN_NAME = 'ultimo_acesso';

-- Se a coluna não existir, execute o comando abaixo:
ALTER TABLE `usuario` 
ADD COLUMN `ultimo_acesso` DATETIME NULL DEFAULT NULL AFTER `data_cadastro`;

-- Atualizar último acesso para usuários existentes com a data de criação ou data atual
UPDATE `usuario` 
SET `ultimo_acesso` = COALESCE(`created_at`, NOW()) 
WHERE `ultimo_acesso` IS NULL;

