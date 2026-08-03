-- ==============================================================================
-- Script: alter_ata_manual_os.sql
-- Descrição: Altera o tipo da coluna ata_manual na tabela os de INT para VARCHAR(50)
--            e popula com os valores da tabela fcu baseado no id_fcu
-- Banco: MySQL
-- Data: 2026-01-06
-- ==============================================================================

-- 1. Verificar dados atuais antes da migração (opcional - para auditoria)
SELECT 
    os.id AS os_id,
    os.id_os,
    os.ata_manual AS ata_manual_atual_os,
    os.id_fcu,
    fcu.id AS fcu_id,
    fcu.ata_manual AS ata_manual_fcu
FROM os
LEFT JOIN fcu ON os.id_fcu = fcu.id
WHERE os.id_fcu IS NOT NULL
ORDER BY os.id;

-- 2. Criar coluna temporária para backup dos valores atuais (caso precise reverter)
ALTER TABLE os ADD COLUMN ata_manual_backup INT NULL;
UPDATE os SET ata_manual_backup = ata_manual WHERE ata_manual IS NOT NULL;

-- 3. Alterar o tipo da coluna ata_manual de INT para VARCHAR(50)
-- MySQL converte automaticamente os valores durante a alteração
ALTER TABLE os MODIFY COLUMN ata_manual VARCHAR(50) NULL;

-- 4. Limpar valores 0 ou vazios (converter para NULL)
UPDATE os SET ata_manual = NULL WHERE ata_manual = '0' OR ata_manual = '';

-- 5. Atualizar ata_manual na tabela os com os valores da tabela fcu baseado no id_fcu
UPDATE os 
INNER JOIN fcu ON os.id_fcu = fcu.id 
SET os.ata_manual = fcu.ata_manual
WHERE fcu.ata_manual IS NOT NULL 
  AND fcu.ata_manual != '';

-- 6. Verificar resultado da migração
SELECT 
    os.id AS os_id,
    os.id_os,
    os.ata_manual AS ata_manual_novo,
    os.ata_manual_backup AS ata_manual_antigo,
    os.id_fcu,
    fcu.ata_manual AS ata_manual_fcu
FROM os
LEFT JOIN fcu ON os.id_fcu = fcu.id
ORDER BY os.id
LIMIT 50;

-- 7. (OPCIONAL) Após validar a migração, remover a coluna de backup
-- ATENÇÃO: Execute apenas após confirmar que a migração foi bem-sucedida
-- ALTER TABLE os DROP COLUMN ata_manual_backup;

-- ==============================================================================
-- FIM DO SCRIPT
-- ==============================================================================
