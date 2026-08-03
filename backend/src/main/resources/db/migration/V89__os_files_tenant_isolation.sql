-- Isola documentos de OS e documentos avulsos por organização.
-- Registros legados pertencem ao tenant histórico 1; novas organizações começam vazias.
ALTER TABLE os_files
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1 AFTER id;

ALTER TABLE os_files
    ADD CONSTRAINT fk_os_files_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_os_files_tenant_os_active
    ON os_files (tenant_id, os_id, is_active);
