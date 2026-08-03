-- Integração Evolution API (WhatsApp) por tenant — instância dedicada por oficina.

CREATE TABLE tenant_whatsapp_connection (
    tenant_id                   BIGINT       NOT NULL,
    whatsapp_instance_name      VARCHAR(128) NOT NULL,
    whatsapp_token_enc          TEXT         NOT NULL,
    whatsapp_status             VARCHAR(32)  NOT NULL DEFAULT 'DISCONNECTED',
    connected_at                DATETIME(6)  NULL,
    connected_by_usuario_id     INT          NULL,
    updated_at                  DATETIME(6)  NOT NULL,
    PRIMARY KEY (tenant_id),
    CONSTRAINT uk_tenant_whatsapp_instance_name UNIQUE (whatsapp_instance_name),
    CONSTRAINT fk_tenant_whatsapp_connection_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_tenant_whatsapp_status ON tenant_whatsapp_connection (whatsapp_status);

-- Fila assíncrona para envio de mensagens/mídia WhatsApp (não bloqueia requisição HTTP).
CREATE TABLE whatsapp_message_job (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id       BIGINT       NOT NULL,
    job_type        VARCHAR(32)  NOT NULL,
    payload_json    MEDIUMTEXT   NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    attempts        INT          NOT NULL DEFAULT 0,
    max_attempts    INT          NOT NULL DEFAULT 5,
    next_run_at     DATETIME(6)  NOT NULL,
    last_error      VARCHAR(1000) NULL,
    created_at      DATETIME(6)  NOT NULL,
    processed_at    DATETIME(6)  NULL,
    PRIMARY KEY (id),
    INDEX idx_whatsapp_message_job_poll (status, next_run_at),
    INDEX idx_whatsapp_message_job_tenant (tenant_id),
    CONSTRAINT fk_whatsapp_message_job_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
