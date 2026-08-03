-- =====================================================
-- Script de Backup do Banco Antigo (JSF)
-- =====================================================
-- Execute este script ANTES de qualquer migração
-- Ele cria um dump completo do banco antigo para segurança
-- =====================================================

-- IMPORTANTE: Este script deve ser executado via mysqldump no terminal:
-- mysqldump -u [usuario] -p [banco_antigo] > backup_banco_antigo_$(date +%Y%m%d_%H%M%S).sql

-- Ou use o comando abaixo para criar backup apenas das tabelas principais:
-- mysqldump -u [usuario] -p [banco_antigo] fabricante perfil usuario fcu os product tipo_servico associacao_fcu > backup_dados_principais_$(date +%Y%m%d_%H%M%S).sql

-- =====================================================
-- Alternativa: Criar tabela de backup no próprio banco
-- =====================================================

-- Criar schema de backup (se não existir)
CREATE DATABASE IF NOT EXISTS `aerosuite_backup_antigo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `aerosuite_backup_antigo`;

-- Criar cópias das tabelas principais
CREATE TABLE IF NOT EXISTS `backup_fabricante` AS SELECT * FROM `aerosuite`.`fabricante`;
CREATE TABLE IF NOT EXISTS `backup_perfil` AS SELECT * FROM `aerosuite`.`perfil`;
CREATE TABLE IF NOT EXISTS `backup_usuario` AS SELECT * FROM `aerosuite`.`usuario`;
CREATE TABLE IF NOT EXISTS `backup_fcu` AS SELECT * FROM `aerosuite`.`fcu`;
CREATE TABLE IF NOT EXISTS `backup_os` AS SELECT * FROM `aerosuite`.`os`;
CREATE TABLE IF NOT EXISTS `backup_product` AS SELECT * FROM `aerosuite`.`product`;
CREATE TABLE IF NOT EXISTS `backup_tipo_servico` AS SELECT * FROM `aerosuite`.`tipo_servico`;
CREATE TABLE IF NOT EXISTS `backup_associacao_fcu` AS SELECT * FROM `aerosuite`.`associacao_fcu`;

-- Verificar contagem de registros
SELECT 'fabricante' as tabela, COUNT(*) as registros FROM `backup_fabricante`
UNION ALL
SELECT 'perfil', COUNT(*) FROM `backup_perfil`
UNION ALL
SELECT 'usuario', COUNT(*) FROM `backup_usuario`
UNION ALL
SELECT 'fcu', COUNT(*) FROM `backup_fcu`
UNION ALL
SELECT 'os', COUNT(*) FROM `backup_os`
UNION ALL
SELECT 'product', COUNT(*) FROM `backup_product`
UNION ALL
SELECT 'tipo_servico', COUNT(*) FROM `backup_tipo_servico`
UNION ALL
SELECT 'associacao_fcu', COUNT(*) FROM `backup_associacao_fcu`;

