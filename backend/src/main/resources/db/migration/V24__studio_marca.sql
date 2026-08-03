-- P5.1 Aero Studio: funcionalidade e histórico de renders.

CREATE TABLE IF NOT EXISTS studio_render_job (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id       VARCHAR(64)  NOT NULL,
    template_id     VARCHAR(64)  NOT NULL,
    status          VARCHAR(32)  NOT NULL DEFAULT 'COMPLETED',
    file_name       VARCHAR(255) NULL,
    parameters_json TEXT         NULL,
    created_by      INT          NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_studio_job_tenant (tenant_id),
    KEY idx_studio_job_created (created_at)
);

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Aero Studio', 'Materiais de marca para impressão', 'STUDIO_MARCA', 'pi pi-palette',
       '/studio', 97, 'Comercial', NULL, 'funcionalidade', TRUE, 97, TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'STUDIO_MARCA');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'STUDIO_MARCA'
  AND UPPER(p.codigo) IN ('ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'GERENTE')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT pf.perfil_id, f.id
FROM perfil_funcionalidade pf
         JOIN funcionalidade fa ON fa.id = pf.funcionalidade_id AND fa.codigo = 'CONFIGURACOES'
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'STUDIO_MARCA'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = pf.perfil_id AND x.funcionalidade_id = f.id
);
