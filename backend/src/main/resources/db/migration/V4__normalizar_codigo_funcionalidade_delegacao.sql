-- =============================================================================
-- V4 — Normalização idempotente de códigos de funcionalidade + delegação
-- =============================================================================
-- Objetivo
--   1) Garantir que `funcionalidade.codigo` não tenha espaços à frente/trás.
--   2) Alinhar `usuario_delegacao_funcionalidade.funcionalidade_codigo` ao
--      código canónico da tabela `funcionalidade` (mesma chave lógica, mesmo
--      `UPPER(TRIM(codigo))`), quando existe exactamente UMA linha activa por
--      essa chave — evita divergências de capitalização (ex.: CHAT vs chat).
--
-- O que acontece "depois" (operacional)
--   • Em cada deploy, o Quarkus executa o Flyway antes de servir tráfego:
--     esta migração corre uma vez por ambiente (histórico em flyway_schema_history).
--   • Não é necessário correr scripts manuais em produção para este passo,
--     desde que a pipeline inclua a versão da API com este ficheiro.
--
-- Relatório prévio de duplicados (correr manualmente em staging/cópia do BD)
--   SELECT UPPER(TRIM(codigo)) AS canon,
--          COUNT(*) AS n,
--          GROUP_CONCAT(CONCAT(id, ':', codigo) ORDER BY id SEPARATOR ' | ') AS linhas
--   FROM funcionalidade
--   WHERE COALESCE(ativo, 1) = 1
--   GROUP BY UPPER(TRIM(codigo))
--   HAVING n > 1;
--
-- Se existirem duplicados activos (n > 1)
--   • Esta migração NÃO funde linhas nem apaga dados: o UPDATE de delegação
--     abaixo ignora esses grupos (subconsulta com HAVING COUNT(*) = 1).
--   • Resolução: merge manual (reapontar perfil_funcionalidade / delegações,
--     inactivar ou remover duplicado) e voltar a correr o relatório até n = 1.
--
-- Compatibilidade
--   • MySQL / MariaDB (sintaxe UPDATE … JOIN). Idempotente: segunda execução
--     no mesmo estado não altera linhas.
-- =============================================================================

-- 1) Remover espaços em branco nos códigos da tabela de referência
UPDATE funcionalidade
SET codigo = TRIM(codigo),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE codigo <> TRIM(codigo);

-- 2) Delegações: copiar o código exacto da linha de `funcionalidade` escolhida
--    (MIN(id) por grupo UPPER(TRIM(codigo))) quando o grupo é unívoco entre activos
--    COLLATE: evita erro 1267 quando `usuario_delegacao_funcionalidade` (ex.: utf8mb4_unicode_ci)
--    e `funcionalidade` (ex.: utf8mb4_0900_ai_ci) vêm de scripts de bootstrap diferentes.
UPDATE usuario_delegacao_funcionalidade d
INNER JOIN (
    SELECT UPPER(TRIM(codigo)) AS ucode, MIN(id) AS keep_id
    FROM funcionalidade
    WHERE COALESCE(ativo, 1) = 1
    GROUP BY UPPER(TRIM(codigo))
    HAVING COUNT(*) = 1
) g ON (UPPER(TRIM(d.funcionalidade_codigo)) COLLATE utf8mb4_unicode_ci) = (g.ucode COLLATE utf8mb4_unicode_ci)
INNER JOIN funcionalidade f ON f.id = g.keep_id
SET d.funcionalidade_codigo = f.codigo,
    d.updated_at = CURRENT_TIMESTAMP
WHERE CAST(d.funcionalidade_codigo AS BINARY) <> CAST(f.codigo AS BINARY);
