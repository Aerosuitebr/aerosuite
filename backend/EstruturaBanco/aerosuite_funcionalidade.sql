-- Tabela de Funcionalidades
CREATE TABLE IF NOT EXISTS `funcionalidade` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `codigo` varchar(50) NOT NULL UNIQUE,
  `icone` varchar(50) DEFAULT NULL,
  `rota` varchar(100) DEFAULT NULL,
  `ordem` int DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_funcionalidade_codigo` (`codigo`),
  KEY `idx_funcionalidade_ativo` (`ativo`),
  KEY `idx_funcionalidade_ordem` (`ordem`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Inserir funcionalidades padrão
INSERT INTO `funcionalidade` (`nome`, `descricao`, `codigo`, `icone`, `rota`, `ordem`, `ativo`) VALUES
('Dashboard', 'Página inicial do sistema', 'DASHBOARD', 'pi pi-home', '/home', 1, 1),
('Produtos', 'Gerenciamento de produtos', 'PRODUTOS', 'pi pi-box', '/products', 2, 1),
('Fabricantes', 'Gerenciamento de fabricantes', 'FABRICANTES', 'pi pi-building', '/fabricantes', 3, 1),
('Tipos de Serviço', 'Gerenciamento de tipos de serviço', 'TIPOS_SERVICO', 'pi pi-cog', '/tipos-servico', 4, 1),
('Usuários', 'Gerenciamento de usuários', 'USUARIOS', 'pi pi-users', '/usuarios', 5, 1),
('FCU Assembly', 'Editor de montagem FCU', 'FCU_ASSEMBLY', 'pi pi-cog', '/fcu-assembly', 6, 1),
('Associação FCU', 'Associação FCU-Product', 'ASSOCIACAO_FCU', 'pi pi-link', '/associacao-fcu', 7, 1),
('Controle de Acesso', 'Gerenciamento de permissões', 'CONTROLE_ACESSO', 'pi pi-shield', '/controle-acesso', 8, 1),
('Funcionalidades', 'Gerenciamento de funcionalidades', 'FUNCIONALIDADES', 'pi pi-list', '/funcionalidades', 9, 1),
('Perfis', 'Gerenciamento de perfis', 'PERFIS', 'pi pi-id-card', '/perfis', 10, 1);
