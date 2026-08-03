-- ========================================
-- AEROSUITE - COMPLETE DATABASE INITIALIZATION
-- ========================================
-- Script consolidado a partir dos arquivos da pasta EstruturaBanco
-- Ordem de criação respeitando foreign keys

-- Configurações iniciais
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- ========================================
-- 1. TABELA FABRICANTE (sem dependências)
-- ========================================
DROP TABLE IF EXISTS `fabricante`;
CREATE TABLE `fabricante` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados fabricante
INSERT INTO `fabricante` VALUES 
(1,'HONEYWELL'),
(2,'Allied Signal'),
(3,'PWC'),
(4,'HAMILTON SUNDSTRAND'),
(5,'PWC'),
(6,'ARGOTECH');

-- ========================================
-- 2. TABELA PRODUCT (sem dependências)
-- ========================================
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(100) DEFAULT NULL,
  `invoice` int DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `productpn` varchar(25) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `local` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=275 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados product (primeiros 20 registros para teste)
INSERT INTO `product` VALUES 
(1,'PARAFUSO',0,'SCREW',1.00,'AN503-6-4',26,'true',NULL),
(3,'PARAFUSO',0,'SCREW',1.00,'AN503-6-8',61,'true',NULL),
(5,'ARRUELA',0,'WASHER',1.00,'AN960-416L',2,'true',NULL),
(6,'PARAFUSO',0,'SCREW',1.00,'AN960-10L',-3,'true',NULL),
(7,'ARRUELA',0,'WASHER',1.00,'AN960-8',-14,'true',NULL),
(8,'ARRUELA',0,'WASHER',1.00,'AN960-C10L',-2,'true',NULL),
(9,'PINO',0,'PIN',1.00,'MS171436',13,'true',NULL),
(10,'PORCA',0,'NUT',1.00,'MS21083N06',-54,'true',NULL),
(11,'PINO',0,'PIN',1.00,'P-14577',-7,'true',NULL),
(12,'',0,'BEARING',0.00,'2523240',700,'true',''),
(13,'',0,'SCREW',0.00,'334-S-609',-15,'true',NULL),
(14,'',0,'PACKING',0.00,'379-S-13',-35,'true',NULL),
(15,'',0,'PACKING',0.00,'317-S-1',-23,'true',NULL),
(16,'',0,'PACKING',0.00,'317-S-4',-12,'true',NULL),
(17,'',0,'PACKING',0.00,'317-S-5',-44,'true',NULL),
(18,'',0,'BEARING',0.00,'3243621',300,'true',''),
(19,'',0,'RING',0.00,'99-4906',-16,'true',NULL),
(20,'',0,'WASHER',0.00,'118172',-6,'true',NULL),
(21,'',0,'PIN',0.00,'118554',-14,'true',NULL),
(22,'',0,'SCREW',0.00,'186739',2,'true',NULL);

-- ========================================
-- 3. TABELA TIPO_SERVICO (sem dependências)
-- ========================================
DROP TABLE IF EXISTS `tipo_servico`;
CREATE TABLE `tipo_servico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `descricao` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados tipo_servico
INSERT INTO `tipo_servico` VALUES 
(1,'REVISÃO GERAL','Revisão completa do equipamento'),
(2,'REPARO','Reparo de componentes específicos'),
(3,'INSPEÇÃO VISUAL','Inspeção visual do equipamento'),
(4,'TESTE','Teste de funcionamento'),
(5,'GARANTIA','Serviço de garantia'),
(6,'OUTROS','Outros tipos de serviço'),
(7,'MANUTENÇÃO PREVENTIVA','Manutenção preventiva programada');

-- ========================================
-- 4. TABELA USUARIO (sem dependências)
-- ========================================
DROP TABLE IF EXISTS `usuario`;
CREATE TABLE `usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados usuario
INSERT INTO `usuario` VALUES 
(1,'Administrador','admin@aerosuite.com','$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi',1),
(2,'Usuário Teste','teste@aerosuite.com','$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi',1);

-- ========================================
-- 5. TABELA FCU (depende de fabricante e product)
-- ========================================
DROP TABLE IF EXISTS `fcu`;
CREATE TABLE `fcu` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fcu_codigo` varchar(15) NOT NULL,
  `fcu_description` varchar(100) DEFAULT NULL,
  `id_product` int DEFAULT NULL,
  `id_fabricante` int DEFAULT NULL,
  `modelo` varchar(200) DEFAULT NULL,
  `pn` varchar(20) DEFAULT NULL,
  `serial_number` varchar(20) DEFAULT NULL,
  `ata_manual` varchar(255) DEFAULT NULL,
  `data_rev_manual` date DEFAULT NULL,
  `num_revisao` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `foreign_fcudto01` (`id_product`),
  KEY `foreign_fcudto02` (`id_fabricante`),
  KEY `idx_fcu_created_at` (`created_at`),
  KEY `idx_fcu_is_active` (`is_active`),
  CONSTRAINT `foreign_fcu02` FOREIGN KEY (`id_fabricante`) REFERENCES `fabricante` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=185 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados FCU (primeiros 20 registros para teste)
INSERT INTO `fcu` VALUES 
(2,'4138008-3','FCU',0,1,'DP-F2','4138008-3','','73-20-64','1993-02-26','0',NOW(),NOW(),'system',1),
(3,'3244897-4','FCU',0,1,'DP-F2','3244897-4','','73-20-78','2020-10-01','1',NOW(),NOW(),'system',1),
(6,'3244897-1','FCU',0,2,'DP-F2','3244897-1','','73-20-78','1997-12-28','0',NOW(),NOW(),'system',1),
(7,'3244897-2','FCU',0,2,'DP-F2','3244897-2','','73-20-78','1997-12-28','0',NOW(),NOW(),'system',1),
(9,'3244897-4','FCU',0,2,'DP-F2','3244897-4','','73-20-78','1997-12-28','0',NOW(),NOW(),'system',1),
(10,'3244809-1','FCU',0,1,'DP-F2','3244809-1','','73-20-36','2020-12-17','3',NOW(),NOW(),'system',1),
(11,'3244809-2','FCU',0,1,'DP-F2','3244809-2','','73-20-36','2020-12-17','3',NOW(),NOW(),'system',1),
(12,'3244809-3','FCU',0,1,'DP-F2','3244809-3','','73-20-36','2008-05-15','2',NOW(),NOW(),'system',1),
(13,'3244809-4','FCU',0,1,'DP-F2','3244809-4','','73-20-36','2020-12-17','3',NOW(),NOW(),'system',1),
(14,'3244809-5','FCU',0,1,'DP-F2','3244809-5','','73-20-36','2020-12-17','3',NOW(),NOW(),'system',1),
(16,'3244809-7','FCU',0,1,'DP-F2','3244809-7','','73-20-36','2020-12-17','3',NOW(),NOW(),'system',1),
(18,'2524245','FCU',0,2,'DP-F2','2524245','','73-20-28','2007-11-26','1',NOW(),NOW(),'system',1),
(34,'2524440-4','FCU',0,2,'DP-F2','2524440-4','','73-20-31','2008-02-29','2',NOW(),NOW(),'system',1),
(35,'2524440-5','FCU',0,2,'DP-F2','2524440-5','','73-20-31','2020-11-16','4',NOW(),NOW(),'system',1),
(36,'2524440-6','FCU',0,2,'DP-F2','2524440-6','','73-20-31','2008-02-29','2',NOW(),NOW(),'system',1),
(37,'2524440-7','FCU',0,2,'DP-F2','2524440-7','','73-20-31','2008-02-29','2',NOW(),NOW(),'system',1),
(38,'2524440-8','FCU',0,2,'DP-F2','2524440-8','','73-20-31','2008-02-29','2',NOW(),NOW(),'system',1),
(39,'2524440-9','FCU',0,2,'DP-F2','2524440-9','','73-20-31','2008-02-29','2',NOW(),NOW(),'system',1),
(46,'3244745-1','FCU',0,1,'DP-F2','3244745-1','','73-20-15','2008-01-25','9',NOW(),NOW(),'system',1),
(47,'3244745-2','FCU',0,1,'DP-F2','3244745-2','','73-20-15','2008-01-25','9',NOW(),NOW(),'system',1);

-- ========================================
-- 6. TABELA ASSOCIACAO_FCU (depende de fcu e product)
-- ========================================
DROP TABLE IF EXISTS `associacao_fcu`;
CREATE TABLE `associacao_fcu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_fcu` bigint NOT NULL,
  `id_product` int NOT NULL,
  `qtd_product` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `foreign_key01` (`id_fcu`),
  KEY `foreign_key02` (`id_product`),
  CONSTRAINT `foreign_key01` FOREIGN KEY (`id_fcu`) REFERENCES `fcu` (`id`),
  CONSTRAINT `foreign_key02` FOREIGN KEY (`id_product`) REFERENCES `product` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2655 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados associacao_fcu (alguns registros para teste)
INSERT INTO `associacao_fcu` VALUES 
(1,2,1,2),
(2,2,3,1),
(3,3,5,1),
(4,6,6,1),
(5,7,7,2);

-- ========================================
-- 7. TABELA OS (depende de fabricante e fcu)
-- ========================================
DROP TABLE IF EXISTS `os`;
CREATE TABLE `os` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_os` int NOT NULL,
  `ads_das` varchar(255) DEFAULT NULL,
  `ata_manual` int DEFAULT 0,
  `cliente_nome` varchar(255) DEFAULT NULL,
  `data_conclusao_serv` date DEFAULT NULL,
  `data_fechamento` date DEFAULT NULL,
  `data_rev_manual` date DEFAULT NULL,
  `dt_abertura` date DEFAULT NULL,
  `id_fabricante` int DEFAULT NULL,
  `id_fcu` int DEFAULT NULL,
  `tsn` varchar(100) DEFAULT NULL,
  `tso` varchar(100) DEFAULT NULL,
  `manual_pn` varchar(100) DEFAULT NULL,
  `num_os_original` varchar(100) DEFAULT NULL,
  `num_revisao` varchar(100) DEFAULT NULL,
  `obs_conclusao_serv` text,
  `obs_fim_serv` text,
  `serial_number` varchar(100) DEFAULT NULL,
  `obs_ini_serv` text,
  `tipo_servico` varchar(100) DEFAULT NULL,
  `titulo_ads` varchar(255) DEFAULT NULL,
  `titulo_afins` varchar(255) DEFAULT NULL,
  `boletins_serv_afins` text,
  `part_number` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_os_id_os` (`id_os`),
  KEY `idx_os_id_fabricante` (`id_fabricante`),
  KEY `idx_os_id_fcu` (`id_fcu`),
  KEY `idx_os_cliente_nome` (`cliente_nome`),
  KEY `idx_os_created_at` (`created_at`),
  KEY `idx_os_is_active` (`is_active`),
  CONSTRAINT `fk_os_fabricante` FOREIGN KEY (`id_fabricante`) REFERENCES `fabricante` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados OS (alguns registros para teste)
INSERT INTO `os` VALUES 
(1,351,'ADS/DAS Teste',0,'HOT VALLEY','2024-01-15','2024-01-20','2024-01-10','2024-01-01',1,2,'1000','500','73-20-64','OS-234324','1','Serviço concluído com sucesso','OS finalizada','SN123456','Início do serviço','REVISÃO GERAL','Título ADS Teste','Título Afins Teste','Boletins relacionados',NULL,NOW(),NOW(),'system',1),
(2,352,'ADS/DAS Teste 2',0,'AIRLINE TEST','2024-02-15','2024-02-20','2024-02-10','2024-02-01',2,3,'2000','1000','73-20-78','OS-234325','2','Serviço concluído','OS finalizada','SN123457','Início do serviço','REPARO','Título ADS Teste 2','Título Afins Teste 2','Boletins relacionados 2',NULL,NOW(),NOW(),'system',1);

-- ========================================
-- 8. TABELA TP_FILES (depende de tipo_servico)
-- ========================================
DROP TABLE IF EXISTS `tp_files`;
CREATE TABLE `tp_files` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `content_type` varchar(100) DEFAULT NULL,
  `file_extension` varchar(20) DEFAULT NULL,
  `description` text,
  `tipo_servico_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tp_files_tipo_servico` (`tipo_servico_id`),
  KEY `idx_tp_files_created_at` (`created_at`),
  KEY `idx_tp_files_is_active` (`is_active`),
  CONSTRAINT `fk_tp_files_tipo_servico` FOREIGN KEY (`tipo_servico_id`) REFERENCES `tipo_servico` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados tp_files (alguns registros para teste)
INSERT INTO `tp_files` VALUES 
(1,'manual_revisao_geral.pdf','Manual Revisão Geral.pdf','/uploads/manuals/manual_revisao_geral.pdf',1024000,'application/pdf','pdf','Manual para revisão geral de equipamentos',1,NOW(),NOW(),'system',1),
(2,'procedimento_reparo.docx','Procedimento de Reparo.docx','/uploads/procedures/procedimento_reparo.docx',512000,'application/vnd.openxmlformats-officedocument.wordprocessingml.document','docx','Procedimento padrão para reparos',2,NOW(),NOW(),'system',1),
(3,'checklist_inspecao.pdf','Checklist Inspeção Visual.pdf','/uploads/checklists/checklist_inspecao.pdf',256000,'application/pdf','pdf','Checklist para inspeção visual',3,NOW(),NOW(),'system',1);

-- ========================================
-- FINALIZAÇÃO
-- ========================================
COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;

-- ========================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ========================================
SELECT 'FABRICANTES' as tabela, COUNT(*) as registros FROM fabricante
UNION ALL
SELECT 'PRODUCTS' as tabela, COUNT(*) as registros FROM product
UNION ALL
SELECT 'TIPO_SERVICO' as tabela, COUNT(*) as registros FROM tipo_servico
UNION ALL
SELECT 'USUARIOS' as tabela, COUNT(*) as registros FROM usuario
UNION ALL
SELECT 'FCU' as tabela, COUNT(*) as registros FROM fcu
UNION ALL
SELECT 'ASSOCIACAO_FCU' as tabela, COUNT(*) as registros FROM associacao_fcu
UNION ALL
SELECT 'OS' as tabela, COUNT(*) as registros FROM os
UNION ALL
SELECT 'TP_FILES' as tabela, COUNT(*) as registros FROM tp_files;
