-- ========================================
-- AEROSUITE - ADICIONAR FUNCIONALIDADE USUÁRIOS EXTERNOS
-- ========================================
-- Este script adiciona a funcionalidade de gerenciamento de usuários externos
-- ao menu administrativo do sistema interno
-- Data: 2026-01-06

SET NAMES utf8mb4;

-- Verificar se a funcionalidade já existe
SELECT @exists := COUNT(*) FROM funcionalidade WHERE codigo = 'usuarios-externos';

-- Inserir apenas se não existir
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, secao, ordem, posicao, tipo, visivel, ativo, created_at)
SELECT 
    'Usuários Externos',
    'Gerenciar usuários externos (clientes) e suas permissões de acesso',
    'usuarios-externos',
    'pi pi-user-plus',
    '/usuarios-externos',
    'Administração',
    10,
    10,
    'funcionalidade',
    1,
    1,
    NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'usuarios-externos');

-- Mostrar resultado
SELECT 
    id, 
    nome, 
    codigo, 
    icone, 
    rota, 
    secao,
    'FUNCIONALIDADE ADICIONADA' as status
FROM funcionalidade 
WHERE codigo = 'usuarios-externos';

-- ========================================
-- OPCIONAL: Atribuir a funcionalidade ao perfil Administrador (id = 1)
-- ========================================
-- Descomente as linhas abaixo se quiser atribuir automaticamente ao admin

-- INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
-- SELECT 1, f.id
-- FROM funcionalidade f
-- WHERE f.codigo = 'usuarios-externos'
-- AND NOT EXISTS (
--     SELECT 1 FROM perfil_funcionalidade pf 
--     WHERE pf.perfil_id = 1 AND pf.funcionalidade_id = f.id
-- );

-- SELECT 'Funcionalidade atribuída ao perfil Administrador' as resultado;
