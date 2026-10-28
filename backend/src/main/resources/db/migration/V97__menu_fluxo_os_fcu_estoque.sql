-- Catálogo do fluxo: cadastro, ordem de serviço, oficina e estoque.
-- Insere o que o Flyway ainda não tinha e devolve seção, ordem e visibilidade.

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Fabricantes', 'Cadastro de fabricantes', 'FABRICANTES', 'pi pi-building', '/fabricantes', 10, 'Cadastro', 'funcionalidade', TRUE, 10, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'FABRICANTES');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Tipos de serviço', 'Cadastro de tipos de serviço', 'TIPOS_SERVICO', 'pi pi-wrench', '/tipos-servico', 20, 'Cadastro', 'funcionalidade', TRUE, 20, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'TIPOS_SERVICO');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Produtos', 'Cadastro de produtos', 'PRODUTOS', 'pi pi-box', '/products', 30, 'Cadastro', 'funcionalidade', TRUE, 30, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'PRODUTOS');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Produto aeronáutico', 'Cadastro de produto aeronáutico (FCU)', 'FCU', 'pi pi-microchip', '/fcu', 40, 'Cadastro', 'funcionalidade', TRUE, 40, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'FCU');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Associação FCU', 'Associar produto aeronáutico a produtos', 'ASSOCIACAO_FCU', 'pi pi-link', '/associacao-fcu', 50, 'Cadastro', 'funcionalidade', TRUE, 50, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ASSOCIACAO_FCU');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Ordem de serviço', 'Cadastro e consulta de ordens de serviço', 'ORDEM_SERVICO', 'pi pi-file-edit', '/os', 10, 'Ordem de serviço', 'funcionalidade', TRUE, 10, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ORDEM_SERVICO');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Consulta de trocas eventuais', 'OS com solicitação de troca eventual', 'CONSULTA_TROCAS_EVENTUAIS', 'pi pi-search', '/os/consulta-trocas-eventuais', 20, 'Ordem de serviço', 'funcionalidade', TRUE, 20, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'CONSULTA_TROCAS_EVENTUAIS');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Trocas pendentes', 'OS com trocas aguardando pagamento', 'OS_PENDENTES_TROCAS', 'pi pi-clock', '/os/pendentes-pagamento-trocas', 30, 'Ordem de serviço', 'funcionalidade', TRUE, 30, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'OS_PENDENTES_TROCAS');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Auditoria de OS', 'Trilha de auditoria das ordens de serviço', 'OS_AUDITORIA', 'pi pi-history', '/os-auditoria', 40, 'Ordem de serviço', 'funcionalidade', TRUE, 40, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'OS_AUDITORIA');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Painel de estoque', 'Visão do estoque', 'ESTOQUE_DASHBOARD', 'pi pi-chart-bar', '/estoque/dashboard', 10, 'Estoque', 'funcionalidade', TRUE, 10, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_DASHBOARD');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Fornecedores', 'Cadastro de fornecedores', 'ESTOQUE_FORNECEDORES', 'pi pi-truck', '/estoque/fornecedores', 20, 'Estoque', 'funcionalidade', TRUE, 20, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_FORNECEDORES');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Invoices', 'Invoices de importação', 'ESTOQUE_INVOICES', 'pi pi-file', '/estoque/invoices', 30, 'Estoque', 'funcionalidade', TRUE, 30, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_INVOICES');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Entrada de mercadoria', 'Recebimento no estoque', 'ESTOQUE_ENTRADA', 'pi pi-sign-in', '/estoque/entrada', 40, 'Estoque', 'funcionalidade', TRUE, 40, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_ENTRADA');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Itens de estoque', 'Posição dos itens', 'ESTOQUE_ITENS', 'pi pi-list', '/estoque/itens', 50, 'Estoque', 'funcionalidade', TRUE, 50, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_ITENS');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Lotes', 'Lotes de estoque', 'ESTOQUE_LOTES', 'pi pi-tags', '/estoque/lotes', 60, 'Estoque', 'funcionalidade', TRUE, 60, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_LOTES');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Estoque mínimo', 'Mínimo por lote', 'ESTOQUE_MINIMO_LOTE', 'pi pi-exclamation-triangle', '/estoque/estoque-minimo-lote', 70, 'Estoque', 'funcionalidade', TRUE, 70, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_MINIMO_LOTE');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Movimentações', 'Histórico de movimentações', 'ESTOQUE_MOVIMENTACOES', 'pi pi-arrows-h', '/estoque/movimentacoes', 80, 'Estoque', 'funcionalidade', TRUE, 80, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_MOVIMENTACOES');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Saídas de estoque', 'Baixa e saída de material', 'ESTOQUE_SAIDA', 'pi pi-sign-out', '/estoque/saidas', 90, 'Estoque', 'funcionalidade', TRUE, 90, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_SAIDA');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Quarentena', 'Itens em quarentena', 'ESTOQUE_QUARENTENA', 'pi pi-ban', '/estoque/quarentena', 100, 'Estoque', 'funcionalidade', TRUE, 100, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_QUARENTENA');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Consulta QR', 'Leitura de QR do estoque', 'ESTOQUE_QR', 'pi pi-qrcode', '/estoque/consulta-qr', 110, 'Estoque', 'funcionalidade', TRUE, 110, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_QR');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Rastreio de peça', 'Rastreio da peça no estoque', 'ESTOQUE_RASTREIO', 'pi pi-map-marker', '/estoque/rastreio', 120, 'Estoque', 'funcionalidade', TRUE, 120, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_RASTREIO');

UPDATE funcionalidade SET nome = 'Produto aeronáutico', secao = 'Cadastro', rota = '/fcu', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 40, ordem = 40, updated_at = NOW() WHERE codigo = 'FCU';
UPDATE funcionalidade SET secao = 'Cadastro', rota = '/fabricantes', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 10, ordem = 10, updated_at = NOW() WHERE codigo = 'FABRICANTES';
UPDATE funcionalidade SET secao = 'Cadastro', rota = '/tipos-servico', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 20, ordem = 20, updated_at = NOW() WHERE codigo = 'TIPOS_SERVICO';
UPDATE funcionalidade SET secao = 'Cadastro', rota = '/products', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 30, ordem = 30, updated_at = NOW() WHERE codigo = 'PRODUTOS';
UPDATE funcionalidade SET secao = 'Cadastro', rota = '/associacao-fcu', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 50, ordem = 50, updated_at = NOW() WHERE codigo = 'ASSOCIACAO_FCU';

UPDATE funcionalidade SET secao = 'Ordem de serviço', rota = '/os', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 10, ordem = 10, updated_at = NOW() WHERE codigo = 'ORDEM_SERVICO';
UPDATE funcionalidade SET secao = 'Ordem de serviço', rota = '/os/consulta-trocas-eventuais', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 20, ordem = 20, updated_at = NOW() WHERE codigo = 'CONSULTA_TROCAS_EVENTUAIS';
UPDATE funcionalidade SET secao = 'Ordem de serviço', rota = '/os/pendentes-pagamento-trocas', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 30, ordem = 30, updated_at = NOW() WHERE codigo = 'OS_PENDENTES_TROCAS';
UPDATE funcionalidade SET secao = 'Ordem de serviço', rota = '/os-auditoria', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 40, ordem = 40, updated_at = NOW() WHERE codigo = 'OS_AUDITORIA';

UPDATE funcionalidade SET secao = 'Oficina', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 10, ordem = 10, updated_at = NOW() WHERE codigo = 'OS_FLUXO_PAINEL';
UPDATE funcionalidade SET secao = 'Oficina', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 20, ordem = 20, updated_at = NOW() WHERE codigo = 'OS_FLUXO_ESTACAO';
UPDATE funcionalidade SET secao = 'Oficina', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 30, ordem = 30, updated_at = NOW() WHERE codigo = 'OS_FLUXO_ESTACOES';
UPDATE funcionalidade SET secao = 'Oficina', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 40, ordem = 40, updated_at = NOW() WHERE codigo = 'OS_FLUXO_CODIGOS';
UPDATE funcionalidade SET secao = 'Oficina', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 50, ordem = 50, updated_at = NOW() WHERE codigo = 'OS_FLUXO_AJUSTE';

UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/dashboard', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 10, ordem = 10, updated_at = NOW() WHERE codigo = 'ESTOQUE_DASHBOARD';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/fornecedores', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 20, ordem = 20, updated_at = NOW() WHERE codigo = 'ESTOQUE_FORNECEDORES';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/invoices', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 30, ordem = 30, updated_at = NOW() WHERE codigo = 'ESTOQUE_INVOICES';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/entrada', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 40, ordem = 40, updated_at = NOW() WHERE codigo = 'ESTOQUE_ENTRADA';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/itens', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 50, ordem = 50, updated_at = NOW() WHERE codigo = 'ESTOQUE_ITENS';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/lotes', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 60, ordem = 60, updated_at = NOW() WHERE codigo = 'ESTOQUE_LOTES';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/estoque-minimo-lote', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 70, ordem = 70, updated_at = NOW() WHERE codigo = 'ESTOQUE_MINIMO_LOTE';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/movimentacoes', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 80, ordem = 80, updated_at = NOW() WHERE codigo = 'ESTOQUE_MOVIMENTACOES';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/saidas', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 90, ordem = 90, updated_at = NOW() WHERE codigo = 'ESTOQUE_SAIDA';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/quarentena', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 100, ordem = 100, updated_at = NOW() WHERE codigo = 'ESTOQUE_QUARENTENA';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/consulta-qr', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 110, ordem = 110, updated_at = NOW() WHERE codigo = 'ESTOQUE_QR';
UPDATE funcionalidade SET secao = 'Estoque', rota = '/estoque/rastreio', visivel = TRUE, ativo = TRUE, tipo = 'funcionalidade', posicao = 120, ordem = 120, updated_at = NOW() WHERE codigo = 'ESTOQUE_RASTREIO';

-- Pai antigo do estoque é seção e o menu o ignora. Os filhos acima é que aparecem.
UPDATE funcionalidade SET visivel = FALSE, updated_at = NOW() WHERE codigo = 'ESTOQUE' AND tipo = 'secao';

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
CROSS JOIN funcionalidade f
WHERE f.codigo IN (
    'FABRICANTES', 'TIPOS_SERVICO', 'PRODUTOS', 'FCU', 'ASSOCIACAO_FCU',
    'ORDEM_SERVICO', 'CONSULTA_TROCAS_EVENTUAIS', 'OS_PENDENTES_TROCAS', 'OS_AUDITORIA',
    'OS_FLUXO_PAINEL', 'OS_FLUXO_ESTACAO', 'OS_FLUXO_ESTACOES', 'OS_FLUXO_CODIGOS', 'OS_FLUXO_AJUSTE',
    'ESTOQUE_DASHBOARD', 'ESTOQUE_FORNECEDORES', 'ESTOQUE_INVOICES', 'ESTOQUE_ENTRADA',
    'ESTOQUE_ITENS', 'ESTOQUE_LOTES', 'ESTOQUE_MINIMO_LOTE', 'ESTOQUE_MOVIMENTACOES',
    'ESTOQUE_SAIDA', 'ESTOQUE_QUARENTENA', 'ESTOQUE_QR', 'ESTOQUE_RASTREIO'
)
AND (
    UPPER(p.codigo) IN ('ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'COORDENADOR', 'GERENTE')
    OR p.id IN (1, 13)
)
AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT src.perfil_id, src.func_id
FROM (
    SELECT DISTINCT pf.perfil_id AS perfil_id, f.id AS func_id
    FROM perfil_funcionalidade pf
    JOIN funcionalidade ja ON ja.id = pf.funcionalidade_id
        AND ja.codigo IN ('FUNCIONALIDADES', 'GERENCIAR_PERMISSOES')
    JOIN funcionalidade f ON f.codigo IN (
        'FABRICANTES', 'TIPOS_SERVICO', 'PRODUTOS', 'FCU', 'ASSOCIACAO_FCU',
        'ORDEM_SERVICO', 'CONSULTA_TROCAS_EVENTUAIS', 'OS_PENDENTES_TROCAS', 'OS_AUDITORIA',
        'OS_FLUXO_PAINEL', 'OS_FLUXO_ESTACAO', 'OS_FLUXO_ESTACOES', 'OS_FLUXO_CODIGOS', 'OS_FLUXO_AJUSTE',
        'ESTOQUE_DASHBOARD', 'ESTOQUE_FORNECEDORES', 'ESTOQUE_INVOICES', 'ESTOQUE_ENTRADA',
        'ESTOQUE_ITENS', 'ESTOQUE_LOTES', 'ESTOQUE_MINIMO_LOTE', 'ESTOQUE_MOVIMENTACOES',
        'ESTOQUE_SAIDA', 'ESTOQUE_QUARENTENA', 'ESTOQUE_QR', 'ESTOQUE_RASTREIO'
    )
) src
WHERE NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf2
    WHERE pf2.perfil_id = src.perfil_id AND pf2.funcionalidade_id = src.func_id
);
