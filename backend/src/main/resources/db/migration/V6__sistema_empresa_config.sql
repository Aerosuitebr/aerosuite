-- Configuração única da empresa detentora do sistema (white-label, fiscal, contato).
-- Uma linha com id = 1. Preenchida no assistente "Configuração da empresa".

CREATE TABLE IF NOT EXISTS sistema_empresa_config (
    id BIGINT NOT NULL PRIMARY KEY,
    display_name VARCHAR(160) NOT NULL DEFAULT '',
    tagline VARCHAR(255) NULL,
    email_subject_suffix VARCHAR(160) NULL,
    support_email VARCHAR(320) NOT NULL DEFAULT '',
    copyright_entity VARCHAR(160) NULL,
    browser_title_suffix VARCHAR(160) NULL,
    logo_url VARCHAR(500) NULL,
    wordmark_url VARCHAR(500) NULL,
    razao_social VARCHAR(255) NULL,
    cnpj VARCHAR(32) NULL,
    inscricao_estadual VARCHAR(64) NULL,
    endereco_logradouro VARCHAR(255) NULL,
    endereco_numero VARCHAR(32) NULL,
    endereco_complemento VARCHAR(120) NULL,
    endereco_bairro VARCHAR(120) NULL,
    cidade VARCHAR(120) NULL,
    uf CHAR(2) NULL,
    cep VARCHAR(16) NULL,
    telefone VARCHAR(40) NULL,
    site_url VARCHAR(500) NULL,
    onboarding_completo TINYINT(1) NOT NULL DEFAULT 0,
    updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by_usuario_id INT NULL,
    CONSTRAINT fk_sistema_empresa_updated_by FOREIGN KEY (updated_by_usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
