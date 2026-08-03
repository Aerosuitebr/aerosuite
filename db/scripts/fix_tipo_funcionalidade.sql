-- ===========================================
-- CORREÇÃO: Atualizar campo 'tipo' vazio/nulo
-- nas funcionalidades para 'funcionalidade'
-- ===========================================

-- Ver quais registros têm tipo vazio ou nulo
SELECT id, nome, codigo, tipo FROM funcionalidade WHERE tipo IS NULL OR tipo = '';

-- Corrigir registros com tipo vazio ou nulo
UPDATE funcionalidade SET tipo = 'funcionalidade' WHERE tipo IS NULL OR tipo = '';

-- Verificar que todos têm valores válidos agora
SELECT id, nome, codigo, tipo, secao FROM funcionalidade ORDER BY secao, ordem;

-- Agora garantir associação ao perfil 13
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 13, id FROM funcionalidade WHERE ativo = 1;

-- Contar associações
SELECT COUNT(*) AS total_funcionalidades_admin FROM perfil_funcionalidade WHERE perfil_id = 13;
