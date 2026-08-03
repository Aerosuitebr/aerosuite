-- B2 — Certificado de peça estruturado (campos + anexo) e bloqueio na saída.

ALTER TABLE item_estoque
    ADD COLUMN cert_tipo VARCHAR(32) NULL COMMENT 'FAA_8130_3, EASA_FORM1, ANAC, DUAL_RELEASE, OUTRO' AFTER certificado_conformidade,
    ADD COLUMN cert_numero VARCHAR(128) NULL AFTER cert_tipo,
    ADD COLUMN cert_emissor VARCHAR(255) NULL AFTER cert_numero,
    ADD COLUMN cert_data_emissao DATE NULL AFTER cert_emissor,
    ADD COLUMN cert_orgao_aprovacao VARCHAR(128) NULL AFTER cert_data_emissao,
    ADD COLUMN cert_anexo_nome VARCHAR(255) NULL AFTER cert_orgao_aprovacao,
    ADD COLUMN cert_anexo_path VARCHAR(500) NULL AFTER cert_anexo_nome,
    ADD COLUMN cert_anexo_content_type VARCHAR(100) NULL AFTER cert_anexo_path,
    ADD COLUMN cert_anexo_tamanho BIGINT NULL AFTER cert_anexo_content_type;

-- Legado: número livre vira cert_numero quando ainda vazio
UPDATE item_estoque
SET cert_numero = TRIM(certificado_conformidade)
WHERE cert_numero IS NULL
  AND certificado_conformidade IS NOT NULL
  AND TRIM(certificado_conformidade) <> '';

-- Ativa exigência de certificado na saída para todas as organizações existentes
INSERT INTO tenant_feature (tenant_id, feature_code, enabled, updated_at)
SELECT t.id, 'estoque.saida.exigecertificadopeca', 1, NOW()
FROM tenant t
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_feature tf
    WHERE tf.tenant_id = t.id AND tf.feature_code = 'estoque.saida.exigecertificadopeca'
);
