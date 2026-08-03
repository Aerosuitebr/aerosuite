-- Campos extras de proposta comercial (flag comercial.proposta.camposExtras)
ALTER TABLE proposta_comercial
    ADD COLUMN referencia_cliente VARCHAR(120) NULL,
    ADD COLUMN contato_tecnico VARCHAR(150) NULL,
    ADD COLUMN centro_custo VARCHAR(80) NULL;
