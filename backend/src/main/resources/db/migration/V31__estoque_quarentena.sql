-- B3 — Quarentena de material não conforme.

ALTER TABLE item_estoque
    ADD COLUMN quarentena_motivo TEXT NULL AFTER cert_anexo_tamanho,
    ADD COLUMN quarentena_inicio_em DATETIME(6) NULL AFTER quarentena_motivo,
    ADD COLUMN quarentena_inicio_usuario_id BIGINT NULL AFTER quarentena_inicio_em,
    ADD COLUMN quarentena_inicio_usuario_nome VARCHAR(255) NULL AFTER quarentena_inicio_usuario_id,
    ADD COLUMN quarentena_fim_em DATETIME(6) NULL AFTER quarentena_inicio_usuario_nome,
    ADD COLUMN quarentena_fim_usuario_id BIGINT NULL AFTER quarentena_fim_em,
    ADD COLUMN quarentena_fim_usuario_nome VARCHAR(255) NULL AFTER quarentena_fim_usuario_id,
    ADD COLUMN quarentena_disposicao VARCHAR(32) NULL AFTER quarentena_fim_usuario_nome,
    ADD COLUMN quarentena_observacoes TEXT NULL AFTER quarentena_disposicao;
