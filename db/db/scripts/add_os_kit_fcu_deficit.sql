-- =============================================================================
-- Tabela: os_kit_fcu_deficit
--
-- Registro persistente do déficit de estoque detectado quando uma OS é salva
-- com FCU associado mas o estoque não cobre todos os itens do kit (associacao_fcu).
--
-- Objetivos:
--   1) Marcar a OS na listagem com um indicador específico de "OS com déficit
--      de kit FCU" (distinto do indicador de Solicitação de Troca Eventual).
--   2) Permitir que o usuário clique no indicador e veja, em modal, todos os
--      itens em déficit (P/N, produto, quantidade necessária, disponível e
--      déficit) — sem precisar recomputar nada na hora.
--
-- Idempotente: pode ser reexecutado sem erro.
-- =============================================================================

CREATE TABLE IF NOT EXISTS os_kit_fcu_deficit (
    id                     BIGINT PRIMARY KEY AUTO_INCREMENT,
    os_id                  BIGINT NOT NULL,
    id_fcu                 INT NULL,
    id_produto_catalogo    INT NULL,
    product_pn             VARCHAR(255) NULL,
    product_name           VARCHAR(500) NULL,
    quantidade_necessaria  INT NOT NULL DEFAULT 0,
    quantidade_disponivel  DECIMAL(18, 3) NOT NULL DEFAULT 0,
    deficit                DECIMAL(18, 3) NOT NULL DEFAULT 0,
    created_at             DATETIME NOT NULL,
    UNIQUE KEY uk_os_kit_fcu_deficit_os_pn (os_id, product_pn),
    KEY ix_os_kit_fcu_deficit_os (os_id),
    KEY ix_os_kit_fcu_deficit_fcu (id_fcu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
