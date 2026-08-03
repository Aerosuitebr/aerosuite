-- Campos fiscais/comunicação adicionais da empresa detentora
ALTER TABLE sistema_empresa_config
    ADD COLUMN inscricao_municipal VARCHAR(64) NULL AFTER inscricao_estadual,
    ADD COLUMN email_nfe VARCHAR(320) NULL AFTER inscricao_municipal;
