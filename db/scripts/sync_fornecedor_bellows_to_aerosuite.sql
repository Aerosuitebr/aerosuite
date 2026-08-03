-- Sincroniza fornecedor: bellows (UTF-8 correto) -> aerosuite.
-- Preserva IDs para manter fornecedor_id em lote, invoice e item_estoque.
-- Uso: mysql --default-character-set=utf8mb4 -uroot -p < db/scripts/sync_fornecedor_bellows_to_aerosuite.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aerosuite;

SELECT COUNT(*) AS origem_bellows FROM bellows.fornecedor;
SELECT COUNT(*) AS destino_antes FROM aerosuite.fornecedor;

SET @bellows_exists := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'bellows' AND table_name = 'fornecedor'
);
SELECT IF(@bellows_exists = 0, 'ERRO: tabela bellows.fornecedor nao existe', 'OK: origem encontrada') AS check_origem;

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO aerosuite.fornecedor (
  id,
  codigo,
  razao_social,
  nome_fantasia,
  cnpj_cpf,
  inscricao_estadual,
  pais_origem,
  endereco,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  cep,
  telefone,
  email,
  website,
  contato_nome,
  contato_telefone,
  contato_email,
  observacoes,
  is_active,
  created_at,
  updated_at,
  tenant_id
)
SELECT
  id,
  codigo,
  razao_social,
  nome_fantasia,
  cnpj_cpf,
  inscricao_estadual,
  pais_origem,
  endereco,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  cep,
  telefone,
  email,
  website,
  contato_nome,
  contato_telefone,
  contato_email,
  observacoes,
  is_active,
  created_at,
  updated_at,
  tenant_id
FROM bellows.fornecedor
ON DUPLICATE KEY UPDATE
  codigo = VALUES(codigo),
  razao_social = VALUES(razao_social),
  nome_fantasia = VALUES(nome_fantasia),
  cnpj_cpf = VALUES(cnpj_cpf),
  inscricao_estadual = VALUES(inscricao_estadual),
  pais_origem = VALUES(pais_origem),
  endereco = VALUES(endereco),
  numero = VALUES(numero),
  complemento = VALUES(complemento),
  bairro = VALUES(bairro),
  cidade = VALUES(cidade),
  estado = VALUES(estado),
  cep = VALUES(cep),
  telefone = VALUES(telefone),
  email = VALUES(email),
  website = VALUES(website),
  contato_nome = VALUES(contato_nome),
  contato_telefone = VALUES(contato_telefone),
  contato_email = VALUES(contato_email),
  observacoes = VALUES(observacoes),
  is_active = VALUES(is_active),
  created_at = VALUES(created_at),
  updated_at = VALUES(updated_at),
  tenant_id = VALUES(tenant_id);

SET @max_id := (SELECT IFNULL(MAX(id), 0) FROM aerosuite.fornecedor);
SET @sql_ai := CONCAT('ALTER TABLE aerosuite.fornecedor AUTO_INCREMENT = ', @max_id + 1);
PREPARE stmt_ai FROM @sql_ai;
EXECUTE stmt_ai;
DEALLOCATE PREPARE stmt_ai;

SET FOREIGN_KEY_CHECKS = 1;

SELECT COUNT(*) AS destino_depois FROM aerosuite.fornecedor;

SELECT id, codigo, razao_social, pais_origem
FROM aerosuite.fornecedor
ORDER BY id;

SELECT COUNT(*) AS registos_com_interrogacao
FROM aerosuite.fornecedor
WHERE razao_social LIKE '%?%'
   OR nome_fantasia LIKE '%?%'
   OR observacoes LIKE '%?%';
