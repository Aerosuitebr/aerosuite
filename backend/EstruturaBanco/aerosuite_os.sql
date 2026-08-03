-- MySQL dump 10.13  Distrib 8.0.26, for Win64 (x86_64)
--
-- Host: localhost    Database: aerosuite
-- ------------------------------------------------------
-- Server version	8.0.26

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `os`
--

DROP TABLE IF EXISTS `os`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `os` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ads_das` text,
  `ata_manual` int DEFAULT NULL,
  `cliente_nome` varchar(200) DEFAULT NULL,
  `data_conclusao_serv` date DEFAULT NULL,
  `data_fechamento` date DEFAULT NULL,
  `data_rev_manual` date DEFAULT NULL,
  `dt_abertura` date NOT NULL,
  `id_fabricante` int DEFAULT NULL,
  `id_fcu` int DEFAULT NULL,
  `tsn` varchar(20) DEFAULT NULL,
  `tso` varchar(20) DEFAULT NULL,
  `manual_pn` varchar(20) DEFAULT NULL,
  `num_os_original` varchar(30) DEFAULT NULL,
  `num_revisao` varchar(20) DEFAULT NULL,
  `obs_conclusao_serv` text,
  `obs_fim_serv` text,
  `obs_ini_serv` text,
  `tipo_servico` varchar(100) DEFAULT NULL,
  `titulo_ads` text,
  `titulo_afins` text,
  `boletins_serv_afins` text,
  `id_os` int NOT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `part_number` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`,`dt_abertura`),
  KEY `foreign_os01` (`id_fabricante`),
  CONSTRAINT `foreign_os01` FOREIGN KEY (`id_fabricante`) REFERENCES `fabricante` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=352 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `os`
--

LOCK TABLES `os` WRITE;
/*!40000 ALTER TABLE `os` DISABLE KEYS */;
INSERT INTO `os` VALUES (350,'',0,'hot valley','2021-05-11',NULL,'2021-05-17','2021-05-10',2,7,'223','23231',NULL,'OS-234324','343443','','','','1','','','',0,'132321','4335645-6'),(351,'',0,'hot valley','2021-07-29',NULL,'2021-05-17','2021-07-22',1,2,'','',NULL,'OS-234324','343443','','','','1','','','',0,'','4138008-3');
/*!40000 ALTER TABLE `os` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-17 15:08:29
