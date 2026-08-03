-- NC/CAPA completo: responsáveis por etapa, aprovações formais e anexos de evidência

CREATE TABLE IF NOT EXISTS conformidade_nc_capa_etapa (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    nc_id BIGINT NOT NULL,
    fase VARCHAR(24) NOT NULL,
    responsavel_usuario_id INT NULL,
    responsavel_usuario_nome VARCHAR(255) NULL,
    prazo DATE NULL,
    aprovado TINYINT(1) NOT NULL DEFAULT 0,
    aprovado_usuario_id INT NULL,
    aprovado_usuario_nome VARCHAR(255) NULL,
    aprovado_em DATETIME NULL,
    aprovacao_observacao TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_nc_capa_etapa UNIQUE (tenant_id, nc_id, fase),
    CONSTRAINT fk_nc_capa_etapa_nc FOREIGN KEY (nc_id) REFERENCES conformidade_nao_conformidade (id) ON DELETE CASCADE,
    INDEX idx_nc_capa_etapa_nc (nc_id)
);

CREATE TABLE IF NOT EXISTS conformidade_nc_anexo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    nc_id BIGINT NOT NULL,
    capa_fase VARCHAR(24) NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    nome_original VARCHAR(255) NULL,
    tipo_arquivo VARCHAR(100) NULL,
    tamanho_bytes BIGINT NULL,
    caminho_arquivo VARCHAR(500) NOT NULL,
    descricao VARCHAR(500) NULL,
    usuario_id INT NULL,
    usuario_nome VARCHAR(255) NULL,
    data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT fk_nc_anexo_nc FOREIGN KEY (nc_id) REFERENCES conformidade_nao_conformidade (id) ON DELETE CASCADE,
    INDEX idx_nc_anexo_nc (nc_id),
    INDEX idx_nc_anexo_fase (nc_id, capa_fase)
);
