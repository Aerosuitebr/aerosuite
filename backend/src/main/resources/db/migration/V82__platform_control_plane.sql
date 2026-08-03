-- Plano de controle da plataforma: perfis ocultos na gestão RBAC tenant.
ALTER TABLE perfil
    ADD COLUMN oculto TINYINT(1) NOT NULL DEFAULT 0
        COMMENT '1 = não listar na matriz RBAC do tenant';

-- Funcionalidades reservadas ao plano de controle (não atribuíveis via RBAC comum).
ALTER TABLE funcionalidade
    ADD COLUMN gestao_rbac TINYINT(1) NOT NULL DEFAULT 1
        COMMENT '0 = ocultar da matriz RBAC tenant';

INSERT IGNORE INTO perfil (nome, descricao, codigo, ativo, oculto, created_at, updated_at)
VALUES (
    'Operações de Plataforma',
    'Perfil reservado — atribuição manual; não aparece na gestão RBAC.',
    'PLATFORM_OPS',
    1,
    1,
    NOW(),
    NOW()
);
