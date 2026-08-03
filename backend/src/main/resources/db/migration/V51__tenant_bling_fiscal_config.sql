-- Configuração fiscal Bling por tenant: CFOP, série, alíquotas, certificado A1/A3, automações.

CREATE TABLE tenant_bling_fiscal_config (
    tenant_id              BIGINT         NOT NULL,
    cfop_padrao            VARCHAR(10)    NULL,
    serie_nfe              VARCHAR(5)     NULL,
    natureza_operacao      VARCHAR(120)   NULL,
    ncm_padrao             VARCHAR(10)    NULL,
    aliquota_icms          DECIMAL(7, 4)  NULL,
    aliquota_pis           DECIMAL(7, 4)  NULL,
    aliquota_cofins        DECIMAL(7, 4)  NULL,
    auto_os_on_pedido      TINYINT(1)     NOT NULL DEFAULT 1,
    auto_emitir_nfe        TINYINT(1)     NOT NULL DEFAULT 0,
    certificado_tipo       VARCHAR(2)     NULL COMMENT 'A1 ou A3',
    certificado_nome       VARCHAR(255)   NULL,
    certificado_pfx_enc    MEDIUMTEXT     NULL,
    certificado_senha_enc  VARCHAR(512)   NULL,
    certificado_valido_ate DATE           NULL,
    certificado_uploaded_at DATETIME(6)   NULL,
    created_at             DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at             DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (tenant_id),
    CONSTRAINT fk_tbfisc_tenant FOREIGN KEY (tenant_id) REFERENCES tenant (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
