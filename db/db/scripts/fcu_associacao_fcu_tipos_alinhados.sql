-- =============================================================================
-- FCU + ASSOCIACAO_FCU — tipos alinhados (evita MySQL 3780)
-- =============================================================================
-- Erro 3780: coluna da FK e coluna referenciada devem ser compatíveis.
-- Se fcu.id for INT, associacao_fcu.id_fcu TAMBÉM deve ser INT (não BIGINT).
-- Ordem: dependências primeiro; associacao_fcu antes de dropar fcu.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Ajuste se já tiver fabricante/product com outro nome de banco:
-- USE seu_banco;

-- -----------------------------------------------------------------------------
-- Pré-requisito: fabricante (id int) para foreign_fcu02
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fabricante` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Pré-requisito: product (id int) para foreign_key02 em associacao_fcu
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(100) DEFAULT NULL,
  `invoice` int DEFAULT NULL,
  `name` varchar(200) DEFAULT NULL,
  `price` decimal(38,2) DEFAULT NULL,
  `productpn` varchar(25) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `local` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- associacao_fcu depende de fcu — remover antes de recriar fcu
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `associacao_fcu`;

-- -----------------------------------------------------------------------------
-- FCU
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `fcu`;
CREATE TABLE `fcu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fcu_codigo` varchar(20) DEFAULT NULL,
  `fcu_description` varchar(255) DEFAULT NULL,
  `id_product` int DEFAULT NULL,
  `id_fabricante` int DEFAULT NULL,
  `modelo` varchar(255) DEFAULT NULL,
  `pn` varchar(100) DEFAULT NULL,
  `serial_number` varchar(20) DEFAULT NULL,
  `ata_manual` varchar(20) DEFAULT NULL,
  `data_rev_manual` date DEFAULT NULL,
  `num_revisao` varchar(20) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `foreign_fcudto01` (`id_product`),
  KEY `foreign_fcudto02` (`id_fabricante`),
  CONSTRAINT `foreign_fcu02` FOREIGN KEY (`id_fabricante`) REFERENCES `fabricante` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=706 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- ASSOCIACAO_FCU — id_fcu INT (igual a fcu.id)
-- -----------------------------------------------------------------------------
CREATE TABLE `associacao_fcu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_fcu` int NOT NULL,
  `id_product` int NOT NULL,
  `qtd_product` int DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `foreign_key01` (`id_fcu`),
  KEY `foreign_key02` (`id_product`),
  CONSTRAINT `foreign_key01` FOREIGN KEY (`id_fcu`) REFERENCES `fcu` (`id`),
  CONSTRAINT `foreign_key02` FOREIGN KEY (`id_product`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
