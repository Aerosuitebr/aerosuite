-- Cada item de menu do RNC abre um caminho próprio.
-- O menu trata a rota como um único segmento e codifica "?" ,
-- então Tratar, Encerrar e Relatório não podem usar query string.

UPDATE funcionalidade
SET rota = '/nrc/tratar', updated_at = NOW()
WHERE codigo = 'NRC_ANALISAR';

UPDATE funcionalidade
SET rota = '/nrc/encerrar', updated_at = NOW()
WHERE codigo = 'NRC_ENCERRAR';

UPDATE funcionalidade
SET rota = '/nrc/relatorio', updated_at = NOW()
WHERE codigo = 'NRC_RELATORIO';

UPDATE funcionalidade
SET secao = 'RNC', updated_at = NOW()
WHERE codigo LIKE 'NRC%';
