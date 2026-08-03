-- =====================================================
-- Script para adicionar campos de custos adicionais
-- na tabela proposta_comercial
-- Aero Suite - Sistema de Propostas Comerciais
-- Compatível com MySQL 5.7+
-- =====================================================

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Procedimento para adicionar colunas de forma segura
DELIMITER //

DROP PROCEDURE IF EXISTS add_proposta_columns//

CREATE PROCEDURE add_proposta_columns()
BEGIN
    -- Adicionar frete_brl se não existir
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_comercial' 
        AND COLUMN_NAME = 'frete_brl'
    ) THEN
        ALTER TABLE proposta_comercial ADD COLUMN frete_brl DECIMAL(15,2) DEFAULT NULL COMMENT 'Valor do frete em Reais';
    END IF;

    -- Adicionar mao_de_obra_brl se não existir
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_comercial' 
        AND COLUMN_NAME = 'mao_de_obra_brl'
    ) THEN
        ALTER TABLE proposta_comercial ADD COLUMN mao_de_obra_brl DECIMAL(15,2) DEFAULT NULL COMMENT 'Valor da mão de obra em Reais';
    END IF;

    -- Adicionar cotacao_dolar se não existir
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_comercial' 
        AND COLUMN_NAME = 'cotacao_dolar'
    ) THEN
        ALTER TABLE proposta_comercial ADD COLUMN cotacao_dolar DECIMAL(10,4) DEFAULT NULL COMMENT 'Cotação do dólar usada na conversão';
    END IF;

    -- Adicionar data_cotacao se não existir
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_comercial' 
        AND COLUMN_NAME = 'data_cotacao'
    ) THEN
        ALTER TABLE proposta_comercial ADD COLUMN data_cotacao DATETIME DEFAULT NULL COMMENT 'Data/hora da cotação do dólar';
    END IF;

    -- Adicionar frete_usd se não existir
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_comercial' 
        AND COLUMN_NAME = 'frete_usd'
    ) THEN
        ALTER TABLE proposta_comercial ADD COLUMN frete_usd DECIMAL(15,2) DEFAULT NULL COMMENT 'Frete convertido para USD';
    END IF;

    -- Adicionar mao_de_obra_usd se não existir
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_comercial' 
        AND COLUMN_NAME = 'mao_de_obra_usd'
    ) THEN
        ALTER TABLE proposta_comercial ADD COLUMN mao_de_obra_usd DECIMAL(15,2) DEFAULT NULL COMMENT 'Mão de obra convertida para USD';
    END IF;

    -- Adicionar subtotal_produtos_usd se não existir
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_comercial' 
        AND COLUMN_NAME = 'subtotal_produtos_usd'
    ) THEN
        ALTER TABLE proposta_comercial ADD COLUMN subtotal_produtos_usd DECIMAL(15,2) DEFAULT NULL COMMENT 'Subtotal dos produtos em USD';
    END IF;

    -- Adicionar total_geral_usd se não existir
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'proposta_comercial' 
        AND COLUMN_NAME = 'total_geral_usd'
    ) THEN
        ALTER TABLE proposta_comercial ADD COLUMN total_geral_usd DECIMAL(15,2) DEFAULT NULL COMMENT 'Total geral final em USD';
    END IF;

END//

DELIMITER ;

-- Executar o procedimento
CALL add_proposta_columns();

-- Remover o procedimento após uso
DROP PROCEDURE IF EXISTS add_proposta_columns;

-- Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Verificação
-- =====================================================
SELECT 'Colunas adicionadas com sucesso!' as resultado;

SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'proposta_comercial'
AND COLUMN_NAME IN ('frete_brl', 'mao_de_obra_brl', 'cotacao_dolar', 'data_cotacao', 'frete_usd', 'mao_de_obra_usd', 'subtotal_produtos_usd', 'total_geral_usd');
