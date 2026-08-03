-- ===========================================
-- SCRIPT DE DIAGNÓSTICO E CORREÇÃO
-- Associar TODAS as funcionalidades ao perfil Administrador
-- ===========================================

-- 1. DIAGNÓSTICO: Ver todos os perfis
SELECT '=== PERFIS EXISTENTES ===' AS info;
SELECT id, nome, codigo, ativo FROM perfil;

-- 2. DIAGNÓSTICO: Ver todas as funcionalidades
SELECT '=== FUNCIONALIDADES EXISTENTES ===' AS info;
SELECT id, nome, codigo, secao, rota, ativo FROM funcionalidade WHERE ativo = 1 ORDER BY secao, ordem;

-- 3. DIAGNÓSTICO: Ver associações atuais
SELECT '=== ASSOCIAÇÕES ATUAIS ===' AS info;
SELECT 
    p.id AS perfil_id,
    p.nome AS perfil_nome,
    f.id AS func_id,
    f.nome AS func_nome,
    f.secao,
    f.rota
FROM perfil_funcionalidade pf
JOIN perfil p ON p.id = pf.perfil_id
JOIN funcionalidade f ON f.id = pf.funcionalidade_id
ORDER BY p.id, f.secao, f.ordem;

-- 4. CORREÇÃO: Associar TODAS as funcionalidades ativas ao perfil ID=1 (Administrador)
-- Primeiro, vamos limpar e recriar para garantir
SELECT '=== APLICANDO CORREÇÃO ===' AS info;

-- Inserir todas as funcionalidades ativas para o perfil 1
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT 1, id FROM funcionalidade WHERE ativo = 1;

-- 5. VERIFICAR RESULTADO
SELECT '=== VERIFICAÇÃO FINAL ===' AS info;
SELECT 
    p.nome AS perfil,
    COUNT(pf.funcionalidade_id) AS total_funcionalidades
FROM perfil p
LEFT JOIN perfil_funcionalidade pf ON p.id = pf.perfil_id
GROUP BY p.id, p.nome;

-- 6. LISTAR FUNCIONALIDADES DO ADMIN
SELECT '=== FUNCIONALIDADES DO ADMINISTRADOR ===' AS info;
SELECT 
    f.nome,
    f.codigo,
    f.secao,
    f.rota
FROM perfil_funcionalidade pf
JOIN funcionalidade f ON f.id = pf.funcionalidade_id
WHERE pf.perfil_id = 1 AND f.ativo = 1
ORDER BY f.secao, f.ordem;
