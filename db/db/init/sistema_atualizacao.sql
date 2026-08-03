-- Tabela para gerenciar atualizações do sistema
CREATE TABLE IF NOT EXISTS `sistema_atualizacao` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `versao_disponivel` VARCHAR(50) NULL,
  `versao_atual` VARCHAR(50) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DISPONIVEL',
  `aprovado_por` INT NULL,
  `data_aprovacao` DATETIME NULL,
  `data_inicio` DATETIME NULL,
  `data_conclusao` DATETIME NULL,
  `contador_regressivo` INT NULL,
  `mensagem` TEXT NULL,
  `created_at` DATETIME NULL,
  `updated_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_aprovado_por` (`aprovado_por`),
  CONSTRAINT `fk_sistema_atualizacao_usuario`
    FOREIGN KEY (`aprovado_por`)
    REFERENCES `usuario` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

