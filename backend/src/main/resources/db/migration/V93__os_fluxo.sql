CREATE TABLE os_fluxo_etapa (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(255) NOT NULL,
 codigo VARCHAR(255), nome VARCHAR(255), setor VARCHAR(255), ordem INT, cor VARCHAR(255), icone VARCHAR(255),
 codigoBarrasEntrada VARCHAR(255), codigoBarrasSaida VARCHAR(255), metaMinutos INT, ativo BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE KEY uk_fluxo_etapa (tenant_id, codigo)
);
CREATE TABLE os_fluxo_registro (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(255) NOT NULL, osId BIGINT NOT NULL, etapaId BIGINT NOT NULL,
 sequencia INT, entradaEm DATETIME, entradaUsuarioId INT, entradaUsuarioNome VARCHAR(255), entradaOrigem VARCHAR(255), entradaEstacao VARCHAR(255),
 saidaEm DATETIME, saidaUsuarioId INT, saidaUsuarioNome VARCHAR(255), saidaOrigem VARCHAR(255), saidaEstacao VARCHAR(255),
 forcado BOOLEAN NOT NULL DEFAULT FALSE, observacao VARCHAR(2000), anulado BOOLEAN NOT NULL DEFAULT FALSE,
 anuladoEm DATETIME, anuladoUsuarioNome VARCHAR(255), anuladoMotivo VARCHAR(2000),
 INDEX idx_fluxo_registro_os (tenant_id, osId, sequencia), INDEX idx_fluxo_registro_etapa (tenant_id, etapaId, saidaEm)
);
CREATE TABLE os_fluxo_evento (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(255) NOT NULL, osId BIGINT, etapaId BIGINT,
 acao VARCHAR(255), sucesso BOOLEAN, mensagem VARCHAR(2000), codigoOsLido VARCHAR(255), codigoEtapaLido VARCHAR(255),
 origem VARCHAR(255), estacao VARCHAR(255), usuarioId INT, usuarioNome VARCHAR(255), ocorridoEm DATETIME,
 INDEX idx_fluxo_evento_os (tenant_id, osId, ocorridoEm)
);
CREATE TABLE os_fluxo_terminal (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(255) NOT NULL, terminalId VARCHAR(255) NOT NULL,
 apelido VARCHAR(255), estacaoCodigo VARCHAR(255), usuarioNome VARCHAR(255), ip VARCHAR(255), userAgent VARCHAR(255),
 vinculadoEm DATETIME, ultimoAcesso DATETIME, ativa BOOLEAN NOT NULL DEFAULT FALSE,
 codigoPareamento VARCHAR(255), expiraEm DATETIME,
 UNIQUE KEY uk_fluxo_terminal (tenant_id, terminalId)
);
CREATE TABLE os_fluxo_estacao_nome (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, tenant_id VARCHAR(255) NOT NULL, codigo VARCHAR(255), nome VARCHAR(255),
 UNIQUE KEY uk_fluxo_estacao_nome (tenant_id, codigo)
);
