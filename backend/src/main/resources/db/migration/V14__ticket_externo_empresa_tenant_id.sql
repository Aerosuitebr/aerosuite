-- Fase 3 tenant: tickets, portal externo e configuração da empresa por instância.

ALTER TABLE ticket
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE ticket
    ADD CONSTRAINT fk_ticket_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_ticket_tenant ON ticket (tenant_id);

ALTER TABLE usuario_externo
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE usuario_externo
    ADD CONSTRAINT fk_usuario_externo_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE INDEX idx_usuario_externo_tenant ON usuario_externo (tenant_id);

ALTER TABLE sistema_empresa_config
    ADD COLUMN tenant_id BIGINT NOT NULL DEFAULT 1;

ALTER TABLE sistema_empresa_config
    ADD CONSTRAINT fk_sistema_empresa_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id);

CREATE UNIQUE INDEX uk_sistema_empresa_config_tenant ON sistema_empresa_config (tenant_id);

UPDATE sistema_empresa_config SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 0;

ALTER TABLE sistema_empresa_config
    MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
