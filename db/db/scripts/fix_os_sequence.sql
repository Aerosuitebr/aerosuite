-- ==============================================================================
-- Script: fix_os_sequence.sql
-- Descrição: Corrige o AUTO_INCREMENT da tabela OS para continuar após o maior ID existente
-- Banco: MySQL
-- Data: 2026-01-07
-- ==============================================================================

-- 1. Verificar o maior ID atual na tabela OS
SELECT MAX(id) AS max_id FROM os;

-- 2. Verificar o valor atual do AUTO_INCREMENT
SELECT AUTO_INCREMENT 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'aerosuite' 
AND TABLE_NAME = 'os';



-- 3. Obter o próximo valor (MAX + 1)
SET @max_id = (SELECT COALESCE(MAX(id), 0) + 1 FROM os);
SELECT @max_id AS proximo_id;

-- 4. Resetar o AUTO_INCREMENT para o próximo valor após o maior ID existente
-- ATENÇÃO: Substitua 2156 pelo valor retornado acima (proximo_id)
-- ALTER TABLE os AUTO_INCREMENT = 2156;

-- Ou use este comando dinâmico (execute separadamente):
SET @sql = CONCAT('ALTER TABLE os AUTO_INCREMENT = ', @max_id);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Verificar se a correção foi aplicada
SELECT 
    (SELECT MAX(id) FROM os) AS max_id_tabela,
    (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'aerosuite' AND TABLE_NAME = 'os') AS auto_increment_atual;

-- ==============================================================================
-- FIM DO SCRIPT
-- ==============================================================================
