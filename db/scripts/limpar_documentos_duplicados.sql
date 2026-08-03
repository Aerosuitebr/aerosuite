-- Script para remover documentos duplicados da tabela usuario_externo_documento
-- Mantém apenas o registro mais antigo (menor ID) de cada combinação usuario_externo_id + os_file_id

-- Desabilitar safe update mode temporariamente
SET SQL_SAFE_UPDATES = 0;

-- Primeiro, ver quantos duplicados existem
SELECT 
    usuario_externo_id, 
    os_file_id, 
    COUNT(*) as total,
    GROUP_CONCAT(id ORDER BY id) as ids
FROM usuario_externo_documento
WHERE os_file_id IS NOT NULL
GROUP BY usuario_externo_id, os_file_id
HAVING COUNT(*) > 1;

-- Deletar duplicados, mantendo o menor ID
DELETE FROM usuario_externo_documento 
WHERE id IN (
    SELECT id FROM (
        SELECT d1.id
        FROM usuario_externo_documento d1
        INNER JOIN usuario_externo_documento d2 
        ON d1.usuario_externo_id = d2.usuario_externo_id 
           AND d1.os_file_id = d2.os_file_id 
           AND d1.id > d2.id
        WHERE d1.os_file_id IS NOT NULL
    ) as duplicates
);

-- Reabilitar safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Verificar se ainda existem duplicados
SELECT 
    'Duplicados restantes:' as info,
    COUNT(*) as total
FROM (
    SELECT usuario_externo_id, os_file_id, COUNT(*) as cnt
    FROM usuario_externo_documento
    WHERE os_file_id IS NOT NULL
    GROUP BY usuario_externo_id, os_file_id
    HAVING COUNT(*) > 1
) as dups;

-- Adicionar índice único para prevenir duplicatas futuras (opcional)
-- ALTER TABLE usuario_externo_documento 
-- ADD UNIQUE INDEX idx_unique_doc (usuario_externo_id, os_file_id);
