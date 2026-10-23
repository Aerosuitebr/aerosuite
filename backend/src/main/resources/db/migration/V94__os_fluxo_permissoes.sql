INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Painel de fluxo de OS', 'Painel de fluxo de OS', 'OS_FLUXO_PAINEL', 'pi pi-chart-line', '/os/fluxo', 101, 'Oficina', 'funcionalidade', TRUE, 101, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'OS_FLUXO_PAINEL');
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Estação de leitura de OS', 'Estação de leitura de OS', 'OS_FLUXO_ESTACAO', 'pi pi-barcode', '/os/fluxo/estacao', 102, 'Oficina', 'funcionalidade', TRUE, 102, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'OS_FLUXO_ESTACAO');
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Ajustes do fluxo de OS', 'Ajustes do fluxo de OS', 'OS_FLUXO_AJUSTE', 'pi pi-sliders-h', '/os/fluxo/ajuste', 103, 'Oficina', 'funcionalidade', TRUE, 103, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'OS_FLUXO_AJUSTE');
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Códigos e etiquetas de OS', 'Códigos e etiquetas de OS', 'OS_FLUXO_CODIGOS', 'pi pi-print', '/os/fluxo/codigos', 104, 'Oficina', 'funcionalidade', TRUE, 104, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'OS_FLUXO_CODIGOS');
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Gestão de estações', 'Gestão de estações', 'OS_FLUXO_ESTACOES', 'pi pi-desktop', '/os/fluxo/estacoes', 105, 'Oficina', 'funcionalidade', TRUE, 105, TRUE, NOW(), NOW()
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'OS_FLUXO_ESTACOES');
INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id FROM perfil p CROSS JOIN funcionalidade f
WHERE f.codigo IN ('OS_FLUXO_PAINEL','OS_FLUXO_ESTACAO','OS_FLUXO_AJUSTE','OS_FLUXO_CODIGOS','OS_FLUXO_ESTACOES')
AND UPPER(p.codigo) IN ('ADMIN','ADMINISTRADOR','DIRETOR','COORDENADOR')
AND NOT EXISTS (SELECT 1 FROM perfil_funcionalidade pf WHERE pf.perfil_id=p.id AND pf.funcionalidade_id=f.id);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id FROM perfil p CROSS JOIN funcionalidade f
WHERE f.codigo IN ('OS_FLUXO_ESTACAO','OS_FLUXO_CODIGOS') AND UPPER(p.codigo)='MECANICO'
AND NOT EXISTS (SELECT 1 FROM perfil_funcionalidade pf WHERE pf.perfil_id=p.id AND pf.funcionalidade_id=f.id);