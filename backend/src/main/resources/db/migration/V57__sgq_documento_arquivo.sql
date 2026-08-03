-- Anexo binário (PDF) em documentos controlados MOE/POP.

ALTER TABLE sgq_documento_controlado
    ADD COLUMN arquivo_path VARCHAR(512) NULL COMMENT 'Caminho relativo em uploads/sgq-documentos' AFTER referencia_arquivo,
    ADD COLUMN arquivo_nome VARCHAR(255) NULL AFTER arquivo_path,
    ADD COLUMN arquivo_content_type VARCHAR(120) NULL AFTER arquivo_nome,
    ADD COLUMN arquivo_tamanho BIGINT NULL AFTER arquivo_content_type;
