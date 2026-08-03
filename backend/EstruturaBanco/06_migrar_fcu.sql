-- =====================================================
-- Script de Migração: FCU
-- =====================================================
-- Migra dados da tabela fcu do banco antigo para o novo
-- ATENÇÃO: Esta tabela depende de FABRICANTE
-- =====================================================

START TRANSACTION;

-- Verificar se já existem dados na tabela nova
SET @existem_dados = (SELECT COUNT(*) FROM `fcu`);

-- Migrar FCUs do banco antigo
-- IMPORTANTE: Ajuste os nomes das colunas conforme a estrutura real
INSERT INTO `fcu` (
    `id`,
    `fcu_codigo`,
    `fcu_description`,
    `id_product`,
    `id_fabricante`,
    `modelo`,
    `pn`,
    `serial_number`,
    `ata_manual`,
    `data_rev_manual`,
    `num_revisao`
)
SELECT 
    f.`id`,
    COALESCE(f.`fcu_codigo`, '') as `fcu_codigo`,
    COALESCE(f.`fcu_description`, '') as `fcu_description`,
    COALESCE(f.`id_product`, 0) as `id_product`,
    f.`id_fabricante`,
    COALESCE(f.`modelo`, '') as `modelo`,
    COALESCE(f.`pn`, '') as `pn`,
    COALESCE(f.`serial_number`, '') as `serial_number`,
    COALESCE(f.`ata_manual`, '') as `ata_manual`,
    f.`data_rev_manual`,
    COALESCE(f.`num_revisao`, '') as `num_revisao`
FROM `aerosuite_backup_antigo`.`backup_fcu` f
WHERE NOT EXISTS (
    SELECT 1 FROM `fcu` fc WHERE fc.id = f.id
)
AND @existem_dados = 0
-- Validar que o fabricante existe
AND EXISTS (
    SELECT 1 FROM `fabricante` fab WHERE fab.id = f.id_fabricante
);

-- Se já existirem dados, fazer INSERT IGNORE:
-- INSERT IGNORE INTO `fcu` (`id`, `fcu_codigo`, `fcu_description`, `id_fabricante`, `modelo`, `pn`, `serial_number`, `ata_manual`, `data_rev_manual`, `num_revisao`)
-- SELECT `id`, `fcu_codigo`, `fcu_description`, `id_fabricante`, `modelo`, `pn`, `serial_number`, `ata_manual`, `data_rev_manual`, `num_revisao`
-- FROM `aerosuite_backup_antigo`.`backup_fcu`
-- WHERE EXISTS (SELECT 1 FROM `fabricante` fab WHERE fab.id = `aerosuite_backup_antigo`.`backup_fcu`.`id_fabricante`);

-- Verificar FCUs com fabricantes inválidos
SELECT 
    'FCUs com fabricantes inválidos' as status,
    COUNT(*) as total
FROM `aerosuite_backup_antigo`.`backup_fcu` f
WHERE NOT EXISTS (
    SELECT 1 FROM `fabricante` fab WHERE fab.id = f.id_fabricante
);

-- Verificar resultado da migração
SELECT 
    'FCUs migrados' as status,
    COUNT(*) as total,
    COUNT(DISTINCT id_fabricante) as fabricantes_distintos,
    MIN(id) as menor_id,
    MAX(id) as maior_id
FROM `fcu`;

-- Validar integridade
SELECT 
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_fcu` f 
                         WHERE EXISTS (SELECT 1 FROM `fabricante` fab WHERE fab.id = f.id_fabricante))
        THEN 'OK - Todos os FCUs válidos migrados'
        ELSE CONCAT('ATENÇÃO - Faltam ', 
            (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_fcu` f 
             WHERE EXISTS (SELECT 1 FROM `fabricante` fab WHERE fab.id = f.id_fabricante)) - COUNT(*), 
            ' FCUs')
    END as validacao
FROM `fcu`;

-- Se tudo estiver OK, descomente a linha abaixo para confirmar:
-- COMMIT;
-- Se houver problemas, execute:
-- ROLLBACK;

