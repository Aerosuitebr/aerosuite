-- =============================================================================
-- Batimento: catalogo (product.quantity) x estoque rastreado (item_estoque)
--
-- Saidas:
--   1) Discrepancias por produto: id, P/N, nome, local, status_catalogo,
--      qty_catalogo, qty_estoque_disponivel, diferenca, cadastros_no_catalogo,
--      ids_duplicados.
--   2) Duplicados: P/Ns com mais de um cadastro ativo no catalogo.
--
-- Notas:
--   - "Disponivel" no estoque = item_estoque.is_active = 1 AND status = 'DISPONIVEL'.
--   - COLLATE forcada para evitar erro de mix de collations entre product e item_estoque.
--   - Inclui produtos com quantity > 0 sem estoque rastreado E qualquer divergencia
--     em produtos que tem entrada no estoque rastreado.
-- =============================================================================

-- ===== 1) DISCREPANCIAS =====
SELECT
    p.id                                                        AS id_produto,
    p.productpn                                                 AS pn,
    p.name                                                      AS nome,
    p.LOCAL                                                     AS local_catalogo,
    p.status                                                    AS status_catalogo,
    COALESCE(p.quantity, 0)                                     AS qty_catalogo,
    COALESCE((
        SELECT SUM(i.quantidade)
        FROM item_estoque i
        WHERE i.is_active = 1
          AND i.status = 'DISPONIVEL'
          AND LOWER(TRIM(i.part_number)) COLLATE utf8mb4_unicode_ci
              = LOWER(TRIM(p.productpn)) COLLATE utf8mb4_unicode_ci
    ), 0)                                                       AS qty_estoque_disponivel,
    (
        COALESCE(p.quantity, 0)
        - COALESCE((
            SELECT SUM(i.quantidade)
            FROM item_estoque i
            WHERE i.is_active = 1
              AND i.status = 'DISPONIVEL'
              AND LOWER(TRIM(i.part_number)) COLLATE utf8mb4_unicode_ci
                  = LOWER(TRIM(p.productpn)) COLLATE utf8mb4_unicode_ci
        ), 0)
    )                                                           AS diferenca,
    (
        SELECT COUNT(*) FROM product p2
        WHERE p2.is_active = 1
          AND LOWER(TRIM(p2.productpn)) COLLATE utf8mb4_unicode_ci
              = LOWER(TRIM(p.productpn)) COLLATE utf8mb4_unicode_ci
    )                                                           AS cadastros_no_catalogo,
    (
        SELECT GROUP_CONCAT(p2.id ORDER BY p2.id)
        FROM product p2
        WHERE p2.is_active = 1
          AND LOWER(TRIM(p2.productpn)) COLLATE utf8mb4_unicode_ci
              = LOWER(TRIM(p.productpn)) COLLATE utf8mb4_unicode_ci
    )                                                           AS ids_duplicados
FROM product p
WHERE p.is_active = 1
  AND (
        -- Catalogo positivo, sem entrada no estoque rastreado
        (p.quantity IS NOT NULL AND p.quantity > 0
         AND NOT EXISTS (
            SELECT 1 FROM item_estoque i
            WHERE i.is_active = 1 AND i.status = 'DISPONIVEL'
              AND LOWER(TRIM(i.part_number)) COLLATE utf8mb4_unicode_ci
                  = LOWER(TRIM(p.productpn)) COLLATE utf8mb4_unicode_ci))
        OR
        -- Existe entrada no estoque mas com saldo diferente do catalogo
        (COALESCE(p.quantity, 0) <> COALESCE((
            SELECT SUM(i.quantidade) FROM item_estoque i
            WHERE i.is_active = 1 AND i.status = 'DISPONIVEL'
              AND LOWER(TRIM(i.part_number)) COLLATE utf8mb4_unicode_ci
                  = LOWER(TRIM(p.productpn)) COLLATE utf8mb4_unicode_ci), 0))
      )
ORDER BY ABS(
    COALESCE(p.quantity, 0)
    - COALESCE((
        SELECT SUM(i.quantidade) FROM item_estoque i
        WHERE i.is_active = 1 AND i.status = 'DISPONIVEL'
          AND LOWER(TRIM(i.part_number)) COLLATE utf8mb4_unicode_ci
              = LOWER(TRIM(p.productpn)) COLLATE utf8mb4_unicode_ci), 0)
) DESC, p.productpn, p.id;

-- ===== 2) DUPLICADOS NO CATALOGO =====
SELECT
    p.productpn                                  AS pn,
    COUNT(*)                                     AS cadastros,
    GROUP_CONCAT(p.id ORDER BY p.id)             AS ids,
    GROUP_CONCAT(DISTINCT p.quantity ORDER BY p.quantity) AS quantidades,
    GROUP_CONCAT(DISTINCT p.LOCAL ORDER BY p.LOCAL) AS locais
FROM product p
WHERE p.is_active = 1
GROUP BY p.productpn
HAVING COUNT(*) > 1
ORDER BY cadastros DESC, p.productpn;
