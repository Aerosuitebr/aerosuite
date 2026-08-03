-- ========================================
-- SCRIPT DE ATUALIZAÇÃO - FCU para Produto Aeronáutico
-- ========================================
-- Este script atualiza os nomes das funcionalidades no menu lateral
-- Substituindo "FCU" por "Produto Aeronáutico"
-- ========================================

-- Atualizar funcionalidade "FCU" para "Produto Aeronáutico"
UPDATE funcionalidade 
SET nome = 'Produto Aeronáutico',
    descricao = 'Gerenciar Produtos Aeronáuticos',
    updated_at = NOW()
WHERE codigo = 'FCU';

-- Atualizar funcionalidade "Editor de Documentos" - descrição
UPDATE funcionalidade 
SET descricao = 'Editor de Documentos de Montagem de Produto Aeronáutico',
    updated_at = NOW()
WHERE codigo = 'EDITOR_DOCUMENTOS' OR codigo = 'FCU_ASSEMBLY';

-- Atualizar funcionalidade "FCU Assembly" para "Editor de Documentos" (se existir)
UPDATE funcionalidade 
SET nome = 'Editor de Documentos',
    descricao = 'Editor de Documentos de Montagem de Produto Aeronáutico',
    updated_at = NOW()
WHERE codigo = 'FCU_ASSEMBLY';

-- Atualizar funcionalidade "Associação FCU" para "Definir Associação"
UPDATE funcionalidade 
SET nome = 'Definir Associação',
    descricao = 'Associar Produtos Aeronáuticos com produtos',
    updated_at = NOW()
WHERE codigo = 'ASSOCIACAO_FCU';

-- Verificar alterações
SELECT id, nome, descricao, codigo, rota 
FROM funcionalidade 
WHERE codigo IN ('FCU', 'EDITOR_DOCUMENTOS', 'FCU_ASSEMBLY', 'ASSOCIACAO_FCU')
ORDER BY id;

-- Mensagem de conclusão
SELECT 'ATUALIZAÇÃO CONCLUÍDA: FCU -> Produto Aeronáutico' as status;
