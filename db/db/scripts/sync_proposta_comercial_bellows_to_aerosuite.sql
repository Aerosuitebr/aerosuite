-- Sincroniza propostas comerciais: bellows (UTF-8 correto) -> aerosuite.
-- Tabelas: proposta_comercial, proposta_comercial_item, proposta_comercial_envio.
-- Preserva IDs para manter vínculos com OS, portal e histórico de envios.
-- Colunas exclusivas de aerosuite (os_id, cliente_decisao_*) não são sobrescritas no UPDATE.
--
-- Uso: mysql --default-character-set=utf8mb4 -uroot -p < db/scripts/sync_proposta_comercial_bellows_to_aerosuite.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aerosuite;

SELECT COUNT(*) AS origem_bellows FROM bellows.proposta_comercial;
SELECT COUNT(*) AS destino_antes FROM aerosuite.proposta_comercial;

SET @bellows_pc := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = 'bellows' AND table_name = 'proposta_comercial'
);
SELECT IF(@bellows_pc = 0, 'ERRO: tabela bellows.proposta_comercial nao existe', 'OK: origem encontrada') AS check_origem;

SET FOREIGN_KEY_CHECKS = 0;

-- ========== proposta_comercial ==========
INSERT INTO aerosuite.proposta_comercial (
  id,
  numero_proposta,
  produto_nome,
  produto_pn,
  produto_sn,
  produto_manual,
  produto_valor,
  aplicacao_motor,
  aeronave_prefixo,
  servico_executado,
  id_tipo_servico,
  tipo_servico_nome,
  cliente_nome,
  cliente_cnpj_cpf,
  cliente_email,
  cliente_telefone,
  cliente_endereco,
  cliente_cidade,
  cliente_estado,
  cliente_cep,
  cliente_contato,
  data_proposta,
  validade_proposta,
  prazo_entrega,
  forma_pagamento,
  observacoes,
  condicoes_gerais,
  status,
  created_at,
  updated_at,
  created_by,
  assinatura_nome,
  assinatura_estilo,
  assinatura_font_family,
  assinatura_color,
  assinatura_timestamp,
  cliente_bairro,
  desconto_tipo,
  desconto_percentual,
  desconto_valor_fixo,
  desconto_valor_calculado,
  valor_total_final,
  frete_brl,
  mao_de_obra_brl,
  cotacao_dolar,
  data_cotacao,
  frete_usd,
  mao_de_obra_usd,
  subtotal_produtos_usd,
  total_geral_usd,
  cliente_observacao,
  tenant_id
)
SELECT
  id,
  numero_proposta,
  produto_nome,
  produto_pn,
  produto_sn,
  produto_manual,
  produto_valor,
  aplicacao_motor,
  aeronave_prefixo,
  servico_executado,
  id_tipo_servico,
  tipo_servico_nome,
  cliente_nome,
  cliente_cnpj_cpf,
  cliente_email,
  cliente_telefone,
  cliente_endereco,
  cliente_cidade,
  cliente_estado,
  cliente_cep,
  cliente_contato,
  data_proposta,
  validade_proposta,
  prazo_entrega,
  forma_pagamento,
  observacoes,
  condicoes_gerais,
  status,
  created_at,
  updated_at,
  created_by,
  assinatura_nome,
  assinatura_estilo,
  assinatura_font_family,
  assinatura_color,
  assinatura_timestamp,
  cliente_bairro,
  desconto_tipo,
  desconto_percentual,
  desconto_valor_fixo,
  desconto_valor_calculado,
  valor_total_final,
  frete_brl,
  mao_de_obra_brl,
  cotacao_dolar,
  data_cotacao,
  frete_usd,
  mao_de_obra_usd,
  subtotal_produtos_usd,
  total_geral_usd,
  cliente_observacao,
  tenant_id
FROM bellows.proposta_comercial
ON DUPLICATE KEY UPDATE
  numero_proposta = VALUES(numero_proposta),
  produto_nome = VALUES(produto_nome),
  produto_pn = VALUES(produto_pn),
  produto_sn = VALUES(produto_sn),
  produto_manual = VALUES(produto_manual),
  produto_valor = VALUES(produto_valor),
  aplicacao_motor = VALUES(aplicacao_motor),
  aeronave_prefixo = VALUES(aeronave_prefixo),
  servico_executado = VALUES(servico_executado),
  id_tipo_servico = VALUES(id_tipo_servico),
  tipo_servico_nome = VALUES(tipo_servico_nome),
  cliente_nome = VALUES(cliente_nome),
  cliente_cnpj_cpf = VALUES(cliente_cnpj_cpf),
  cliente_email = VALUES(cliente_email),
  cliente_telefone = VALUES(cliente_telefone),
  cliente_endereco = VALUES(cliente_endereco),
  cliente_cidade = VALUES(cliente_cidade),
  cliente_estado = VALUES(cliente_estado),
  cliente_cep = VALUES(cliente_cep),
  cliente_contato = VALUES(cliente_contato),
  data_proposta = VALUES(data_proposta),
  validade_proposta = VALUES(validade_proposta),
  prazo_entrega = VALUES(prazo_entrega),
  forma_pagamento = VALUES(forma_pagamento),
  observacoes = VALUES(observacoes),
  condicoes_gerais = VALUES(condicoes_gerais),
  status = VALUES(status),
  created_at = VALUES(created_at),
  updated_at = VALUES(updated_at),
  created_by = VALUES(created_by),
  assinatura_nome = VALUES(assinatura_nome),
  assinatura_estilo = VALUES(assinatura_estilo),
  assinatura_font_family = VALUES(assinatura_font_family),
  assinatura_color = VALUES(assinatura_color),
  assinatura_timestamp = VALUES(assinatura_timestamp),
  cliente_bairro = VALUES(cliente_bairro),
  desconto_tipo = VALUES(desconto_tipo),
  desconto_percentual = VALUES(desconto_percentual),
  desconto_valor_fixo = VALUES(desconto_valor_fixo),
  desconto_valor_calculado = VALUES(desconto_valor_calculado),
  valor_total_final = VALUES(valor_total_final),
  frete_brl = VALUES(frete_brl),
  mao_de_obra_brl = VALUES(mao_de_obra_brl),
  cotacao_dolar = VALUES(cotacao_dolar),
  data_cotacao = VALUES(data_cotacao),
  frete_usd = VALUES(frete_usd),
  mao_de_obra_usd = VALUES(mao_de_obra_usd),
  subtotal_produtos_usd = VALUES(subtotal_produtos_usd),
  total_geral_usd = VALUES(total_geral_usd),
  cliente_observacao = VALUES(cliente_observacao),
  tenant_id = VALUES(tenant_id);

SET @max_pc := (SELECT IFNULL(MAX(id), 0) FROM aerosuite.proposta_comercial);
SET @sql_pc := CONCAT('ALTER TABLE aerosuite.proposta_comercial AUTO_INCREMENT = ', @max_pc + 1);
PREPARE stmt_pc FROM @sql_pc;
EXECUTE stmt_pc;
DEALLOCATE PREPARE stmt_pc;

-- ========== proposta_comercial_item ==========
INSERT INTO aerosuite.proposta_comercial_item (
  id,
  id_proposta_comercial,
  produto_nome,
  produto_descricao,
  produto_pn,
  produto_sn,
  quantidade,
  valor_unitario,
  valor_total,
  ordem,
  created_at,
  updated_at
)
SELECT
  id,
  id_proposta_comercial,
  produto_nome,
  produto_descricao,
  produto_pn,
  produto_sn,
  quantidade,
  valor_unitario,
  valor_total,
  ordem,
  created_at,
  updated_at
FROM bellows.proposta_comercial_item
ON DUPLICATE KEY UPDATE
  id_proposta_comercial = VALUES(id_proposta_comercial),
  produto_nome = VALUES(produto_nome),
  produto_descricao = VALUES(produto_descricao),
  produto_pn = VALUES(produto_pn),
  produto_sn = VALUES(produto_sn),
  quantidade = VALUES(quantidade),
  valor_unitario = VALUES(valor_unitario),
  valor_total = VALUES(valor_total),
  ordem = VALUES(ordem),
  created_at = VALUES(created_at),
  updated_at = VALUES(updated_at);

DELETE FROM aerosuite.proposta_comercial_item
WHERE id NOT IN (SELECT id FROM bellows.proposta_comercial_item);

SET @max_item := (SELECT IFNULL(MAX(id), 0) FROM aerosuite.proposta_comercial_item);
SET @sql_item := CONCAT('ALTER TABLE aerosuite.proposta_comercial_item AUTO_INCREMENT = ', @max_item + 1);
PREPARE stmt_item FROM @sql_item;
EXECUTE stmt_item;
DEALLOCATE PREPARE stmt_item;

-- ========== proposta_comercial_envio ==========
INSERT INTO aerosuite.proposta_comercial_envio (
  id,
  id_proposta_comercial,
  tipo_envio,
  canal,
  destinatario_email,
  destinatario_telefone,
  destinatario_nome,
  remetente_email,
  remetente_telefone,
  remetente_nome,
  assunto,
  mensagem_adicional,
  status,
  mensagem_erro,
  data_envio,
  created_at,
  updated_at
)
SELECT
  id,
  id_proposta_comercial,
  tipo_envio,
  canal,
  destinatario_email,
  destinatario_telefone,
  destinatario_nome,
  remetente_email,
  remetente_telefone,
  remetente_nome,
  assunto,
  mensagem_adicional,
  status,
  mensagem_erro,
  data_envio,
  created_at,
  updated_at
FROM bellows.proposta_comercial_envio
ON DUPLICATE KEY UPDATE
  id_proposta_comercial = VALUES(id_proposta_comercial),
  tipo_envio = VALUES(tipo_envio),
  canal = VALUES(canal),
  destinatario_email = VALUES(destinatario_email),
  destinatario_telefone = VALUES(destinatario_telefone),
  destinatario_nome = VALUES(destinatario_nome),
  remetente_email = VALUES(remetente_email),
  remetente_telefone = VALUES(remetente_telefone),
  remetente_nome = VALUES(remetente_nome),
  assunto = VALUES(assunto),
  mensagem_adicional = VALUES(mensagem_adicional),
  status = VALUES(status),
  mensagem_erro = VALUES(mensagem_erro),
  data_envio = VALUES(data_envio),
  created_at = VALUES(created_at),
  updated_at = VALUES(updated_at);

DELETE FROM aerosuite.proposta_comercial_envio
WHERE id NOT IN (SELECT id FROM bellows.proposta_comercial_envio);

SET @max_env := (SELECT IFNULL(MAX(id), 0) FROM aerosuite.proposta_comercial_envio);
SET @sql_env := CONCAT('ALTER TABLE aerosuite.proposta_comercial_envio AUTO_INCREMENT = ', @max_env + 1);
PREPARE stmt_env FROM @sql_env;
EXECUTE stmt_env;
DEALLOCATE PREPARE stmt_env;

SET FOREIGN_KEY_CHECKS = 1;

SELECT COUNT(*) AS destino_depois FROM aerosuite.proposta_comercial;
SELECT COUNT(*) AS itens_depois FROM aerosuite.proposta_comercial_item;
SELECT COUNT(*) AS envios_depois FROM aerosuite.proposta_comercial_envio;

SELECT id, numero_proposta, cliente_nome, status
FROM aerosuite.proposta_comercial
ORDER BY id
LIMIT 10;

SELECT COUNT(*) AS registos_com_interrogacao
FROM aerosuite.proposta_comercial
WHERE cliente_nome LIKE '%?%'
   OR produto_nome LIKE '%?%'
   OR servico_executado LIKE '%?%'
   OR observacoes LIKE '%?%';
