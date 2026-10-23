ALTER TABLE os
    ADD COLUMN mecanicoResponsavelId INT NULL;
ALTER TABLE os ADD COLUMN mecanicoResponsavelNome VARCHAR(255) NULL;
ALTER TABLE os ADD COLUMN mecanicoAtribuidoPorId INT NULL;
ALTER TABLE os ADD COLUMN mecanicoAtribuidoPorNome VARCHAR(255) NULL;
ALTER TABLE os ADD COLUMN mecanicoAtribuidoEm DATETIME NULL;
ALTER TABLE os ADD COLUMN statusExecucao VARCHAR(30) NULL;
ALTER TABLE os ADD COLUMN execucaoIniciadaEm DATETIME NULL;
ALTER TABLE os ADD COLUMN execucaoPausadaEm DATETIME NULL;
ALTER TABLE os ADD COLUMN execucaoFinalizadaEm DATETIME NULL;
CREATE TABLE os_execucao_evento (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    osId BIGINT NOT NULL,
    usuarioId INT NOT NULL,
    acao VARCHAR(30) NOT NULL,
    observacao VARCHAR(2000) NULL,
    ocorridoEm DATETIME NOT NULL,
    INDEX idx_execucao_os (tenant_id, osId, ocorridoEm)
);
