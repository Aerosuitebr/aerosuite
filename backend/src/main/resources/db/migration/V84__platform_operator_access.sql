-- Acesso ao plano de controle (elevação de operador) — complementa PLATFORM_OPS_EMAILS.
CREATE TABLE platform_operator_access (
    usuario_id          INT          NOT NULL,
    ativo               TINYINT(1)   NOT NULL DEFAULT 1,
    granted_at          DATETIME     NOT NULL,
    granted_by_usuario_id INT        NULL,
    revoked_at          DATETIME     NULL,
    revoked_by_usuario_id INT        NULL,
    updated_at          DATETIME     NOT NULL,
    PRIMARY KEY (usuario_id),
    CONSTRAINT fk_poa_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_poa_granted_by FOREIGN KEY (granted_by_usuario_id) REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT fk_poa_revoked_by FOREIGN KEY (revoked_by_usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Operadores autorizados ao centro de fiscalização (além da lista de configuração)';

CREATE INDEX idx_poa_ativo ON platform_operator_access (ativo);
