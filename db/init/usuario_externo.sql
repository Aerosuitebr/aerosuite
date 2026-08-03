-- ========================================
-- AEROSUITE - MÓDULO DE USUÁRIOS EXTERNOS
-- ========================================
-- Script para criação de tabelas para gerenciamento de usuários externos
-- Usuários externos são clientes que podem visualizar informações específicas do sistema
-- Data: 2026-01-05
-- IMPORTANTE: os.id é INT, tp_files.id é BIGINT, usuario.id é INT

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- LIMPAR TABELAS EXISTENTES (ordem correta)
-- ========================================
DROP TABLE IF EXISTS `log_acesso_externo`;
DROP TABLE IF EXISTS `password_reset_token_externo`;
DROP TABLE IF EXISTS `usuario_externo_documento`;
DROP TABLE IF EXISTS `usuario_externo_os`;
DROP TABLE IF EXISTS `usuario_externo_funcionalidade`;
DROP TABLE IF EXISTS `funcionalidade_externa`;
DROP TABLE IF EXISTS `usuario_externo`;

-- ========================================
-- 1. TABELA USUARIO_EXTERNO
-- ========================================
CREATE TABLE `usuario_externo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL COMMENT 'Nome completo do usuário externo',
  `email` VARCHAR(255) NOT NULL COMMENT 'Email único para login',
  `senha` VARCHAR(255) NOT NULL COMMENT 'Senha criptografada',
  `empresa` VARCHAR(255) NULL COMMENT 'Empresa do cliente',
  `telefone` VARCHAR(50) NULL COMMENT 'Telefone de contato',
  `cargo` VARCHAR(100) NULL COMMENT 'Cargo na empresa',
  `observacoes` TEXT NULL COMMENT 'Observações adicionais sobre o usuário',
  `foto_perfil` VARCHAR(500) NULL COMMENT 'Caminho da foto de perfil',
  `ativo` TINYINT(1) DEFAULT 1 COMMENT 'Se o usuário está ativo',
  `precisa_trocar_senha` TINYINT(1) DEFAULT 1 COMMENT 'Flag para forçar troca de senha no primeiro acesso',
  `data_cadastro` DATE NULL COMMENT 'Data de cadastro',
  `ultimo_acesso` DATETIME NULL COMMENT 'Data/hora do último acesso',
  `criado_por` INT NULL COMMENT 'ID do usuário interno que criou (usuario.id é INT)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_externo_email` (`email`),
  INDEX `idx_usuario_externo_ativo` (`ativo`),
  INDEX `idx_usuario_externo_empresa` (`empresa`),
  INDEX `idx_usuario_externo_criado_por` (`criado_por`),
  CONSTRAINT `fk_usuario_externo_criador` FOREIGN KEY (`criado_por`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Usuários externos (clientes) do sistema';

-- ========================================
-- 2. TABELA FUNCIONALIDADE_EXTERNA
-- ========================================
CREATE TABLE `funcionalidade_externa` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL COMMENT 'Nome da funcionalidade',
  `descricao` VARCHAR(255) NULL COMMENT 'Descrição da funcionalidade',
  `codigo` VARCHAR(50) NOT NULL COMMENT 'Código único da funcionalidade',
  `icone` VARCHAR(50) NULL COMMENT 'Ícone PrimeNG',
  `rota` VARCHAR(100) NULL COMMENT 'Rota no frontend',
  `ordem` INT DEFAULT 0 COMMENT 'Ordem de exibição no menu',
  `ativo` TINYINT(1) DEFAULT 1 COMMENT 'Se está ativa',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_funcionalidade_externa_codigo` (`codigo`),
  INDEX `idx_funcionalidade_externa_ativo` (`ativo`),
  INDEX `idx_funcionalidade_externa_ordem` (`ordem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Funcionalidades disponíveis para usuários externos';

-- Inserir funcionalidades externas padrão
INSERT INTO `funcionalidade_externa` (`nome`, `descricao`, `codigo`, `icone`, `rota`, `ordem`, `ativo`) VALUES
('Home', 'Página inicial promocional', 'home-externa', 'pi pi-home', '/externo', 1, 1),
('Minhas Ordens de Serviço', 'Visualizar ordens de serviço associadas', 'os-externa', 'pi pi-file-edit', '/externo/os', 2, 1),
('Meus Documentos', 'Visualizar documentos disponibilizados', 'documentos-externos', 'pi pi-folder', '/externo/documentos', 3, 1),
('Meu Perfil', 'Editar dados do perfil', 'perfil-externo', 'pi pi-user', '/externo/perfil', 4, 1),
('Minhas Propostas', 'Visualizar e aprovar propostas comerciais', 'propostas-externa', 'pi pi-file', '/externo/propostas', 25, 1);

-- ========================================
-- 3. TABELA USUARIO_EXTERNO_FUNCIONALIDADE
-- ========================================
CREATE TABLE `usuario_externo_funcionalidade` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_externo_id` INT NOT NULL COMMENT 'ID do usuário externo',
  `funcionalidade_externa_id` INT NOT NULL COMMENT 'ID da funcionalidade externa',
  `concedido_por` INT NULL COMMENT 'ID do usuário interno que concedeu acesso',
  `data_concessao` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data da concessão',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_funcionalidade_externa` (`usuario_externo_id`, `funcionalidade_externa_id`),
  INDEX `idx_uef_usuario_externo` (`usuario_externo_id`),
  INDEX `idx_uef_funcionalidade` (`funcionalidade_externa_id`),
  CONSTRAINT `fk_uef_usuario_externo` FOREIGN KEY (`usuario_externo_id`) REFERENCES `usuario_externo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_uef_funcionalidade_externa` FOREIGN KEY (`funcionalidade_externa_id`) REFERENCES `funcionalidade_externa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_uef_concedido_por` FOREIGN KEY (`concedido_por`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Funcionalidades concedidas a usuários externos';

-- ========================================
-- 4. TABELA USUARIO_EXTERNO_OS
-- ========================================
-- IMPORTANTE: os.id é INT, não BIGINT!
CREATE TABLE `usuario_externo_os` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_externo_id` INT NOT NULL COMMENT 'ID do usuário externo',
  `os_id` INT NOT NULL COMMENT 'ID da ordem de serviço (INT para corresponder a os.id)',
  `pode_visualizar` TINYINT(1) DEFAULT 1 COMMENT 'Permissão de visualização',
  `concedido_por` INT NULL COMMENT 'ID do usuário interno que concedeu acesso',
  `data_concessao` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data da concessão',
  `observacoes` TEXT NULL COMMENT 'Observações sobre o acesso',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_externo_os` (`usuario_externo_id`, `os_id`),
  INDEX `idx_ueo_usuario_externo` (`usuario_externo_id`),
  INDEX `idx_ueo_os` (`os_id`),
  CONSTRAINT `fk_ueo_usuario_externo` FOREIGN KEY (`usuario_externo_id`) REFERENCES `usuario_externo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ueo_os` FOREIGN KEY (`os_id`) REFERENCES `os` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ueo_concedido_por` FOREIGN KEY (`concedido_por`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Ordens de serviço acessíveis por usuários externos';

-- ========================================
-- 5. TABELA USUARIO_EXTERNO_DOCUMENTO
-- ========================================
-- Referencia tp_files (INT) e os_files (BIGINT)
CREATE TABLE `usuario_externo_documento` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_externo_id` INT NOT NULL COMMENT 'ID do usuário externo',
  `tp_file_id` INT NULL COMMENT 'ID do arquivo de tipo de serviço (tp_files.id é INT)',
  `os_file_id` BIGINT NULL COMMENT 'ID do arquivo de OS (os_files.id é BIGINT)',
  `nome_arquivo` VARCHAR(255) NOT NULL COMMENT 'Nome do arquivo para exibição',
  `descricao` TEXT NULL COMMENT 'Descrição do documento',
  `pode_download` TINYINT(1) DEFAULT 1 COMMENT 'Se pode fazer download',
  `concedido_por` INT NULL COMMENT 'ID do usuário interno que concedeu acesso',
  `data_concessao` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data da concessão',
  `data_expiracao` DATE NULL COMMENT 'Data de expiração do acesso (opcional)',
  `visualizacoes` INT DEFAULT 0 COMMENT 'Contador de visualizações',
  `ultimo_acesso` DATETIME NULL COMMENT 'Data/hora do último acesso ao documento',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ued_usuario_externo` (`usuario_externo_id`),
  INDEX `idx_ued_tp_file` (`tp_file_id`),
  INDEX `idx_ued_os_file` (`os_file_id`),
  INDEX `idx_ued_expiracao` (`data_expiracao`),
  CONSTRAINT `fk_ued_usuario_externo` FOREIGN KEY (`usuario_externo_id`) REFERENCES `usuario_externo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ued_tp_file` FOREIGN KEY (`tp_file_id`) REFERENCES `tp_files` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ued_os_file` FOREIGN KEY (`os_file_id`) REFERENCES `os_files` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ued_concedido_por` FOREIGN KEY (`concedido_por`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Documentos acessíveis por usuários externos';

-- ========================================
-- 6. TABELA PASSWORD_RESET_TOKEN_EXTERNO
-- ========================================
CREATE TABLE `password_reset_token_externo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `token` VARCHAR(255) NOT NULL COMMENT 'Token único para reset',
  `email` VARCHAR(255) NOT NULL COMMENT 'Email do usuário externo',
  `expires_at` DATETIME NOT NULL COMMENT 'Data/hora de expiração',
  `used` TINYINT(1) DEFAULT 0 COMMENT 'Se já foi utilizado',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token_externo` (`token`),
  INDEX `idx_prte_email` (`email`),
  INDEX `idx_prte_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tokens de reset de senha para usuários externos';

-- ========================================
-- 7. TABELA LOG_ACESSO_EXTERNO
-- ========================================
CREATE TABLE `log_acesso_externo` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `usuario_externo_id` INT NULL COMMENT 'ID do usuário externo (pode ser NULL para tentativas falhas)',
  `tipo_acao` VARCHAR(50) NOT NULL COMMENT 'Tipo da ação (LOGIN, VISUALIZACAO_OS, DOWNLOAD_DOC, etc)',
  `recurso_id` BIGINT NULL COMMENT 'ID do recurso acessado (OS, documento, etc)',
  `recurso_tipo` VARCHAR(50) NULL COMMENT 'Tipo do recurso (OS, DOCUMENTO, etc)',
  `ip_acesso` VARCHAR(50) NULL COMMENT 'IP do acesso',
  `user_agent` VARCHAR(500) NULL COMMENT 'User agent do navegador',
  `detalhes` TEXT NULL COMMENT 'Detalhes adicionais em JSON',
  `data_acesso` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora do acesso',
  PRIMARY KEY (`id`),
  INDEX `idx_lae_usuario_externo` (`usuario_externo_id`),
  INDEX `idx_lae_tipo_acao` (`tipo_acao`),
  INDEX `idx_lae_data_acesso` (`data_acesso`),
  CONSTRAINT `fk_lae_usuario_externo` FOREIGN KEY (`usuario_externo_id`) REFERENCES `usuario_externo` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Log de acessos de usuários externos';

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- VERIFICAÇÃO
-- ========================================
SELECT '✅ Tabelas de Usuário Externo criadas com sucesso!' AS status;

SELECT 'TABELAS CRIADAS:' AS info;
SELECT TABLE_NAME, TABLE_COMMENT 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME LIKE '%externo%'
ORDER BY TABLE_NAME;

SELECT 'FUNCIONALIDADES_EXTERNAS' AS tabela, COUNT(*) AS registros FROM funcionalidade_externa;
