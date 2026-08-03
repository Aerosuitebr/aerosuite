-- =====================================================
-- CORREÇÃO DA FUNCIONALIDADE CHAT NO MENU
-- Execute este script para corrigir o menu do Chat
-- =====================================================

-- Verificar estado atual
SELECT id, nome, codigo, rota, ativo FROM funcionalidade WHERE codigo = 'chat' OR nome LIKE '%Chat%';

-- Deletar funcionalidade existente (se houver problema)
DELETE FROM perfil_funcionalidade WHERE funcionalidade_id IN (SELECT id FROM funcionalidade WHERE codigo = 'chat');
DELETE FROM funcionalidade WHERE codigo = 'chat';

-- Inserir corretamente
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
VALUES ('Chat', 'Chat interno para comunicação entre usuários', 'chat', 'pi pi-comments', '/chat', 1, 'Comunicação', 'funcionalidade', TRUE, 800, TRUE, NOW(), NOW());

-- Associar a TODOS os perfis ativos
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id 
FROM perfil p, funcionalidade f 
WHERE p.ativo = 1 AND f.codigo = 'chat';

-- Verificar resultado
SELECT 'Funcionalidade Chat configurada!' as resultado;
SELECT f.id, f.nome, f.codigo, f.rota, f.ativo, COUNT(pf.perfil_id) as perfis_associados
FROM funcionalidade f
LEFT JOIN perfil_funcionalidade pf ON f.id = pf.funcionalidade_id
WHERE f.codigo = 'chat'
GROUP BY f.id;
