-- Vínculo explícito proposta ↔ cliente cadastro ↔ usuário externo (portal P4.2).

ALTER TABLE proposta_comercial
    ADD COLUMN cliente_proposta_id INT NULL;

ALTER TABLE proposta_comercial
    ADD CONSTRAINT fk_proposta_cliente_proposta
        FOREIGN KEY (cliente_proposta_id) REFERENCES cliente_proposta (id);

CREATE INDEX idx_proposta_cliente_proposta ON proposta_comercial (cliente_proposta_id);

ALTER TABLE usuario_externo
    ADD COLUMN cliente_proposta_id INT NULL;

ALTER TABLE usuario_externo
    ADD CONSTRAINT fk_usuario_externo_cliente_proposta
        FOREIGN KEY (cliente_proposta_id) REFERENCES cliente_proposta (id);

CREATE INDEX idx_usuario_externo_cliente_proposta ON usuario_externo (cliente_proposta_id);
