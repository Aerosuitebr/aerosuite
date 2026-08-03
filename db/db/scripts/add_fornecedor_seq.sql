-- =====================================================
-- Fallback: tabela de sequência usada pelo Hibernate
-- quando a entidade Fornecedor não usa IDENTITY.
-- Prefira usar a entidade com @GeneratedValue(IDENTITY);
-- este script é opcional nesse caso.
-- =====================================================

CREATE TABLE IF NOT EXISTS fornecedor_seq (
    next_val BIGINT
);

INSERT INTO fornecedor_seq (next_val)
SELECT 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM fornecedor_seq);
