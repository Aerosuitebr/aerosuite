-- Atualizar tabela de usuários para incluir perfil_id
ALTER TABLE `usuario` 
ADD COLUMN `perfil_id` bigint DEFAULT NULL AFTER `data_cadastro`,
ADD COLUMN `ativo` tinyint(1) NOT NULL DEFAULT 1 AFTER `perfil_id`,
ADD COLUMN `created_at` datetime DEFAULT CURRENT_TIMESTAMP AFTER `ativo`,
ADD COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
ADD KEY `fk_usuario_perfil` (`perfil_id`),
ADD CONSTRAINT `fk_usuario_perfil` FOREIGN KEY (`perfil_id`) REFERENCES `perfil` (`id`) ON DELETE SET NULL;

-- Atribuir perfil padrão (Administrador) aos usuários existentes
UPDATE `usuario` 
SET `perfil_id` = (SELECT id FROM `perfil` WHERE codigo = 'ADMIN' LIMIT 1)
WHERE `perfil_id` IS NULL;
