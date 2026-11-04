CREATE TABLE os_fluxo_setor (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 tenant_id VARCHAR(255) NOT NULL,
 nome VARCHAR(120) NOT NULL,
 UNIQUE KEY uk_fluxo_setor_tenant_nome (tenant_id, nome)
);
INSERT INTO os_fluxo_setor (tenant_id, nome)
 SELECT DISTINCT tenant_id, TRIM(setor) FROM os_fluxo_etapa
 WHERE setor IS NOT NULL AND TRIM(setor) <> '';
