CREATE TABLE ferramenta_pn (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    pn VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
    ferramenta_id BIGINT NOT NULL,
    UNIQUE KEY uk_ferramenta_pn (tenant_id, pn, ferramenta_id),
    FOREIGN KEY (ferramenta_id) REFERENCES ferramenta(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE ferramenta_movimento
    ADD COLUMN pn_solicitacao VARCHAR(100) COLLATE utf8mb4_bin,
    ADD COLUMN solicitacao_origem_id BIGINT,
    ADD UNIQUE KEY uk_mov_solicitacao_origem (solicitacao_origem_id),
    ADD INDEX ix_mov_os_pendente (osId, status, ferramentaId),
    ADD FOREIGN KEY (solicitacao_origem_id) REFERENCES ferramenta_movimento(id);
