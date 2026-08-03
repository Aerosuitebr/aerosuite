-- Opcional: se a coluna observacoes ainda for VARCHAR(2000), execute no MySQL para textos longos na Observação da proposta.
ALTER TABLE proposta_comercial MODIFY COLUMN observacoes TEXT NULL;
