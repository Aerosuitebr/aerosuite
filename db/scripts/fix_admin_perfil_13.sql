-- ===========================================
-- CORREÇÃO: O perfil Administrador tem ID = 13
-- ===========================================

-- Associar TODAS as funcionalidades ativas ao perfil ID=13
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 13, id FROM funcionalidade WHERE ativo = 1;

-- Verificar quantas funcionalidades foram associadas
SELECT 
    p.nome AS perfil,
    p.id AS perfil_id,
    COUNT(pf.funcionalidade_id) AS total_funcionalidades
FROM perfil p
LEFT JOIN perfil_funcionalidade pf ON p.id = pf.perfil_id
WHERE p.id = 13
GROUP BY p.id, p.nome;

-- Listar todas as funcionalidades do perfil 13
SELECT f.nome, f.codigo, f.secao, f.rota
FROM perfil_funcionalidade pf
JOIN funcionalidade f ON f.id = pf.funcionalidade_id
WHERE pf.perfil_id = 13 AND f.ativo = 1
ORDER BY f.secao, f.ordem;
