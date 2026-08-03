-- A4 — Perfis Part 145 + funcionalidade CRS_EMITIR (segregação execução vs liberação).

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Emitir CRS',
       'Liberação para serviço (CRS) — independente da execução na OS',
       'CRS_EMITIR',
       'pi pi-verified',
       NULL,
       97,
       'Manutenção',
       NULL,
       'funcionalidade',
       FALSE,
       97,
       TRUE,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'CRS_EMITIR');

-- Perfis regulados (papéis típicos Part 145 / MRO SME)
INSERT INTO perfil (nome, descricao, codigo, ativo, created_at, updated_at)
SELECT 'Part 145 — Responsável técnico',
       'Gestão de manutenção, CRS e dossiê; sem administração de acessos',
       'P145_RT',
       1,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM perfil WHERE codigo = 'P145_RT');

INSERT INTO perfil (nome, descricao, codigo, ativo, created_at, updated_at)
SELECT 'Part 145 — Inspetor / qualidade',
       'Inspeção independente, emissão de CRS e dossiê de auditoria',
       'P145_INSPETOR',
       1,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM perfil WHERE codigo = 'P145_INSPETOR');

INSERT INTO perfil (nome, descricao, codigo, ativo, created_at, updated_at)
SELECT 'Part 145 — Execução (mecânico)',
       'Ordem de serviço e consumo de peças; não emite CRS',
       'P145_EXECUCAO',
       1,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM perfil WHERE codigo = 'P145_EXECUCAO');

INSERT INTO perfil (nome, descricao, codigo, ativo, created_at, updated_at)
SELECT 'Part 145 — Almoxarifado',
       'Estoque aeronáutico e rastreio; sem OS nem CRS',
       'P145_ALMOX',
       1,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM perfil WHERE codigo = 'P145_ALMOX');

INSERT INTO perfil (nome, descricao, codigo, ativo, created_at, updated_at)
SELECT 'Part 145 — Comercial',
       'Propostas comerciais e clientes; sem OS operacional',
       'P145_COMERCIAL',
       1,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM perfil WHERE codigo = 'P145_COMERCIAL');

-- CRS_EMITIR: perfis de gestão / inspeção existentes + novos Part 145
INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'CRS_EMITIR'
  AND UPPER(p.codigo) IN (
                           'ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'QUALIDADE',
                           'P145_RT', 'P145_INSPETOR'
    )
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

-- P145_EXECUCAO: mesmo conjunto operacional que OPERADOR (sem CRS)
INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p_exec.id, pf.funcionalidade_id
FROM perfil p_op
         JOIN perfil_funcionalidade pf ON pf.perfil_id = p_op.id
         JOIN perfil p_exec ON p_exec.codigo = 'P145_EXECUCAO'
WHERE p_op.codigo = 'OPERADOR'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = p_exec.id AND x.funcionalidade_id = pf.funcionalidade_id
);

-- P145_RT: operacional + CRS + dossiê (se ainda não herdou de OPERADOR)
INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p_rt.id, pf.funcionalidade_id
FROM perfil p_op
         JOIN perfil_funcionalidade pf ON pf.perfil_id = p_op.id
         JOIN perfil p_rt ON p_rt.codigo = 'P145_RT'
WHERE p_op.codigo = 'OPERADOR'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = p_rt.id AND x.funcionalidade_id = pf.funcionalidade_id
);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE p.codigo = 'P145_RT'
  AND f.codigo IN ('CRS_EMITIR', 'DOSSIE_AUDITORIA')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

-- P145_INSPETOR: OS, consulta, dossiê, CRS, dashboard
INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE p.codigo = 'P145_INSPETOR'
  AND f.codigo IN (
                   'DASHBOARD', 'ORDEM_SERVICO', 'CONSULTA_TROCAS_EVENTUAIS',
                   'DOSSIE_AUDITORIA', 'CRS_EMITIR'
    )
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

-- P145_ALMOX: família ESTOQUE + dashboard
INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE p.codigo = 'P145_ALMOX'
  AND (f.codigo = 'DASHBOARD' OR f.codigo LIKE 'ESTOQUE%')
  AND f.ativo = 1
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

-- P145_COMERCIAL: propostas + dashboard
INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE p.codigo = 'P145_COMERCIAL'
  AND f.codigo IN ('DASHBOARD', 'propostas-comerciais')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);
