-- Fase 2 tenant: ordens de serviço isoladas por tenant (default = 1).
ALTER TABLE os
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE os
    ADD CONSTRAINT fk_os_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_os_tenant ON os (tenant_id);
