-- Relatório 6 (Sessão 4) — alinhamentos de schema e texto UTF-8.

-- S4-07: limite real do nome do produto alinhado ao frontend (255).
ALTER TABLE product MODIFY COLUMN name VARCHAR(255) NULL;

-- S4-20 / S4-27: reparo de acentos corrompidos no portal externo.
UPDATE funcionalidade_externa
SET nome = 'Minhas Ordens de Serviço'
WHERE codigo = 'os-externa'
  AND (nome LIKE '%??%' OR nome LIKE '%Servi%o%' OR nome <> 'Minhas Ordens de Serviço');

UPDATE funcionalidade_externa
SET descricao = 'Visualizar ordens de serviço associadas'
WHERE codigo = 'os-externa'
  AND (descricao LIKE '%??%' OR descricao LIKE '%servi%o associad%');

UPDATE funcionalidade_externa
SET descricao = 'Página inicial promocional'
WHERE codigo = 'home-externa'
  AND (descricao LIKE '%??%' OR descricao LIKE '%P%gina%');

-- S4-16: rastrear envio do convite de primeiro acesso.
ALTER TABLE usuario_externo
    ADD COLUMN convite_enviado_em DATETIME NULL COMMENT 'Data/hora do e-mail de primeiro acesso enviado com sucesso';
