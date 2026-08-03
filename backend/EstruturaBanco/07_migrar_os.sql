-- =====================================================
-- Script de Migração: ORDEM DE SERVIÇO (OS)
-- =====================================================
-- Migra dados da tabela os do banco antigo para o novo
-- ATENÇÃO: Esta tabela depende de FABRICANTE e FCU
-- =====================================================

START TRANSACTION;

-- Verificar se já existem dados na tabela nova
SET @existem_dados = (SELECT COUNT(*) FROM `os`);

-- Migrar OSs do banco antigo
-- IMPORTANTE: Ajuste os nomes das colunas conforme a estrutura real
INSERT INTO `os` (
    `id`,
    `id_os`,
    `dt_abertura`,
    `cliente_nome`,
    `id_fabricante`,
    `id_fcu`,
    `part_number`,
    `serial_number`,
    `tsn`,
    `tso`,
    `tipo_servico`,
    `manual_pn`,
    `num_revisao`,
    `data_rev_manual`,
    `ata_manual`,
    `titulo_ads`,
    `titulo_afins`,
    `boletins_serv_afins`,
    `ads_das`,
    `obs_ini_serv`,
    `obs_conclusao_serv`,
    `obs_fim_serv`,
    `data_conclusao_serv`,
    `data_fechamento`,
    `num_os_original`
)
SELECT 
    o.`id`,
    COALESCE(o.`id_os`, o.`id`) as `id_os`,
    COALESCE(o.`dt_abertura`, CURDATE()) as `dt_abertura`,
    COALESCE(o.`cliente_nome`, '') as `cliente_nome`,
    o.`id_fabricante`,
    o.`id_fcu`,
    COALESCE(o.`part_number`, '') as `part_number`,
    COALESCE(o.`serial_number`, '') as `serial_number`,
    COALESCE(o.`tsn`, '') as `tsn`,
    COALESCE(o.`tso`, '') as `tso`,
    COALESCE(o.`tipo_servico`, '') as `tipo_servico`,
    COALESCE(o.`manual_pn`, '') as `manual_pn`,
    COALESCE(o.`num_revisao`, '') as `num_revisao`,
    o.`data_rev_manual`,
    COALESCE(o.`ata_manual`, 0) as `ata_manual`,
    COALESCE(o.`titulo_ads`, '') as `titulo_ads`,
    COALESCE(o.`titulo_afins`, '') as `titulo_afins`,
    COALESCE(o.`boletins_serv_afins`, '') as `boletins_serv_afins`,
    COALESCE(o.`ads_das`, '') as `ads_das`,
    COALESCE(o.`obs_ini_serv`, '') as `obs_ini_serv`,
    COALESCE(o.`obs_conclusao_serv`, '') as `obs_conclusao_serv`,
    COALESCE(o.`obs_fim_serv`, '') as `obs_fim_serv`,
    o.`data_conclusao_serv`,
    o.`data_fechamento`,
    COALESCE(o.`num_os_original`, '') as `num_os_original`
FROM `aerosuite_backup_antigo`.`backup_os` o
WHERE NOT EXISTS (
    SELECT 1 FROM `os` os WHERE os.id = o.id
)
AND @existem_dados = 0
-- Validar que o fabricante existe (se informado)
AND (o.`id_fabricante` IS NULL OR EXISTS (
    SELECT 1 FROM `fabricante` fab WHERE fab.id = o.id_fabricante
))
-- Validar que o FCU existe (se informado)
AND (o.`id_fcu` IS NULL OR EXISTS (
    SELECT 1 FROM `fcu` fc WHERE fc.id = o.id_fcu
));

-- Se já existirem dados, fazer INSERT IGNORE:
-- INSERT IGNORE INTO `os` (`id`, `id_os`, `dt_abertura`, `cliente_nome`, `id_fabricante`, `id_fcu`, ...)
-- SELECT `id`, `id_os`, `dt_abertura`, `cliente_nome`, `id_fabricante`, `id_fcu`, ...
-- FROM `aerosuite_backup_antigo`.`backup_os`
-- WHERE (id_fabricante IS NULL OR EXISTS (SELECT 1 FROM fabricante WHERE id = id_fabricante))
--   AND (id_fcu IS NULL OR EXISTS (SELECT 1 FROM fcu WHERE id = id_fcu));

-- Verificar OSs com referências inválidas
SELECT 
    'OSs com fabricantes inválidos' as status,
    COUNT(*) as total
FROM `aerosuite_backup_antigo`.`backup_os` o
WHERE o.`id_fabricante` IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM `fabricante` fab WHERE fab.id = o.id_fabricante
);

SELECT 
    'OSs com FCUs inválidos' as status,
    COUNT(*) as total
FROM `aerosuite_backup_antigo`.`backup_os` o
WHERE o.`id_fcu` IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM `fcu` fc WHERE fc.id = o.id_fcu
);

-- Verificar resultado da migração
SELECT 
    'OSs migradas' as status,
    COUNT(*) as total,
    COUNT(DISTINCT cliente_nome) as clientes_distintos,
    COUNT(DISTINCT id_fabricante) as fabricantes_distintos,
    MIN(id) as menor_id,
    MAX(id) as maior_id
FROM `os`;

-- Validar integridade
SELECT 
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_os` o
                         WHERE (o.id_fabricante IS NULL OR EXISTS (SELECT 1 FROM fabricante WHERE id = o.id_fabricante))
                           AND (o.id_fcu IS NULL OR EXISTS (SELECT 1 FROM fcu WHERE id = o.id_fcu)))
        THEN 'OK - Todas as OSs válidas migradas'
        ELSE CONCAT('ATENÇÃO - Faltam ', 
            (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_os` o
             WHERE (o.id_fabricante IS NULL OR EXISTS (SELECT 1 FROM fabricante WHERE id = o.id_fabricante))
               AND (o.id_fcu IS NULL OR EXISTS (SELECT 1 FROM fcu WHERE id = o.id_fcu))) - COUNT(*), 
            ' OSs')
    END as validacao
FROM `os`;

-- Se tudo estiver OK, descomente a linha abaixo para confirmar:
-- COMMIT;
-- Se houver problemas, execute:
-- ROLLBACK;

