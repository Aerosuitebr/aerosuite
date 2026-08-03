-- P5.3.2 — Hangares (bay) por tenant + vínculo na OS.

CREATE TABLE hangar (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id   BIGINT       NOT NULL,
    codigo      VARCHAR(40)  NOT NULL,
    nome        VARCHAR(120) NOT NULL,
    ativo       TINYINT(1)   NOT NULL DEFAULT 1,
    ordem       INT          NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_hangar_tenant_codigo UNIQUE (tenant_id, codigo)
);

CREATE INDEX idx_hangar_tenant_ativo ON hangar (tenant_id, ativo, ordem);

ALTER TABLE os
    ADD COLUMN hangar_id BIGINT NULL,
    ADD CONSTRAINT fk_os_hangar FOREIGN KEY (hangar_id) REFERENCES hangar (id);

CREATE INDEX idx_os_hangar_aberta ON os (tenant_id, hangar_id, data_fechamento);

INSERT INTO hangar (tenant_id, codigo, nome, ordem, ativo)
SELECT t.id, 'PRINCIPAL', 'Hangar principal', 1, 1
FROM tenant t
WHERE NOT EXISTS (
    SELECT 1 FROM hangar h WHERE h.tenant_id = t.id AND h.codigo = 'PRINCIPAL'
);

UPDATE os o
    INNER JOIN hangar h ON h.tenant_id = CAST(o.tenant_id AS UNSIGNED) AND h.codigo = 'PRINCIPAL'
SET o.hangar_id = h.id
WHERE o.hangar_id IS NULL AND o.data_fechamento IS NULL;
