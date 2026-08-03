-- =====================================================
-- SCRIPT PARA ADICIONAR ESTOQUE NO MENU
-- Execute este script para adicionar o módulo Estoque
-- =====================================================

-- 1. Inserir funcionalidade principal do Estoque (se não existir)
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Estoque', 'Controle de Estoque e Rastreabilidade', 'ESTOQUE', 'pi pi-box', '/estoque', 50, 'Gestão', NULL, 'secao', TRUE, 50, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE');

-- 2. Obter ID do Estoque
SET @estoque_id = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE' LIMIT 1);

-- 3. Inserir submenus do Estoque
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Dashboard Estoque', 'Visão geral do estoque', 'ESTOQUE_DASHBOARD', 'pi pi-chart-bar', '/estoque/dashboard', 0, 'Estoque', @estoque_id, 'funcionalidade', TRUE, 0, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_DASHBOARD');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Fornecedores', 'Cadastro de Fornecedores', 'ESTOQUE_FORNECEDORES', 'pi pi-truck', '/estoque/fornecedores', 1, 'Estoque', @estoque_id, 'funcionalidade', TRUE, 1, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_FORNECEDORES');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Invoices', 'Documentos de Importação', 'ESTOQUE_INVOICES', 'pi pi-file-import', '/estoque/invoices', 2, 'Estoque', @estoque_id, 'funcionalidade', TRUE, 2, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_INVOICES');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Lotes', 'Controle de Lotes', 'ESTOQUE_LOTES', 'pi pi-th-large', '/estoque/lotes', 3, 'Estoque', @estoque_id, 'funcionalidade', TRUE, 3, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_LOTES');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Itens em Estoque', 'Produtos em Estoque', 'ESTOQUE_ITENS', 'pi pi-list', '/estoque/itens', 4, 'Estoque', @estoque_id, 'funcionalidade', TRUE, 4, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_ITENS');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Movimentações', 'Histórico de Movimentações', 'ESTOQUE_MOVIMENTACOES', 'pi pi-history', '/estoque/movimentacoes', 5, 'Estoque', @estoque_id, 'funcionalidade', TRUE, 5, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_MOVIMENTACOES');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Entrada de Mercadoria', 'Registrar Entrada', 'ESTOQUE_ENTRADA', 'pi pi-sign-in', '/estoque/entrada', 6, 'Estoque', @estoque_id, 'funcionalidade', TRUE, 6, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_ENTRADA');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Consulta por QR Code', 'Escanear QR Code', 'ESTOQUE_QR', 'pi pi-qrcode', '/estoque/consulta-qr', 7, 'Estoque', @estoque_id, 'funcionalidade', TRUE, 7, TRUE, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_QR');

-- 4. Associar funcionalidades ao perfil ADMIN (ID 1) ou a todos os perfis
-- Ajuste o ID do perfil conforme necessário

-- Obter IDs das funcionalidades de estoque
SET @func_estoque = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE');
SET @func_dashboard = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE_DASHBOARD');
SET @func_fornecedores = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE_FORNECEDORES');
SET @func_invoices = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE_INVOICES');
SET @func_lotes = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE_LOTES');
SET @func_itens = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE_ITENS');
SET @func_movimentacoes = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE_MOVIMENTACOES');
SET @func_entrada = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE_ENTRADA');
SET @func_qr = (SELECT id FROM funcionalidade WHERE codigo = 'ESTOQUE_QR');

-- Associar ao perfil ADMIN (geralmente ID 1 ou 13)
-- Verificar qual é o ID do perfil admin no seu sistema

-- Para perfil ID 1 (se existir)
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_estoque);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_dashboard);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_fornecedores);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_invoices);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_lotes);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_itens);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_movimentacoes);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_entrada);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (1, @func_qr);

-- Para perfil ID 13 (se for o admin no seu sistema)
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_estoque);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_dashboard);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_fornecedores);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_invoices);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_lotes);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_itens);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_movimentacoes);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_entrada);
INSERT IGNORE INTO perfil_funcionalidade (perfil_id, funcionalidade_id) VALUES (13, @func_qr);

-- 5. Verificar resultado
SELECT 'Funcionalidades de Estoque adicionadas com sucesso!' AS resultado;

SELECT f.id, f.nome, f.codigo, f.rota, f.secao 
FROM funcionalidade f 
WHERE f.codigo LIKE 'ESTOQUE%' 
ORDER BY f.posicao;
