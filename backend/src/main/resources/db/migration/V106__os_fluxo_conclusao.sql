ALTER TABLE os_fluxo_registro ADD COLUMN conclusaoFluxo BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE os_fluxo_registro r
 JOIN os_fluxo_etapa e ON e.id = r.etapaId AND e.tenant_id = r.tenant_id
 JOIN (SELECT tenant_id, MAX(ordem) AS ordem FROM os_fluxo_etapa WHERE ativo = TRUE GROUP BY tenant_id) f
   ON f.tenant_id = r.tenant_id AND e.ordem >= f.ordem
 LEFT JOIN os_fluxo_registro posterior ON posterior.tenant_id = r.tenant_id AND posterior.osId = r.osId
   AND posterior.anulado = FALSE AND posterior.id > r.id
 SET r.conclusaoFluxo = TRUE
 WHERE r.anulado = FALSE AND r.saidaEm IS NOT NULL AND posterior.id IS NULL;
