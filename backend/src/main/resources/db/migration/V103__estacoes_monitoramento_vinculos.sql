CREATE TABLE os_fluxo_estacao_monitor (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(255) NOT NULL,
 codigo VARCHAR(255) NOT NULL, monitorado_desde DATETIME(6) NOT NULL, sem_vinculo_desde DATETIME(6) NULL,
 UNIQUE KEY uk_fluxo_monitor_tenant_codigo (tenant_id,codigo)
);
CREATE TABLE os_fluxo_vinculo_evento (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,tenant_id VARCHAR(255) NOT NULL,
 terminal_id VARCHAR(64) NOT NULL,apelido VARCHAR(120),estacao_anterior VARCHAR(255),estacao_nova VARCHAR(255),
 acao VARCHAR(40) NOT NULL,responsavel VARCHAR(255),ocorrido_em DATETIME(6) NOT NULL,
 INDEX ix_fluxo_vinculo_evento (tenant_id,ocorrido_em)
);
