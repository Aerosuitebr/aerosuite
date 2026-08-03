-- B1 — Certificado de liberação para serviço (CRS) por OS.

ALTER TABLE os
    ADD COLUMN crs_emitido_em DATETIME NULL COMMENT 'Data/hora de emissão do CRS',
    ADD COLUMN crs_liberado_por_usuario_id BIGINT NULL,
    ADD COLUMN crs_liberado_por_nome VARCHAR(255) NULL,
    ADD COLUMN crs_liberado_por_cargo VARCHAR(120) NULL COMMENT 'Ex.: Responsável técnico, Inspetor',
    ADD COLUMN crs_certificado_numero VARCHAR(80) NULL COMMENT 'Número de referência do CRS na oficina',
    ADD COLUMN crs_observacoes TEXT NULL,
    ADD COLUMN crs_checklist_json TEXT NULL COMMENT 'JSON array de itens do checklist marcados';
