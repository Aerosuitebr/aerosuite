-- Fase 2 tenant: módulo comercial (propostas e cadastro de clientes).
ALTER TABLE proposta_comercial
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE proposta_comercial
    ADD CONSTRAINT fk_proposta_comercial_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_proposta_comercial_tenant ON proposta_comercial (tenant_id);

ALTER TABLE cliente_proposta
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE cliente_proposta
    ADD CONSTRAINT fk_cliente_proposta_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_cliente_proposta_tenant ON cliente_proposta (tenant_id);
