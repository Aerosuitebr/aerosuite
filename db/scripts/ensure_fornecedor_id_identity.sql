-- Garante que a tabela fornecedor use id AUTO_INCREMENT (para entidade com @GeneratedValue(IDENTITY)).
-- Execute se o cadastro de fornecedor falhar com erro de sequência; depois reconstrua o backend.

ALTER TABLE fornecedor MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
