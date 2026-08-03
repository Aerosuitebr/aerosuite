-- Script SIMPLES para adicionar campos de assinatura na tabela proposta_comercial (MySQL)
-- Execute cada comando separadamente se houver erro (o campo já pode existir)

-- OPÇÃO 1: Execute tudo de uma vez (ignora erros se campo já existir)
-- Se der erro em algum, significa que o campo já existe

ALTER TABLE proposta_comercial ADD COLUMN assinatura_nome VARCHAR(200);
ALTER TABLE proposta_comercial ADD COLUMN assinatura_estilo VARCHAR(50);
ALTER TABLE proposta_comercial ADD COLUMN assinatura_font_family VARCHAR(100);
ALTER TABLE proposta_comercial ADD COLUMN assinatura_color VARCHAR(30);
ALTER TABLE proposta_comercial ADD COLUMN assinatura_timestamp DATETIME;

-- Verificar os campos adicionados
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'proposta_comercial' 
AND COLUMN_NAME LIKE 'assinatura%';
