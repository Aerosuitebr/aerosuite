-- Garante que as tabelas do módulo Estoque usem id AUTO_INCREMENT (para entidades com @GeneratedValue(IDENTITY)).
-- Execute se ao salvar entrada de mercadoria, Invoice, Lote ou Invoice Item aparecer erro de tabela *_seq não existir ou "Could not apply work".

ALTER TABLE invoice MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE lote MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE invoice_item MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE item_estoque MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE movimentacao_estoque MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;
