-- Configurações administrativas do tenant (sistema, segurança, notificações, backup, avançadas)
CREATE TABLE IF NOT EXISTS sistema_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    valores_json MEDIUMTEXT NOT NULL COMMENT 'Mapa chave-valor das configs admin',
    avancadas_json MEDIUMTEXT NOT NULL COMMENT 'Flags avançadas (logs, backup, e-mail)',
    updated_at DATETIME NULL,
    updated_by_usuario_id INT NULL,
    CONSTRAINT uk_sistema_config_tenant UNIQUE (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
