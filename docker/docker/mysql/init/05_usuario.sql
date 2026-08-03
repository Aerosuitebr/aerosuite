-- Bootstrap inicial (MySQL vazio): tabela `usuario` alinhada à entidade JPA.
-- Ordem: após `perfil` (FK opcional em perfil_id). Flyway V3 referencia `usuario(id)`.

CREATE TABLE IF NOT EXISTS `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data_cadastro` date DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `nome` varchar(255) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `ultimo_acesso` datetime(6) DEFAULT NULL,
  `perfil_id` bigint DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `foto_perfil` varchar(500) DEFAULT NULL,
  `precisa_trocar_senha` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_email` (`email`),
  KEY `idx_usuario_perfil` (`perfil_id`),
  CONSTRAINT `fk_usuario_perfil` FOREIGN KEY (`perfil_id`) REFERENCES `perfil` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
