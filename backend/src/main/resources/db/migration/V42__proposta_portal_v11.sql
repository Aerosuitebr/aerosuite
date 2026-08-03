-- P4.2 v1.1 — aditivos e anexos no portal do cliente.

CREATE TABLE proposta_comercial_aditivo (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id                   BIGINT         NOT NULL DEFAULT 1,
    proposta_id                 BIGINT         NOT NULL,
    descricao                   TEXT           NOT NULL,
    valor                       DECIMAL(15, 2) NULL,
    status                      VARCHAR(30)    NOT NULL DEFAULT 'PENDENTE',
    solicitado_por_externo_id   INT            NULL,
    cliente_decisao_em          DATETIME       NULL,
    cliente_decisao_motivo      TEXT           NULL,
    created_at                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_aditivo_proposta FOREIGN KEY (proposta_id) REFERENCES proposta_comercial (id),
    CONSTRAINT fk_aditivo_usuario_externo FOREIGN KEY (solicitado_por_externo_id) REFERENCES usuario_externo (id)
);

CREATE INDEX idx_aditivo_proposta ON proposta_comercial_aditivo (proposta_id, status);

CREATE TABLE proposta_comercial_anexo (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id                   BIGINT       NOT NULL DEFAULT 1,
    proposta_id                 BIGINT       NOT NULL,
    nome_arquivo                VARCHAR(255) NOT NULL,
    caminho_relativo            VARCHAR(500) NOT NULL,
    tamanho_bytes               BIGINT       NULL,
    content_type                VARCHAR(120) NULL,
    uploaded_by_externo_id      INT          NULL,
    created_at                  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_anexo_proposta FOREIGN KEY (proposta_id) REFERENCES proposta_comercial (id),
    CONSTRAINT fk_anexo_usuario_externo FOREIGN KEY (uploaded_by_externo_id) REFERENCES usuario_externo (id)
);

CREATE INDEX idx_anexo_proposta ON proposta_comercial_anexo (proposta_id, created_at DESC);
