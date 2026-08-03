-- Vitrine: seção de menu com uma funcionalidade por vídeo inicial.

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Visão Geral da Plataforma',
       'Vídeo institucional da experiência AeroSuite',
       'VITRINE_VISAO_GERAL',
       'pi pi-play',
       '/vitrine/visao-geral-plataforma',
       10,
       'Vitrine',
       NULL,
       'funcionalidade',
       TRUE,
       10,
       TRUE,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'VITRINE_VISAO_GERAL');

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Gestão de Estoque Passo a Passo',
       'Tutorial do módulo de estoque e rastreabilidade',
       'VITRINE_GESTAO_ESTOQUE',
       'pi pi-box',
       '/vitrine/gestao-estoque-passo-a-passo',
       20,
       'Vitrine',
       NULL,
       'funcionalidade',
       TRUE,
       20,
       TRUE,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'VITRINE_GESTAO_ESTOQUE');

-- Catálogo (lista todos os vídeos)
INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Vitrine de Vídeos',
       'Catálogo de vídeos demonstrativos da plataforma',
       'VITRINE',
       'pi pi-video',
       '/vitrine',
       5,
       'Vitrine',
       NULL,
       'funcionalidade',
       TRUE,
       5,
       TRUE,
       NOW(),
       NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'VITRINE');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo IN ('VITRINE', 'VITRINE_VISAO_GERAL', 'VITRINE_GESTAO_ESTOQUE')
  AND UPPER(p.codigo) IN ('ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'GERENTE')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);
