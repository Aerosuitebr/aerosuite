-- Delegação modular: funcionalidades extra concedidas a um utilizador interno (além do perfil).
-- Integração: com.aerosuite.security.DelegacaoFuncionalidadePermissionSource

CREATE TABLE IF NOT EXISTS usuario_delegacao_funcionalidade (
    id BIGINT NOT NULL AUTO_INCREMENT,
    usuario_grantee_id INT NOT NULL COMMENT 'FK usuario.id que recebe a permissão',
    funcionalidade_codigo VARCHAR(80) NOT NULL COMMENT 'Código em funcionalidade.codigo',
    concedido_por_usuario_id INT NULL COMMENT 'FK usuario.id que concedeu (auditoria)',
    data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim DATETIME NULL COMMENT 'NULL = sem expiração',
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    observacao VARCHAR(500) NULL,
    created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_delegacao_grantee_ativo (usuario_grantee_id, ativo, data_fim),
    KEY idx_delegacao_codigo (funcionalidade_codigo),
    CONSTRAINT fk_delegacao_grantee FOREIGN KEY (usuario_grantee_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_delegacao_concedente FOREIGN KEY (concedido_por_usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
