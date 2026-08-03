-- =====================================================
-- ADICIONAR CAMPO DE OBSERVAÇÃO AO TEMPLATE
-- Script para adicionar campo de observação padrão 
-- que será replicado para a proposta comercial
-- =====================================================

-- Adicionar coluna observacao_padrao à tabela template_produto_servico
ALTER TABLE template_produto_servico 
ADD COLUMN observacao_padrao VARCHAR(5000) 
COMMENT 'Observações padrão que serão copiadas para a proposta comercial';

-- Verificar se a coluna foi adicionada
SELECT 'Coluna observacao_padrao adicionada com sucesso!' AS resultado;
