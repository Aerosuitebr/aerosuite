-- Estoque mínimo e ideal por item (para indicador visual: verde/amarelo/vermelho)
-- Verde: quantidade >= estoque_ideal
-- Amarelo: quantidade entre estoque_minimo e estoque_ideal
-- Vermelho: quantidade <= estoque_minimo

ALTER TABLE item_estoque ADD COLUMN estoque_minimo DECIMAL(10,3) NULL;
ALTER TABLE item_estoque ADD COLUMN estoque_ideal DECIMAL(10,3) NULL;
