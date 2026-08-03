/*
 * Sanitizacao de dados sensiveis / smoke / encoding — homologacao UX e demos.
 * Tenant: default id 1 (codigo 'default'). Outro: SET @tenant_id = (SELECT id FROM tenant WHERE codigo = 'demo');
 *
 * CLI:  mysql -u root -p aerosuite < db/scripts/sanitize-demo-tenant-homologacao.sql
 *
 * MySQL Workbench — OBRIGATORIO:
 *   1. Selecione o schema `aerosuite` (ou ajuste USE abaixo)
 *   2. Ctrl+A (arquivo inteiro) → botao Execute (raio) ou Ctrl+Shift+Enter
 *   Nao execute apenas um SELECT ou trecho do meio (falta @tenant_id / SQL_SAFE_UPDATES).
 */

USE aerosuite;

SET NAMES utf8mb4;
SET @tenant_id = COALESCE(@tenant_id, 1);

-- MySQL Workbench SQL_SAFE_UPDATES: script admin intencional — restaura ao final.
SET @__old_sql_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- ─── Diagnóstico (antes) ───
SELECT 'os_clientes_sensiveis' AS check_name, COUNT(*) AS cnt
FROM os
WHERE tenant_id = @tenant_id
  AND (
    cliente_nome REGEXP 'FARROUPIL|QUICK[[:space:]]*MNT|AXIAL|SMOKE|GERAR[[:space:]]*OS|BELLOWS|KING[[:space:]]*DO[[:space:]]*RIO'
    OR cliente_nome LIKE '%??%'
    OR cliente_nome REGEXP 'VOAR[[:space:]]*T'
  );

SELECT 'propostas_sensiveis' AS check_name, COUNT(*) AS cnt
FROM proposta_comercial
WHERE tenant_id = @tenant_id
  AND (
    cliente_nome REGEXP 'SMOKE|GERAR|FARROUPIL|QUICK|AXIAL|BELLOWS'
    OR tipo_servico_nome LIKE '%Servico%'
    OR tipo_servico_nome LIKE '%smoke%'
    OR servico_executado LIKE '%Servico%'
    OR servico_executado LIKE '%smoke%'
    OR cliente_nome LIKE '%??%'
  );

-- ─── OS: nomes de clientes fictícios ───
UPDATE os o
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id_os, id) AS rn
  FROM os
  WHERE tenant_id = @tenant_id
    AND (
      cliente_nome REGEXP 'FARROUPIL|QUICK[[:space:]]*MNT|AXIAL|SMOKE|GERAR[[:space:]]*OS|BELLOWS|KING[[:space:]]*DO[[:space:]]*RIO|VOAR'
      OR cliente_nome LIKE '%??%'
      OR cliente_nome IS NULL
      OR TRIM(cliente_nome) = ''
    )
) x ON x.id = o.id
SET o.cliente_nome = CONCAT('Cliente Demo ', LPAD(x.rn, 2, '0')),
    o.updated_at = NOW(6)
WHERE o.id = x.id;

-- Encoding conhecido (VOAR T??XI → VOAR Táxi Aéreo)
UPDATE os
SET cliente_nome = 'VOAR Táxi Aéreo Ltda',
    updated_at = NOW(6)
WHERE tenant_id = @tenant_id
  AND (cliente_nome LIKE '%T??XI%' OR cliente_nome LIKE '%A??RE%' OR cliente_nome LIKE '%T??xi%');

-- ─── Cliente proposta (cadastro comercial) ───
UPDATE cliente_proposta cp
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM cliente_proposta
  WHERE tenant_id = @tenant_id
    AND (
      nome REGEXP 'SMOKE|GERAR|FARROUPIL|QUICK|AXIAL|BELLOWS|KING[[:space:]]*DO[[:space:]]*RIO|VOAR'
      OR nome LIKE '%??%'
    )
) x ON x.id = cp.id
SET cp.nome = CONCAT('Cliente Demo ', LPAD(x.rn, 2, '0')),
    cp.email = CONCAT('cliente.demo', x.rn, '@homologacao.local'),
    cp.updated_at = NOW(6)
WHERE cp.id = x.id;

-- ─── Propostas comerciais ───
UPDATE proposta_comercial p
JOIN (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM proposta_comercial
  WHERE tenant_id = @tenant_id
    AND (
      cliente_nome REGEXP 'SMOKE|GERAR|FARROUPIL|QUICK|AXIAL|BELLOWS|KING[[:space:]]*DO[[:space:]]*RIO|VOAR'
      OR cliente_nome LIKE '%??%'
    )
) x ON x.id = p.id
SET p.cliente_nome = CONCAT('Cliente Demo ', LPAD(x.rn, 2, '0')),
    p.cliente_email = CONCAT('cliente.demo', x.rn, '@homologacao.local'),
    p.updated_at = NOW(6)
WHERE p.id = x.id;

UPDATE proposta_comercial
SET produto_nome = CASE
      WHEN produto_nome = 'Servico smoke P4.1' THEN 'Serviço demonstração P4.1'
      WHEN produto_nome = 'Servico homologacao Bling E2E' THEN 'Serviço homologação Bling E2E'
      ELSE REPLACE(REPLACE(produto_nome, 'Servico smoke', 'Serviço demonstração'),
                   'Servico homologacao', 'Serviço homologação')
    END,
    updated_at = NOW(6)
WHERE tenant_id = @tenant_id
  AND (produto_nome REGEXP 'Servico|smoke|Smoke' OR produto_nome LIKE '%homologacao%');

UPDATE proposta_comercial
SET tipo_servico_nome = REPLACE(tipo_servico_nome, 'Servico', 'Serviço'),
    servico_executado = REPLACE(REPLACE(servico_executado, 'Servico smoke', 'Serviço demonstração'),
                                'Servico ', 'Serviço '),
    updated_at = NOW(6)
WHERE tenant_id = @tenant_id
  AND (tipo_servico_nome LIKE '%Servico%' OR servico_executado LIKE '%Servico%' OR servico_executado LIKE '%smoke%');

-- ─── Templates comercial (catálogo global, sem tenant_id) ───
UPDATE template_produto_servico
SET tipo_servico_nome = REPLACE(tipo_servico_nome, 'Servico', 'Serviço'),
    servico_descricao_padrao = REPLACE(REPLACE(servico_descricao_padrao, 'Servico smoke', 'Serviço demonstração'),
                                       'Servico ', 'Serviço '),
    updated_at = NOW(6)
WHERE tipo_servico_nome LIKE '%Servico%'
   OR servico_descricao_padrao LIKE '%Servico%'
   OR servico_descricao_padrao LIKE '%smoke%';

-- ─── Tipo serviço (catálogo global — sem tenant) ───
UPDATE tipo_servico
SET nome = REPLACE(nome, 'Servico', 'Serviço')
WHERE nome LIKE '%Servico%' AND nome NOT LIKE '%Serviços%';

UPDATE tipo_servico
SET nome = 'Serviço demonstração P4.1'
WHERE nome REGEXP 'Servi[cç]o smoke|P4\\.1';

-- Propagar nome corrigido para propostas/templates vinculados
UPDATE proposta_comercial p
JOIN tipo_servico ts ON ts.id = p.id_tipo_servico
SET p.tipo_servico_nome = ts.nome,
    p.updated_at = NOW(6)
WHERE p.tenant_id = @tenant_id
  AND p.id_tipo_servico IS NOT NULL;

UPDATE template_produto_servico t
JOIN tipo_servico ts ON ts.id = t.id_tipo_servico
SET t.tipo_servico_nome = ts.nome,
    t.updated_at = NOW(6)
WHERE t.id_tipo_servico IS NOT NULL;

-- ─── OS: tipo_servico texto livre ───
UPDATE os
SET tipo_servico = REPLACE(tipo_servico, 'Servico', 'Serviço'),
    updated_at = NOW(6)
WHERE tenant_id = @tenant_id
  AND tipo_servico LIKE '%Servico%';

-- ─── Diagnóstico (depois) ───
SELECT 'pos_os' AS fase, COUNT(*) AS restantes
FROM os
WHERE tenant_id = @tenant_id
  AND (
    cliente_nome REGEXP 'FARROUPIL|QUICK[[:space:]]*MNT|AXIAL|SMOKE|GERAR[[:space:]]*OS|BELLOWS'
    OR cliente_nome LIKE '%??%'
  );

SELECT 'pos_propostas' AS fase, COUNT(*) AS restantes
FROM proposta_comercial
WHERE tenant_id = @tenant_id
  AND (
    cliente_nome REGEXP 'SMOKE|GERAR|FARROUPIL|QUICK|AXIAL'
    OR tipo_servico_nome LIKE '%Servico%'
    OR servico_executado LIKE '%smoke%'
    OR produto_nome REGEXP 'Servico|smoke|Smoke'
  );

SELECT 'concluido' AS status, @tenant_id AS tenant_id, NOW(6) AS executed_at;

-- Backup global (Docker local): caminho /app/backups + MySQL no host
UPDATE backup_config
SET backup_path = '/app/backups',
    db_host = CASE
        WHEN db_host IN ('localhost', '127.0.0.1') THEN 'host.docker.internal'
        ELSE db_host
    END,
    updated_at = NOW()
WHERE is_active = TRUE;

SET SQL_SAFE_UPDATES = @__old_sql_safe_updates;
