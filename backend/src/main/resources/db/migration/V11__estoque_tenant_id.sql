-- Fase 2 tenant: módulo de estoque (fornecedor, invoice, lote, itens, movimentações).
ALTER TABLE fornecedor
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE fornecedor
    ADD CONSTRAINT fk_fornecedor_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_fornecedor_tenant ON fornecedor (tenant_id);

ALTER TABLE invoice
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE invoice
    ADD CONSTRAINT fk_invoice_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_invoice_tenant ON invoice (tenant_id);

ALTER TABLE lote
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE lote
    ADD CONSTRAINT fk_lote_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_lote_tenant ON lote (tenant_id);

ALTER TABLE item_estoque
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE item_estoque
    ADD CONSTRAINT fk_item_estoque_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_item_estoque_tenant ON item_estoque (tenant_id);

ALTER TABLE movimentacao_estoque
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE movimentacao_estoque
    ADD CONSTRAINT fk_movimentacao_estoque_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_movimentacao_estoque_tenant ON movimentacao_estoque (tenant_id);
