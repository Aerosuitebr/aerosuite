-- B7 — Habilitações técnicas (mecânicos, inspetores, RT).

CREATE TABLE IF NOT EXISTS usuario_habilitacao_tecnica (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    usuario_id INT NOT NULL,
    tipo VARCHAR(32) NOT NULL COMMENT 'MECANICO, INSPETOR, RT, OUTRO',
    escopo VARCHAR(255) NULL COMMENT 'Aeronave, motor, ATA, etc.',
    identificador VARCHAR(120) NULL COMMENT 'Nº licença / certificado',
    emissor VARCHAR(120) NULL,
    data_emissao DATE NULL,
    data_validade DATE NULL,
    observacoes TEXT NULL,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_hab_tenant_usuario (tenant_id, usuario_id),
    INDEX idx_hab_validade (tenant_id, data_validade),
    INDEX idx_hab_tipo (tenant_id, tipo)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Habilitações técnicas', 'Licenças e qualificações de mecânicos e inspetores', 'HABILITACAO_TECNICA', 'pi pi-id-card',
       '/conformidade/habilitacoes', 98, 'Administração', NULL, 'funcionalidade', TRUE, 98, TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'HABILITACAO_TECNICA');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT p.id, f.id
FROM perfil p
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'HABILITACAO_TECNICA'
  AND UPPER(p.codigo) IN ('ADMIN', 'ADMINISTRADOR', 'DIRETOR', 'QUALIDADE', 'GERENTE', 'P145_RT', 'P145_INSPETOR')
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade pf
    WHERE pf.perfil_id = p.id AND pf.funcionalidade_id = f.id
);

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT pf.perfil_id, f.id
FROM perfil_funcionalidade pf
         JOIN funcionalidade fa ON fa.id = pf.funcionalidade_id AND fa.codigo = 'GERENCIAR_PERMISSOES'
         CROSS JOIN funcionalidade f
WHERE f.codigo = 'HABILITACAO_TECNICA'
  AND NOT EXISTS (
    SELECT 1 FROM perfil_funcionalidade x
    WHERE x.perfil_id = pf.perfil_id AND x.funcionalidade_id = f.id
);
