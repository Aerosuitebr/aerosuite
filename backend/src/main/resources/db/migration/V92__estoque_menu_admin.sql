INSERT INTO funcionalidade (
    nome, descricao, codigo, icone, rota, ordem, secao,
    parent_id, tipo, visivel, posicao, ativo, created_at, updated_at
)
SELECT 'Dashboard Estoque', 'Visão geral do estoque', 'ESTOQUE_DASHBOARD',
       'pi pi-chart-bar', '/estoque/dashboard', 50, 'Estoque',
       NULL, 'funcionalidade', TRUE, 50, TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM funcionalidade WHERE codigo = 'ESTOQUE_DASHBOARD'
);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
CROSS JOIN funcionalidade f
WHERE p.codigo = 'ADMIN'
  AND f.codigo IN ('ESTOQUE_DASHBOARD', 'PARTS_FINDER_CONSULTAR')
  AND NOT EXISTS (
      SELECT 1
      FROM perfil_funcionalidade pf
      WHERE pf.perfil_id = p.id
        AND pf.funcionalidade_id = f.id
  );
