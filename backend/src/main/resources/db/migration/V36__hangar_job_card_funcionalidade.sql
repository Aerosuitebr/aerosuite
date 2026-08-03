-- B5 complemento — funcionalidade de menu para Hangar (job card).

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Hangar (job card)', 'Apontamentos e assinaturas de execução no hangar', 'HANGAR_JOB_CARD', 'pi pi-mobile',
       '/hangar', 96, 'Operacional', NULL, 'funcionalidade', TRUE, 96, TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'HANGAR_JOB_CARD');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'HANGAR_JOB_CARD'
  AND UPPER(p.codigo) IN (
        'ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'QUALIDADE',
        'P145_RT', 'P145_INSPETOR', 'P145_EXECUCAO', 'OPERADOR', 'GERENCIAR_PERMISSOES')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT pf.perfil_id, f.id
FROM perfil_funcionalidade pf
         JOIN funcionalidade fa ON fa.id = pf.funcionalidade_id AND fa.codigo = 'ORDEM_SERVICO'
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'HANGAR_JOB_CARD'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = pf.perfil_id AND x.funcionalidade_id = f.id);
