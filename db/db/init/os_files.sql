-- ========================================
-- AEROSUITE - TABELA OS_FILES
-- ========================================
-- Tabela para armazenar referências de arquivos associados às Ordens de Serviço
-- Os arquivos físicos ficam em: backend/os/{osId}/
-- NOTA: os.id é INT, não BIGINT!

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Criar tabela os_files
DROP TABLE IF EXISTS `os_files`;
CREATE TABLE `os_files` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `os_id` INT NOT NULL COMMENT 'ID da Ordem de Serviço (INT para corresponder a os.id)',
  `file_name` VARCHAR(255) NOT NULL COMMENT 'Nome do arquivo armazenado',
  `original_name` VARCHAR(255) NULL COMMENT 'Nome original do arquivo',
  `file_path` VARCHAR(500) NOT NULL COMMENT 'Caminho completo do arquivo',
  `file_size` BIGINT NULL COMMENT 'Tamanho do arquivo em bytes',
  `content_type` VARCHAR(100) NULL COMMENT 'MIME type do arquivo',
  `file_extension` VARCHAR(10) NULL COMMENT 'Extensão do arquivo',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Se o arquivo está ativo',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_os_files_os_id` (`os_id`),
  INDEX `idx_os_files_active` (`is_active`),
  INDEX `idx_os_files_extension` (`file_extension`)
  -- FK removida para permitir import de arquivos de OS que podem não existir no banco
  -- Para adicionar depois: ALTER TABLE os_files ADD CONSTRAINT fk_os_files_os FOREIGN KEY (os_id) REFERENCES os(id) ON DELETE CASCADE;
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Arquivos associados às Ordens de Serviço';

SET FOREIGN_KEY_CHECKS = 1;

-- Verificação
SELECT 'Tabela os_files criada com sucesso!' AS status;
DESCRIBE os_files;
