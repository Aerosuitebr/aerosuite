-- =====================================================
-- Script de criação da tabela de chamadas de áudio
-- Sistema Aero Suite - Chat com Chamadas de Voz
-- =====================================================

-- Tabela principal de chamadas
CREATE TABLE IF NOT EXISTS chamada (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversa_id BIGINT NOT NULL,
    chamador_id BIGINT NOT NULL,
    chamador_nome VARCHAR(255),
    receptor_id BIGINT NOT NULL,
    receptor_nome VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'CHAMANDO',
    data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atendimento DATETIME,
    data_fim DATETIME,
    duracao_segundos BIGINT,
    oferta_sdp LONGTEXT,
    resposta_sdp LONGTEXT,
    ice_candidates_chamador LONGTEXT,
    ice_candidates_receptor LONGTEXT,
    
    -- Índices
    INDEX idx_chamada_conversa (conversa_id),
    INDEX idx_chamada_chamador (chamador_id),
    INDEX idx_chamada_receptor (receptor_id),
    INDEX idx_chamada_status (status),
    INDEX idx_chamada_data_inicio (data_inicio),
    
    -- Índice composto para buscar chamadas ativas
    INDEX idx_chamada_receptor_status (receptor_id, status),
    INDEX idx_chamada_usuarios_status (chamador_id, receptor_id, status),
    
    -- Foreign keys (comentadas caso as tabelas não existam em ordem)
    -- FOREIGN KEY (conversa_id) REFERENCES conversa(id),
    -- FOREIGN KEY (chamador_id) REFERENCES usuario(id),
    -- FOREIGN KEY (receptor_id) REFERENCES usuario(id),
    
    -- Constraints
    CONSTRAINT chk_chamada_status CHECK (status IN ('CHAMANDO', 'ATENDIDA', 'RECUSADA', 'ENCERRADA', 'NAO_ATENDIDA', 'OCUPADO'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Comentários sobre os status:
-- CHAMANDO: Chamada iniciada, aguardando receptor atender
-- ATENDIDA: Receptor atendeu, chamada em andamento
-- RECUSADA: Receptor recusou a chamada
-- ENCERRADA: Chamada encerrada normalmente por um dos participantes
-- NAO_ATENDIDA: Chamada não foi atendida (timeout)
-- OCUPADO: Receptor estava em outra chamada
-- =====================================================
