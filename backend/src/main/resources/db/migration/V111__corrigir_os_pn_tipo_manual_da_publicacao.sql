-- Corrige OS em que manual_pn ainda guarda o Tipo de Manual (legado).
-- Fonte correta: publicacao_tecnica.pn_manual → os.manual_pn
--                 publicacao_tecnica.tipo_manual → os.tipo_manual

UPDATE os o
INNER JOIN publicacao_fcu pf
  ON pf.fcu_id = o.id_fcu
 AND COALESCE(pf.is_active, 1) = 1
INNER JOIN publicacao_tecnica p
  ON p.id = pf.publicacao_id
 AND COALESCE(p.is_active, 1) = 1
SET
  o.tipo_manual = COALESCE(NULLIF(TRIM(o.tipo_manual), ''), p.tipo_manual),
  o.manual_pn = p.pn_manual
WHERE o.id_fcu IS NOT NULL
  AND (o.tipo_manual IS NULL OR TRIM(o.tipo_manual) = '');
