-- =====================================================
-- Script de Migração: FABRICANTE
-- =====================================================
-- Migra dados da tabela fabricante do banco antigo para o novo
-- Esta tabela não tem dependências, pode ser migrada primeiro
-- =====================================================

START TRANSACTION;

-- Verificar se já existem dados na tabela nova
SET @existem_dados = (SELECT COUNT(*) FROM `fabricante`);

-- Se não existirem dados, fazer a migração
-- IMPORTANTE: Ajuste 'aerosuite_backup_antigo' ou o nome do banco antigo conforme necessário
INSERT INTO `fabricante` (`id`, `nome`)
SELECT `id`, `nome`
FROM `aerosuite_backup_antigo`.`backup_fabricante`
WHERE NOT EXISTS (
    SELECT 1 FROM `fabricante` f WHERE f.id = `aerosuite_backup_antigo`.`backup_fabricante`.`id`
)
AND @existem_dados = 0;

-- Se já existirem dados, fazer INSERT IGNORE para evitar duplicatas
-- Descomente a linha abaixo se preferir esta abordagem:
-- INSERT IGNORE INTO `fabricante` (`id`, `nome`)
-- SELECT `id`, `nome` FROM `aerosuite_backup_antigo`.`backup_fabricante`;

-- Verificar resultado
SELECT 
    'Fabricantes migrados' as status,
    COUNT(*) as total,
    MIN(id) as menor_id,
    MAX(id) as maior_id
FROM `fabricante`;

-- Validar integridade
SELECT 
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_fabricante`) 
        THEN 'OK - Todos os registros migrados'
        ELSE CONCAT('ATENÇÃO - Faltam ', 
            (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_fabricante`) - COUNT(*), 
            ' registros')
    END as validacao
FROM `fabricante`;

-- Se tudo estiver OK, descomente a linha abaixo para confirmar:
-- COMMIT;
-- Se houver problemas, execute:
-- ROLLBACK;

