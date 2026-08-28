CREATE TABLE IF NOT EXISTS parts_search (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(64) NOT NULL,
    user_id BIGINT NULL,
    part_number VARCHAR(100) NOT NULL,
    normalized_part_number VARCHAR(100) NOT NULL,
    requested_quantity DECIMAL(15,3) NULL,
    requested_condition VARCHAR(32) NULL,
    requested_country VARCHAR(100) NULL,
    requested_certification VARCHAR(100) NULL,
    aog BOOLEAN NOT NULL DEFAULT FALSE,
    result_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_parts_search_tenant_created (tenant_id, created_at),
    INDEX idx_parts_search_tenant_pn (tenant_id, normalized_part_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO funcionalidade (nome, descricao, codigo, icone, rota, ordem, secao, parent_id, tipo, visivel, posicao, ativo, created_at, updated_at)
SELECT 'Localizador de Peças', 'Consulta unificada de disponibilidade aeronáutica',
       'PARTS_FINDER_CONSULTAR', 'pi pi-globe', '/estoque/parts-finder', 65,
       'Estoque', NULL, 'funcionalidade', TRUE, 65, TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM funcionalidade WHERE codigo = 'PARTS_FINDER_CONSULTAR');

INSERT INTO perfil_funcionalidade (perfil_id, funcionalidade_id)
SELECT DISTINCT pf.perfil_id, finder.id
FROM perfil_funcionalidade pf
JOIN funcionalidade estoque ON estoque.id = pf.funcionalidade_id
CROSS JOIN funcionalidade finder
WHERE estoque.codigo LIKE 'ESTOQUE%'
  AND finder.codigo = 'PARTS_FINDER_CONSULTAR'
  AND NOT EXISTS (
      SELECT 1 FROM perfil_funcionalidade existing
      WHERE existing.perfil_id = pf.perfil_id AND existing.funcionalidade_id = finder.id
  );
