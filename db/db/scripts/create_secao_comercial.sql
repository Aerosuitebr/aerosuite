-- ===========================================
-- Script para criar a Seção COMERCIAL
-- e suas funcionalidades
-- ===========================================

-- ===========================================
-- 1. CRIAR FUNCIONALIDADES DA SEÇÃO COMERCIAL
-- ===========================================

-- Funcionalidade: Propostas Comerciais
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Propostas Comerciais', 'Criar e gerenciar propostas comerciais para clientes', 'propostas-comerciais', 'pi pi-file-edit', '/propostas-comerciais', 1, 'Comercial', 'funcionalidade', TRUE, 1, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'propostas-comerciais');

-- Funcionalidade: Templates de Produto/Serviço
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Templates de Proposta', 'Gerenciar templates de produtos e serviços para propostas', 'templates-proposta', 'pi pi-th-large', '/templates-proposta', 2, 'Comercial', 'funcionalidade', TRUE, 2, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'templates-proposta');

-- ===========================================
-- 2. ASSOCIAR FUNCIONALIDADES AO PERFIL DE ADMINISTRADOR
-- ===========================================

-- Obter ID do perfil Administrador (geralmente código 'admin' ou 'administrador' ou id=1)
SET @admin_perfil_id = (SELECT id FROM perfil WHERE codigo IN ('admin', 'administrador', 'ADMIN', 'ADMINISTRADOR') OR nome LIKE '%Administrador%' LIMIT 1);

-- Se não encontrou por código, usar id = 1 como fallback
SET @admin_perfil_id = COALESCE(@admin_perfil_id, 1);

-- Obter IDs das funcionalidades criadas
SET @func_propostas_id = (SELECT id FROM funcionalidade WHERE codigo = 'propostas-comerciais');
SET @func_templates_id = (SELECT id FROM funcionalidade WHERE codigo = 'templates-proposta');

-- Associar Propostas Comerciais ao Administrador
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT @admin_perfil_id, @func_propostas_id
WHERE @admin_perfil_id IS NOT NULL AND @func_propostas_id IS NOT NULL;

-- Associar Templates de Proposta ao Administrador
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT @admin_perfil_id, @func_templates_id
WHERE @admin_perfil_id IS NOT NULL AND @func_templates_id IS NOT NULL;

-- ===========================================
-- 3. VERIFICAÇÃO E RESULTADO
-- ===========================================

-- Exibir funcionalidades criadas
SELECT 
    f.id,
    f.nome,
    f.codigo,
    f.secao,
    f.rota,
    f.icone,
    f.ativo
FROM funcionalidade f 
WHERE f.secao = 'Comercial';

-- Exibir associações criadas
SELECT 
    p.nome AS perfil,
    f.nome AS funcionalidade,
    f.secao
FROM perfil_funcionalidade pf
INNER JOIN perfil p ON p.id = pf.perfil_id
INNER JOIN funcionalidade f ON f.id = pf.funcionalidade_id
WHERE f.secao = 'Comercial';

SELECT 'Seção Comercial criada com sucesso!' AS resultado;
SELECT 'Funcionalidades associadas ao perfil Administrador!' AS resultado;
