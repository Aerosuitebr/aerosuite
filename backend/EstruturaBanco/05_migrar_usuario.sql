-- =====================================================
-- Script de Migração: USUARIO
-- =====================================================
-- Migra dados da tabela usuario do banco antigo para o novo
-- ATENÇÃO: Esta tabela depende de PERFIL
-- =====================================================

START TRANSACTION;

-- Verificar se já existem dados na tabela nova
SET @existem_dados = (SELECT COUNT(*) FROM `usuario`);

-- Obter ID do perfil padrão (ADMIN) caso o usuário não tenha perfil
SET @perfil_admin_id = (SELECT id FROM `perfil` WHERE codigo = 'ADMIN' LIMIT 1);

-- Migrar usuários do banco antigo
-- IMPORTANTE: Ajuste os nomes das colunas conforme a estrutura real do banco antigo
INSERT INTO `usuario` (
    `id`,
    `email`,
    `nome`,
    `senha`,
    `data_cadastro`,
    `perfil_id`,
    `ativo`,
    `created_at`,
    `updated_at`
)
SELECT 
    u.`id`,
    u.`email`,
    u.`nome`,
    u.`senha`,  -- Senhas já devem estar criptografadas
    COALESCE(u.`data_cadastro`, CURDATE()) as `data_cadastro`,
    COALESCE(u.`perfil_id`, @perfil_admin_id) as `perfil_id`,
    COALESCE(u.`ativo`, 1) as `ativo`,
    COALESCE(u.`created_at`, NOW()) as `created_at`,
    COALESCE(u.`updated_at`, NOW()) as `updated_at`
FROM `aerosuite_backup_antigo`.`backup_usuario` u
WHERE NOT EXISTS (
    SELECT 1 FROM `usuario` us WHERE us.id = u.id
)
AND @existem_dados = 0;

-- Se já existirem dados, fazer INSERT IGNORE:
-- INSERT IGNORE INTO `usuario` (`id`, `email`, `nome`, `senha`, `data_cadastro`, `perfil_id`, `ativo`)
-- SELECT `id`, `email`, `nome`, `senha`, `data_cadastro`, COALESCE(`perfil_id`, @perfil_admin_id), COALESCE(`ativo`, 1)
-- FROM `aerosuite_backup_antigo`.`backup_usuario`;

-- Atualizar usuários que não têm perfil atribuído
UPDATE `usuario` 
SET `perfil_id` = @perfil_admin_id
WHERE `perfil_id` IS NULL;

-- Verificar resultado
SELECT 
    'Usuários migrados' as status,
    COUNT(*) as total,
    COUNT(DISTINCT email) as emails_unicos,
    COUNT(CASE WHEN perfil_id IS NULL THEN 1 END) as sem_perfil
FROM `usuario`;

-- Validar integridade
SELECT 
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_usuario`) 
        THEN 'OK - Todos os usuários migrados'
        ELSE CONCAT('ATENÇÃO - Faltam ', 
            (SELECT COUNT(*) FROM `aerosuite_backup_antigo`.`backup_usuario`) - COUNT(*), 
            ' usuários')
    END as validacao
FROM `usuario`;

-- Verificar usuários sem perfil (deve ser 0)
SELECT 
    CASE 
        WHEN COUNT(*) = 0 
        THEN 'OK - Todos os usuários têm perfil'
        ELSE CONCAT('ATENÇÃO - ', COUNT(*), ' usuários sem perfil')
    END as validacao_perfil
FROM `usuario`
WHERE `perfil_id` IS NULL;

-- Se tudo estiver OK, descomente a linha abaixo para confirmar:
-- COMMIT;
-- Se houver problemas, execute:
-- ROLLBACK;

