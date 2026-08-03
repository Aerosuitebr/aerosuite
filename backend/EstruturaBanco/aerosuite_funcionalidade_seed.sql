-- ========================================
-- SCRIPT DE SEED PARA FUNCIONALIDADES
-- ========================================

-- Limpar dados existentes (manter apenas se necessário)
-- DELETE FROM funcionalidade;

-- ========================================
-- SEÇÃO: PRINCIPAL
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao, created_at, updated_at) VALUES
('Dashboard', 'Página inicial do sistema', 'DASHBOARD', 'pi pi-home', '/', 1, TRUE, 'Principal', 'funcionalidade', TRUE, '#0ea5e9', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    icone = VALUES(icone),
    rota = VALUES(rota),
    secao = VALUES(secao),
    tipo = VALUES(tipo),
    visivel = VALUES(visivel),
    cor_icone = VALUES(cor_icone),
    posicao = VALUES(posicao),
    updated_at = NOW();

-- ========================================
-- SEÇÃO: DOCUMENTOS
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao, created_at, updated_at) VALUES
('Editor de Documentos', 'Editor de Documentos de Montagem FCU', 'EDITOR_DOCUMENTOS', 'pi pi-cog', '/fcu-assembly', 2, TRUE, 'Documentos', 'funcionalidade', TRUE, '#8b5cf6', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    icone = VALUES(icone),
    rota = VALUES(rota),
    secao = VALUES(secao),
    tipo = VALUES(tipo),
    visivel = VALUES(visivel),
    cor_icone = VALUES(cor_icone),
    posicao = VALUES(posicao),
    updated_at = NOW();

-- ========================================
-- SEÇÃO: CADASTRO
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao, created_at, updated_at) VALUES
('Produtos', 'Gerenciar produtos do sistema', 'PRODUTOS', 'pi pi-box', '/products', 3, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#10b981', 1, NOW(), NOW()),
('Fabricantes', 'Gerenciar fabricantes', 'FABRICANTES', 'pi pi-building', '/fabricantes', 4, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#f59e0b', 2, NOW(), NOW()),
('Tipos de Serviço', 'Gerenciar tipos de serviço', 'TIPOS_SERVICO', 'pi pi-cog', '/tipos-servico', 5, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#6366f1', 3, NOW(), NOW()),
('FCU', 'Gerenciar FCU - Flight Control Unit', 'FCU', 'pi pi-microchip', '/fcu', 6, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#ec4899', 4, NOW(), NOW()),
('Ordem de Serviço', 'Gerenciar Ordens de Serviço', 'ORDEM_SERVICO', 'pi pi-file-edit', '/os', 7, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#06b6d4', 5, NOW(), NOW()),
('Arquivos Tipo Serviço', 'Gerenciar arquivos de tipos de serviço', 'ARQUIVOS_TIPO_SERVICO', 'pi pi-file', '/tpfiles', 8, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#84cc16', 6, NOW(), NOW()),
('Usuários', 'Gerenciar usuários do sistema', 'USUARIOS', 'pi pi-users', '/usuarios', 9, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#ef4444', 7, NOW(), NOW()),
('Definir Associação', 'Associar FCUs com produtos', 'ASSOCIACAO_FCU', 'pi pi-link', '/associacao-fcu', 10, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#8b5cf6', 8, NOW(), NOW()),
('Consulta Troca Eventual', 'Listar OS com Solicitação de Troca Eventual; detalhe e status somente leitura', 'CONSULTA_TROCAS_EVENTUAIS', 'pi pi-search', '/os/consulta-trocas-eventuais', 11, TRUE, 'Cadastro', 'funcionalidade', TRUE, '#0284c7', 9, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    icone = VALUES(icone),
    rota = VALUES(rota),
    secao = VALUES(secao),
    tipo = VALUES(tipo),
    visivel = VALUES(visivel),
    cor_icone = VALUES(cor_icone),
    posicao = VALUES(posicao),
    updated_at = NOW();

-- ========================================
-- SEÇÃO: SISTEMA
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao, created_at, updated_at) VALUES
('Configurações', 'Configurações do sistema', 'CONFIGURACOES', 'pi pi-cog', '/test', 11, TRUE, 'Sistema', 'funcionalidade', TRUE, '#6b7280', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    icone = VALUES(icone),
    rota = VALUES(rota),
    secao = VALUES(secao),
    tipo = VALUES(tipo),
    visivel = VALUES(visivel),
    cor_icone = VALUES(cor_icone),
    posicao = VALUES(posicao),
    updated_at = NOW();

-- ========================================
-- SEÇÃO: CONTROLE DE ACESSO
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao, created_at, updated_at) VALUES
('Gerenciar Permissões', 'Gerenciar permissões de funcionalidades por perfil', 'GERENCIAR_PERMISSOES', 'pi pi-shield', '/controle-acesso', 12, TRUE, 'Controle de Acesso', 'funcionalidade', TRUE, '#dc2626', 1, NOW(), NOW()),
('Funcionalidades', 'Gerenciar funcionalidades do sistema', 'FUNCIONALIDADES', 'pi pi-list', '/funcionalidades', 13, TRUE, 'Controle de Acesso', 'funcionalidade', TRUE, '#059669', 2, NOW(), NOW()),
('Perfis', 'Gerenciar perfis de usuário', 'PERFIS', 'pi pi-id-card', '/perfis', 14, TRUE, 'Controle de Acesso', 'funcionalidade', TRUE, '#7c3aed', 3, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    icone = VALUES(icone),
    rota = VALUES(rota),
    secao = VALUES(secao),
    tipo = VALUES(tipo),
    visivel = VALUES(visivel),
    cor_icone = VALUES(cor_icone),
    posicao = VALUES(posicao),
    updated_at = NOW();

-- ========================================
-- SEÇÃO: AÇÕES RÁPIDAS
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao, created_at, updated_at) VALUES
('Novo Produto', 'Criar novo produto rapidamente', 'NOVO_PRODUTO', 'pi pi-plus', '/products/new', 15, TRUE, 'Ações Rápidas', 'funcionalidade', TRUE, '#10b981', 1, NOW(), NOW()),
('Relatório', 'Gerar relatórios do sistema', 'RELATORIO', 'pi pi-chart-bar', '/relatorios', 16, TRUE, 'Ações Rápidas', 'funcionalidade', TRUE, '#f59e0b', 2, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    icone = VALUES(icone),
    rota = VALUES(rota),
    secao = VALUES(secao),
    tipo = VALUES(tipo),
    visivel = VALUES(visivel),
    cor_icone = VALUES(cor_icone),
    posicao = VALUES(posicao),
    updated_at = NOW();

-- ========================================
-- FUNCIONALIDADES ADMINISTRATIVAS (não aparecem no menu)
-- ========================================
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, ativo, secao, tipo, visivel, cor_icone, posicao, created_at, updated_at) VALUES
('Visualizar Dashboard', 'Permissão para visualizar o dashboard', 'VIEW_DASHBOARD', 'pi pi-eye', '/', 17, TRUE, 'Sistema', 'funcionalidade', FALSE, '#6b7280', 1, NOW(), NOW()),
('Criar Produto', 'Permissão para criar produtos', 'CREATE_PRODUTO', 'pi pi-plus', '/products', 18, TRUE, 'Sistema', 'funcionalidade', FALSE, '#10b981', 2, NOW(), NOW()),
('Editar Produto', 'Permissão para editar produtos', 'EDIT_PRODUTO', 'pi pi-pencil', '/products', 19, TRUE, 'Sistema', 'funcionalidade', FALSE, '#f59e0b', 3, NOW(), NOW()),
('Excluir Produto', 'Permissão para excluir produtos', 'DELETE_PRODUTO', 'pi pi-trash', '/products', 20, TRUE, 'Sistema', 'funcionalidade', FALSE, '#ef4444', 4, NOW(), NOW()),
('Visualizar Produto', 'Permissão para visualizar produtos', 'VIEW_PRODUTO', 'pi pi-eye', '/products', 21, TRUE, 'Sistema', 'funcionalidade', FALSE, '#6366f1', 5, NOW(), NOW()),
('Criar Fabricante', 'Permissão para criar fabricantes', 'CREATE_FABRICANTE', 'pi pi-plus', '/fabricantes', 22, TRUE, 'Sistema', 'funcionalidade', FALSE, '#10b981', 6, NOW(), NOW()),
('Editar Fabricante', 'Permissão para editar fabricantes', 'EDIT_FABRICANTE', 'pi pi-pencil', '/fabricantes', 23, TRUE, 'Sistema', 'funcionalidade', FALSE, '#f59e0b', 7, NOW(), NOW()),
('Excluir Fabricante', 'Permissão para excluir fabricantes', 'DELETE_FABRICANTE', 'pi pi-trash', '/fabricantes', 24, TRUE, 'Sistema', 'funcionalidade', FALSE, '#ef4444', 8, NOW(), NOW()),
('Visualizar Fabricante', 'Permissão para visualizar fabricantes', 'VIEW_FABRICANTE', 'pi pi-eye', '/fabricantes', 25, TRUE, 'Sistema', 'funcionalidade', FALSE, '#6366f1', 9, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    descricao = VALUES(descricao),
    icone = VALUES(icone),
    rota = VALUES(rota),
    secao = VALUES(secao),
    tipo = VALUES(tipo),
    visivel = VALUES(visivel),
    cor_icone = VALUES(cor_icone),
    posicao = VALUES(posicao),
    updated_at = NOW();

-- Mesmos perfis que acessam "Ordem de Serviço" passam a ver "Consulta trocas eventuais" no menu
SET @fid_consulta_trocas := (SELECT id FROM funcionalidade WHERE codigo = 'CONSULTA_TROCAS_EVENTUAIS' LIMIT 1);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT DISTINCT pf.perfil_id, @fid_consulta_trocas
FROM perfil_funcionalidade pf
INNER JOIN funcionalidade f ON f.id = pf.funcionalidade_id AND f.codigo = 'ORDEM_SERVICO'
WHERE @fid_consulta_trocas IS NOT NULL;

-- ========================================
-- VERIFICAÇÃO DOS DADOS
-- ========================================
SELECT 
    'Funcionalidades por seção:' as info,
    secao,
    COUNT(*) as total_funcionalidades,
    GROUP_CONCAT(nome ORDER BY posicao SEPARATOR ', ') as funcionalidades
FROM funcionalidade 
WHERE visivel = TRUE
GROUP BY secao
ORDER BY secao;

SELECT 
    'Total de funcionalidades:' as info,
    COUNT(*) as total,
    COUNT(CASE WHEN visivel = TRUE THEN 1 END) as visiveis,
    COUNT(CASE WHEN visivel = FALSE THEN 1 END) as ocultas
FROM funcionalidade;
