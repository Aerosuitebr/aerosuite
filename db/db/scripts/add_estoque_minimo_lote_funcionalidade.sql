-- =====================================================
-- SCRIPT: Funcionalidade "Estoque Mínimo em Lote"
-- Importação de planilha CSV para atualizar estoque mínimo/ideal por Part Number
-- =====================================================

-- 1. Obter ID do Estoque (seção pai)
SET @estoque_id = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE' LIMIT 1);

-- 2. Inserir funcionalidade Estoque Mínimo (Lote) se não existir
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Estoque Mín. (Lote)', 'Importar planilha CSV para estoque mínimo/ideal', 'ESTOQUE_MINIMO_LOTE', 'pi pi-upload', '/estoque/estoque-minimo-lote', 8, 'Estoque', @estoque_id, 'funcionalidade', TRUE, 8, TRUE, NOW(), NOW()
WHERE @estoque_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_MINIMO_LOTE');

-- 3. Obter ID da nova funcionalidade
SET @func_minimo_lote = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE_MINIMO_LOTE' LIMIT 1);

-- 4. Associar ao perfil ADMIN (perfil_id 1)
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 1, id FROM funcionalidade WHERE codigo = 'ESTOQUE_MINIMO_LOTE' LIMIT 1;

-- 5. Associar ao perfil ID 13 (se for admin no ambiente)
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 13, id FROM funcionalidade WHERE codigo = 'ESTOQUE_MINIMO_LOTE' LIMIT 1;

-- 6. Verificação
SELECT 'Funcionalidade Estoque Mínimo (Lote) adicionada.' AS resultado;
SELECT id, nome, codigo, rota FROM funcionalidade WHERE codigo = 'ESTOQUE_MINIMO_LOTE';
