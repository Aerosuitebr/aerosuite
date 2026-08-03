-- =====================================================
-- Script de Migração: PERFIL
-- =====================================================
-- Migra dados da tabela perfil do banco antigo para o novo
-- Esta tabela não tem dependências, pode ser migrada cedo
-- =====================================================

START TRANSACTION;

-- Verificar se já existem dados na tabela nova
SET @existem_dados = (SELECT COUNT(*) FROM `perfil`);

-- Se a tabela perfil não existir no banco antigo, criar perfis padrão
-- (Isso pode acontecer se o sistema antigo não tinha controle de perfis)
INSERT INTO `perfil` (`codigo`, `nome`, `descricao`, `ativo`)
SELECT * FROM (
    SELECT 'ADMIN' as codigo, 'Administrador' as nome, 'Acesso total ao sistema' as descricao, 1 as ativo
    UNION ALL
    SELECT 'USER', 'Usuário', 'Acesso padrão ao sistema', 1
    UNION ALL
    SELECT 'TECNICO', 'Técnico', 'Acesso técnico ao sistema', 1
) AS perfis_padrao
WHERE NOT EXISTS (
    SELECT 1 FROM `perfil` p WHERE p.codigo = perfis_padrao.codigo
)
AND @existem_dados = 0;

-- Se existir tabela perfil no banco antigo, migrar:
-- INSERT INTO `perfil` (`id`, `codigo`, `nome`, `descricao`, `ativo`)
-- SELECT `id`, `codigo`, `nome`, `descricao`, COALESCE(`ativo`, 1)
-- FROM `aerosuite_backup_antigo`.`backup_perfil`
-- WHERE NOT EXISTS (
--     SELECT 1 FROM `perfil` p WHERE p.id = `aerosuite_backup_antigo`.`backup_perfil`.`id`
-- );

-- Verificar resultado
SELECT 
    'Perfis disponíveis' as status,
    codigo,
    nome,
    ativo
FROM `perfil`
ORDER BY id;

-- Validar que existe pelo menos o perfil ADMIN
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM `perfil` WHERE codigo = 'ADMIN')
        THEN 'OK - Perfil ADMIN existe'
        ELSE 'ERRO - Perfil ADMIN não encontrado'
    END as validacao;

-- Se tudo estiver OK, descomente a linha abaixo para confirmar:
-- COMMIT;
-- Se houver problemas, execute:
-- ROLLBACK;

