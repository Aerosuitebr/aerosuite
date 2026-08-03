-- Repara acentos corrompidos em funcionalidade (menu). Script manual: db/scripts/fix_funcionalidade_texto_utf8.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE funcionalidade SET
  nome = 'Cadastro de Publicação',
  descricao = 'Cadastrar novas publicações técnicas',
  secao = 'Publicações Técnicas',
  updated_at = NOW()
WHERE codigo = 'PUBLICACAO_CADASTRO'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%' OR secao LIKE '%?%' OR nome LIKE 'Cadastro de Publica%' OR descricao LIKE 'Cadastrar novas publica%');

UPDATE funcionalidade SET
  descricao = 'Editor de Documentos de Montagem de Produto Aeronáutico',
  updated_at = NOW()
WHERE codigo IN ('EDITOR_DOCUMENTOS', 'FCU_ASSEMBLY')
  AND (descricao LIKE '%?%' OR descricao LIKE '%Aeron%utico%');

UPDATE funcionalidade SET
  descricao = 'Gerenciar templates de produtos e serviços para propostas',
  updated_at = NOW()
WHERE codigo = 'templates-proposta' AND descricao LIKE '%?%';

UPDATE funcionalidade SET
  descricao = 'Criar e gerenciar propostas comerciais para clientes',
  updated_at = NOW()
WHERE codigo = 'propostas-comerciais'
  AND (descricao LIKE '%?%' OR descricao = codigo OR descricao LIKE 'propostas-%' OR descricao IS NULL OR TRIM(descricao) = '');

UPDATE funcionalidade SET descricao = REPLACE(descricao, 'publica????es', 'publicações') WHERE descricao LIKE '%publica????es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'publica??es', 'publicações') WHERE descricao LIKE '%publica??es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'publica?es', 'publicações') WHERE descricao LIKE '%publica?es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 't??cnicas', 'técnicas') WHERE descricao LIKE '%t??cnicas%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 't?cnicas', 'técnicas') WHERE descricao LIKE '%t?cnicas%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Aeron??utico', 'Aeronáutico') WHERE descricao LIKE '%Aeron??utico%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Aeron??uticos', 'Aeronáuticos') WHERE descricao LIKE '%Aeron??uticos%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Aeron?utico', 'Aeronáutico') WHERE descricao LIKE '%Aeron?utico%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'servi??os', 'serviços') WHERE descricao LIKE '%servi??os%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'servi?os', 'serviços') WHERE descricao LIKE '%servi?os%';

UPDATE funcionalidade SET nome = REPLACE(nome, 'Aeron??utico', 'Aeronáutico') WHERE nome LIKE '%Aeron??utico%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Calibra??o', 'Calibração') WHERE nome LIKE '%Calibra??o%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'N??o conformidades', 'Não conformidades') WHERE nome LIKE '%N??o conformidades%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Subcontrata??o', 'Subcontratação') WHERE nome LIKE '%Subcontrata??o%';

UPDATE funcionalidade SET secao = 'Publicações Técnicas'
WHERE secao LIKE '%?%' AND secao LIKE 'Publica%' AND secao LIKE '%T%cnica%';

UPDATE funcionalidade SET secao = 'Administração'
WHERE secao LIKE '%?%' AND secao LIKE 'Administra%';

UPDATE funcionalidade SET secao = 'Gestão'
WHERE secao LIKE '%?%' AND secao REGEXP '^Gest';
