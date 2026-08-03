-- Tabela de Perfis
CREATE TABLE IF NOT EXISTS `perfil` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `codigo` varchar(50) NOT NULL UNIQUE,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_perfil_codigo` (`codigo`),
  KEY `idx_perfil_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela de relacionamento Perfil-Funcionalidade
CREATE TABLE IF NOT EXISTS `perfil_funcionalidade` (
  `perfil_id` bigint NOT NULL,
  `funcionalidade_id` bigint NOT NULL,
  PRIMARY KEY (`perfil_id`, `funcionalidade_id`),
  KEY `fk_perfil_funcionalidade_perfil` (`perfil_id`),
  KEY `fk_perfil_funcionalidade_funcionalidade` (`funcionalidade_id`),
  CONSTRAINT `fk_perfil_funcionalidade_perfil` FOREIGN KEY (`perfil_id`) REFERENCES `perfil` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_perfil_funcionalidade_funcionalidade` FOREIGN KEY (`funcionalidade_id`) REFERENCES `funcionalidade` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Inserir perfis padrão
INSERT INTO `perfil` (`nome`, `descricao`, `codigo`, `ativo`) VALUES
('Administrador', 'Acesso total ao sistema', 'ADMIN', 1),
('Operador', 'Acesso operacional limitado', 'OPERADOR', 1),
('Visualizador', 'Apenas visualização de dados', 'VISUALIZADOR', 1);

-- Perfis Part 145 (A4): ver migration V29__part145_profiles_crs_segregation.sql
-- P145_RT, P145_INSPETOR, P145_EXECUCAO, P145_ALMOX, P145_COMERCIAL + funcionalidade CRS_EMITIR

-- Atribuir funcionalidades ao perfil Administrador (todas)
INSERT INTO `perfil_funcionalidade` (`perfil_id`, `funcionalidade_id`)
SELECT p.id, f.id 
FROM `perfil` p, `funcionalidade` f 
WHERE p.codigo = 'ADMIN' AND f.ativo = 1;

-- Atribuir funcionalidades ao perfil Operador (exceto controle de acesso)
INSERT INTO `perfil_funcionalidade` (`perfil_id`, `funcionalidade_id`)
SELECT p.id, f.id 
FROM `perfil` p, `funcionalidade` f 
WHERE p.codigo = 'OPERADOR' 
AND f.ativo = 1 
AND f.codigo NOT IN ('CONTROLE_ACESSO', 'FUNCIONALIDADES', 'PERFIS', 'USUARIOS');

-- Atribuir funcionalidades ao perfil Visualizador (apenas visualização)
INSERT INTO `perfil_funcionalidade` (`perfil_id`, `funcionalidade_id`)
SELECT p.id, f.id 
FROM `perfil` p, `funcionalidade` f 
WHERE p.codigo = 'VISUALIZADOR' 
AND f.ativo = 1 
AND f.codigo IN ('DASHBOARD', 'PRODUTOS', 'FABRICANTES', 'TIPOS_SERVICO', 'FCU_ASSEMBLY', 'ASSOCIACAO_FCU');
