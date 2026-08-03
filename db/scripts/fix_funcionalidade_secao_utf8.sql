-- Corrige textos de secao/nome com mojibake comum (apos garantir UTF-8 na conexao).
-- Para reparo completo (nome + descricao + secao), prefira:
--   db/scripts/fix_funcionalidade_texto_utf8.sql
--   ou: .\scripts\repair-funcionalidade-accents.ps1
-- Executar com: mysql --default-character-set=utf8mb4 ...

SET NAMES utf8mb4;

UPDATE funcionalidade SET secao = 'Publicações Técnicas'
WHERE secao LIKE '%Publica%' AND secao LIKE '%T%cnica%' AND secao NOT LIKE 'Publicações Técnicas';

UPDATE funcionalidade SET secao = 'Administração'
WHERE secao LIKE 'Administra%' AND secao <> 'Administração';

UPDATE funcionalidade SET nome = 'Usuários Externos'
WHERE codigo IN ('usuarios-externos', 'USUARIOS_EXTERNOS') AND nome LIKE 'Usu%rio%';

UPDATE funcionalidade SET nome = 'Cadastro de Publicação'
WHERE codigo = 'PUBLICACAO_CADASTRO' AND nome LIKE 'Cadastro de Publica%';

UPDATE funcionalidade SET secao = 'Ações Rápidas'
WHERE secao REGEXP 'A[cç][oõ]es[[:space:]]*R[aá]pidas' OR secao LIKE 'A%es R%pidas' OR secao LIKE 'A??%R%pidas';

UPDATE funcionalidade SET secao = 'Gestão'
WHERE secao REGEXP '^Gest[aã]o$' OR secao LIKE 'Gest%' AND secao NOT IN ('Gestão', 'Gestao');

UPDATE funcionalidade SET secao = 'Comunicação'
WHERE secao LIKE 'Comunica%' AND secao NOT IN ('Comunicação', 'Comunicacao');

UPDATE funcionalidade SET secao = 'Operacional'
WHERE secao <> 'Operacional'
  AND (
    UPPER(TRIM(secao)) = 'OPERACIONAL'
    OR UPPER(TRIM(secao)) IN ('OPERACAO', 'OPERACOES')
    OR secao REGEXP '^Operac'
  );

UPDATE funcionalidade SET secao = 'Publicações Técnicas'
WHERE secao LIKE 'Publica%T%cnica%' AND secao NOT LIKE 'Publicações Técnicas';
