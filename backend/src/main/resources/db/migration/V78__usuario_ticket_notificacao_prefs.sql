-- Preferências de e-mail de chamados por usuário + fila de digest diário.

ALTER TABLE usuario
    ADD COLUMN notif_ticket_email_modo VARCHAR(16) NOT NULL DEFAULT 'INSTANT'
        COMMENT 'INSTANT | DIGEST_DAILY | OFF';

CREATE TABLE ticket_email_digest_item (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id   BIGINT       NOT NULL,
    usuario_id  INT          NOT NULL,
    ticket_id   BIGINT       NOT NULL,
    evento_tipo VARCHAR(40)  NOT NULL,
    resumo      VARCHAR(500) NULL,
    created_at  DATETIME(6)  NOT NULL,
    sent_at     DATETIME(6)  NULL,
    INDEX idx_ticket_digest_pending (tenant_id, usuario_id, sent_at),
    INDEX idx_ticket_digest_created (created_at)
);
