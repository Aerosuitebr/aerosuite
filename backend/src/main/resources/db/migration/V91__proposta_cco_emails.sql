CREATE TABLE proposta_cco_email (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    email VARCHAR(254) NOT NULL,
    usuarioId INT NULL,
    UNIQUE KEY uk_proposta_cco_tenant_email (tenant_id, email)
);
