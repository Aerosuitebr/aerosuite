-- Auditoria de ações sobre invoices (inativação, cancelamento, tentativas bloqueadas)
CREATE TABLE IF NOT EXISTS invoice_auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    numero_invoice VARCHAR(100) NOT NULL,
    acao ENUM(
        'INATIVACAO',
        'CANCELAMENTO',
        'TENTATIVA_INATIVACAO_BLOQUEADA',
        'RESTAURACAO'
    ) NOT NULL,
    motivo TEXT NOT NULL,
    status_anterior VARCHAR(30) NULL,
    status_novo VARCHAR(30) NULL,
    is_active_anterior TINYINT(1) NULL,
    is_active_novo TINYINT(1) NULL,
    qtd_itens_estoque INT DEFAULT 0,
    qtd_lotes INT DEFAULT 0,
    detalhe_bloqueio TEXT NULL COMMENT 'Motivos estruturados quando a ação foi bloqueada',
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(200) NULL,
    usuario_email VARCHAR(200) NULL,
    ip_origem VARCHAR(50) NULL,
    user_agent VARCHAR(500) NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_inv_aud_invoice (invoice_id),
    INDEX idx_inv_aud_acao (acao),
    INDEX idx_inv_aud_data (data_hora),
    INDEX idx_inv_aud_usuario (usuario_id),
    CONSTRAINT fk_inv_aud_invoice FOREIGN KEY (invoice_id)
        REFERENCES invoice(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Trilha de auditoria: inativação, cancelamento e tentativas em invoices';
