-- Adiciona Biblioteca ao menu (acesso à tela de categorias/documentos).
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Biblioteca', 'Documentos por categorias', 'BIBLIOTECA', 'pi pi-book', '/biblioteca', 45, 'Gestão', NULL, 'funcionalidade', TRUE, 45, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'BIBLIOTECA');

-- Associar ao perfil Admin (id 13)
INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 13, f.id
FROM funcionalidade f
WHERE f.codigo = 'BIBLIOTECA'
  AND NOT EXISTS (SELECT 1 FROM perfil_funcionalidade pf WHERE pf.funcionalidade_id = f.id AND pf.perfil_id = 13)
LIMIT 1;
