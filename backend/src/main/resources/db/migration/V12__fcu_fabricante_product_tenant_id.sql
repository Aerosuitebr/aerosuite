-- Fase 2 tenant: catálogo aeronáutico (FCU, fabricante, produto, associação kit).
ALTER TABLE fabricante
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE fabricante
    ADD CONSTRAINT fk_fabricante_aero_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_fabricante_aero_tenant ON fabricante (tenant_id);

ALTER TABLE product
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE product
    ADD CONSTRAINT fk_product_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_product_tenant ON product (tenant_id);

ALTER TABLE fcu
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE fcu
    ADD CONSTRAINT fk_fcu_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_fcu_tenant ON fcu (tenant_id);

ALTER TABLE associacao_fcu
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE associacao_fcu
    ADD CONSTRAINT fk_associacao_fcu_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_associacao_fcu_tenant ON associacao_fcu (tenant_id);
