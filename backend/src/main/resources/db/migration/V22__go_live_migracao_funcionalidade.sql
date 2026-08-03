-- P4.3 Kit go-live / migração: funcionalidade na suite interna.

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Kit Go-live (30 dias)', 'Importação CSV e checklist de migração', 'GO_LIVE_MIGRACAO', 'pi pi-upload',
       '/go-live-migracao', 95, 'Administração', NULL, 'funcionalidade', TRUE, 95, TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'GO_LIVE_MIGRACAO');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'GO_LIVE_MIGRACAO'
  AND UPPER(p.codigo) IN ('ADMIN', 'ADMINISTRADOR', 'DIRETOR')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);
