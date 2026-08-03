-- Repara acentos corrompidos (?, ??) em funcionalidade.nome, descricao e secao.
-- Causa habitual: cliente mysql ou JDBC sem UTF-8 ao gravar textos acentuados.
--
-- Uso:
--   mysql --default-character-set=utf8mb4 -uroot -proot aerosuite < db/scripts/fix_funcionalidade_texto_utf8.sql
--   ou: .\scripts\repair-funcionalidade-accents.ps1
--
-- Antes de corrigir em producao, rode o diagnostico:
--   mysql ... < db/scripts/diagnose_utf8_corruption.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @db := DATABASE();

SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = 'funcionalidade') > 0,
  'ALTER TABLE funcionalidade CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ---------------------------------------------------------------------------
-- 1) Valores canonicos por codigo (fonte: migrations e db/scripts)
--    Aplica quando ha '?' na coluna ou descricao igual ao codigo (insert incompleto).
-- ---------------------------------------------------------------------------

UPDATE funcionalidade SET
  nome = 'Cadastro de Publicação',
  descricao = 'Cadastrar novas publicações técnicas',
  secao = 'Publicações Técnicas',
  updated_at = NOW()
WHERE codigo = 'PUBLICACAO_CADASTRO'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%' OR secao LIKE '%?%' OR nome LIKE 'Cadastro de Publica%' OR descricao LIKE 'Cadastrar novas publica%');

UPDATE funcionalidade SET
  nome = 'Publicações Técnicas',
  descricao = 'Gestão de Publicações Técnicas e ATAs',
  updated_at = NOW()
WHERE codigo = 'PUBLICACOES_TECNICAS'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%' OR secao LIKE '%?%');

UPDATE funcionalidade SET
  descricao = 'Associar Part Numbers às Publicações',
  secao = 'Publicações Técnicas',
  updated_at = NOW()
WHERE codigo = 'PUBLICACAO_ASSOCIAR_PN'
  AND (descricao LIKE '%?%' OR secao LIKE '%?%');

UPDATE funcionalidade SET
  descricao = 'Editor de Documentos de Montagem de Produto Aeronáutico',
  updated_at = NOW()
WHERE codigo IN ('EDITOR_DOCUMENTOS', 'FCU_ASSEMBLY')
  AND (descricao LIKE '%?%' OR descricao LIKE '%Aeron%utico%' OR descricao LIKE '%FCU%');

UPDATE funcionalidade SET
  nome = 'Produto Aeronáutico',
  descricao = 'Gerenciar Produtos Aeronáuticos',
  updated_at = NOW()
WHERE codigo = 'FCU'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%' OR nome LIKE '%Aeron%');

UPDATE funcionalidade SET
  nome = 'Definir Associação',
  descricao = 'Associar Produtos Aeronáuticos com produtos',
  updated_at = NOW()
WHERE codigo = 'ASSOCIACAO_FCU'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%');

UPDATE funcionalidade SET
  descricao = 'Gerenciar templates de produtos e serviços para propostas',
  updated_at = NOW()
WHERE codigo = 'templates-proposta'
  AND (descricao LIKE '%?%' OR descricao LIKE '%servi%');

UPDATE funcionalidade SET
  descricao = 'Criar e gerenciar propostas comerciais para clientes',
  updated_at = NOW()
WHERE codigo = 'propostas-comerciais'
  AND (descricao LIKE '%?%' OR descricao = codigo OR descricao LIKE 'propostas-%' OR descricao IS NULL OR TRIM(descricao) = '');

UPDATE funcionalidade SET
  descricao = 'Acessar a Central de Chamados e Suporte',
  updated_at = NOW()
WHERE codigo = 'suporte'
  AND descricao LIKE '%?%';

UPDATE funcionalidade SET
  descricao = 'Cadastro de Fornecedores',
  updated_at = NOW()
WHERE codigo = 'ESTOQUE_FORNECEDORES'
  AND descricao LIKE '%?%';

UPDATE funcionalidade SET
  nome = 'Tipos de Serviço',
  descricao = 'Gerenciar tipos de serviço',
  updated_at = NOW()
WHERE codigo = 'TIPOS_SERVICO'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%');

UPDATE funcionalidade SET
  descricao = 'Listar OS com Solicitação de Troca Eventual; detalhe e status somente leitura',
  updated_at = NOW()
WHERE codigo = 'CONSULTA_TROCAS_EVENTUAIS'
  AND descricao LIKE '%?%';

UPDATE funcionalidade SET
  nome = 'Documentos controlados',
  descricao = 'MOE, POP e procedimentos com revisão e vigência',
  secao = 'Administração',
  updated_at = NOW()
WHERE codigo = 'SGQ_DOCUMENTO_CONTROLADO'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%' OR secao LIKE '%?%');

UPDATE funcionalidade SET
  descricao = 'Registros de treinamento e reciclagem formal',
  secao = 'Administração',
  updated_at = NOW()
WHERE codigo = 'CONFORMIDADE_TREINAMENTO'
  AND (descricao LIKE '%?%' OR secao LIKE '%?%');

UPDATE funcionalidade SET
  nome = 'Calibração',
  descricao = 'Ferramentas e instrumentos calibrados',
  secao = 'Administração',
  updated_at = NOW()
WHERE codigo = 'CONFORMIDADE_CALIBRACAO'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%' OR secao LIKE '%?%');

UPDATE funcionalidade SET
  nome = 'Não conformidades',
  descricao = 'Ocorrências, NC e ações corretivas (SMS básico)',
  secao = 'Administração',
  updated_at = NOW()
WHERE codigo = 'CONFORMIDADE_NC'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%' OR secao LIKE '%?%');

UPDATE funcionalidade SET
  nome = 'Subcontratação',
  descricao = 'Oficinas subcontratadas Part 145',
  secao = 'Administração',
  updated_at = NOW()
WHERE codigo = 'CONFORMIDADE_SUBCONTRATACAO'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%' OR secao LIKE '%?%');

UPDATE funcionalidade SET
  nome = 'Usuários Externos',
  updated_at = NOW()
WHERE codigo IN ('usuarios-externos', 'USUARIOS_EXTERNOS')
  AND nome LIKE '%?%';

UPDATE funcionalidade SET
  nome = 'Usuários',
  descricao = 'Gerenciar usuários do sistema',
  updated_at = NOW()
WHERE codigo = 'USUARIOS'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%');

UPDATE funcionalidade SET
  nome = 'Configurações',
  descricao = 'Configurações do sistema',
  updated_at = NOW()
WHERE codigo = 'CONFIGURACOES'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%');

UPDATE funcionalidade SET
  nome = 'Gerenciar Permissões',
  descricao = 'Gerenciar permissões de funcionalidades por perfil',
  updated_at = NOW()
WHERE codigo = 'GERENCIAR_PERMISSOES'
  AND (nome LIKE '%?%' OR descricao LIKE '%?%');

UPDATE funcionalidade SET
  secao = 'Ações Rápidas',
  updated_at = NOW()
WHERE secao LIKE '%?%'
  AND (secao LIKE 'A%es R%pidas' OR secao REGEXP 'A[cç][oõ]es[[:space:]]*R[aá]pidas');

UPDATE funcionalidade SET secao = 'Gestão'
WHERE secao LIKE '%?%' AND secao REGEXP '^Gest';

UPDATE funcionalidade SET secao = 'Administração'
WHERE secao LIKE '%?%' AND secao LIKE 'Administra%';

UPDATE funcionalidade SET secao = 'Comunicação'
WHERE secao LIKE '%?%' AND secao LIKE 'Comunica%';

UPDATE funcionalidade SET secao = 'Publicações Técnicas'
WHERE secao LIKE '%?%' AND secao LIKE 'Publica%' AND secao LIKE '%T%cnica%';

UPDATE funcionalidade SET secao = 'Operacional'
WHERE secao LIKE '%?%'
  AND secao <> 'Operacional'
  AND (UPPER(TRIM(secao)) = 'OPERACIONAL' OR secao REGEXP '^Operac');

-- ---------------------------------------------------------------------------
-- 2) REPLACE generico (padroes ? e ??) em nome, descricao e secao
-- ---------------------------------------------------------------------------

UPDATE funcionalidade SET nome = REPLACE(nome, 'publica????es', 'publicações') WHERE nome LIKE '%publica????es%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'publica??es', 'publicações') WHERE nome LIKE '%publica??es%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'publica?es', 'publicações') WHERE nome LIKE '%publica?es%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Publica??es', 'Publicações') WHERE nome LIKE '%Publica??es%';
UPDATE funcionalidade SET nome = REPLACE(nome, 't??cnicas', 'técnicas') WHERE nome LIKE '%t??cnicas%';
UPDATE funcionalidade SET nome = REPLACE(nome, 't?cnicas', 'técnicas') WHERE nome LIKE '%t?cnicas%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Aeron??utico', 'Aeronáutico') WHERE nome LIKE '%Aeron??utico%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Aeron?utico', 'Aeronáutico') WHERE nome LIKE '%Aeron?utico%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'servi??os', 'serviços') WHERE nome LIKE '%servi??os%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'servi?os', 'serviços') WHERE nome LIKE '%servi?os%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Servi??os', 'Serviços') WHERE nome LIKE '%Servi??os%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Servi?os', 'Serviços') WHERE nome LIKE '%Servi?os%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Usu??rios', 'Usuários') WHERE nome LIKE '%Usu??rios%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Usu?rios', 'Usuários') WHERE nome LIKE '%Usu?rios%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Calibra??o', 'Calibração') WHERE nome LIKE '%Calibra??o%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Calibra?o', 'Calibração') WHERE nome LIKE '%Calibra?o%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'N??o conformidades', 'Não conformidades') WHERE nome LIKE '%N??o conformidades%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'N?o conformidades', 'Não conformidades') WHERE nome LIKE '%N?o conformidades%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Subcontrata??o', 'Subcontratação') WHERE nome LIKE '%Subcontrata??o%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Subcontrata?o', 'Subcontratação') WHERE nome LIKE '%Subcontrata?o%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Associa??o', 'Associação') WHERE nome LIKE '%Associa??o%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Associa?o', 'Associação') WHERE nome LIKE '%Associa?o%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Permiss??es', 'Permissões') WHERE nome LIKE '%Permiss??es%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Permiss?es', 'Permissões') WHERE nome LIKE '%Permiss?es%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Configura??es', 'Configurações') WHERE nome LIKE '%Configura??es%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Configura?es', 'Configurações') WHERE nome LIKE '%Configura?es%';

UPDATE funcionalidade SET descricao = REPLACE(descricao, 'publica????es', 'publicações') WHERE descricao LIKE '%publica????es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'publica??es', 'publicações') WHERE descricao LIKE '%publica??es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'publica?es', 'publicações') WHERE descricao LIKE '%publica?es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Publica??es', 'Publicações') WHERE descricao LIKE '%Publica??es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 't??cnicas', 'técnicas') WHERE descricao LIKE '%t??cnicas%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 't?cnicas', 'técnicas') WHERE descricao LIKE '%t?cnicas%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Aeron??utico', 'Aeronáutico') WHERE descricao LIKE '%Aeron??utico%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Aeron??uticos', 'Aeronáuticos') WHERE descricao LIKE '%Aeron??uticos%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Aeron?utico', 'Aeronáutico') WHERE descricao LIKE '%Aeron?utico%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Aeron?uticos', 'Aeronáuticos') WHERE descricao LIKE '%Aeron?uticos%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'servi??os', 'serviços') WHERE descricao LIKE '%servi??os%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'servi?os', 'serviços') WHERE descricao LIKE '%servi?os%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Servi??os', 'Serviços') WHERE descricao LIKE '%Servi??os%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Servi?os', 'Serviços') WHERE descricao LIKE '%Servi?os%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Gest??o', 'Gestão') WHERE descricao LIKE '%Gest??o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Gest?o', 'Gestão') WHERE descricao LIKE '%Gest?o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'revis??o', 'revisão') WHERE descricao LIKE '%revis??o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'revis?o', 'revisão') WHERE descricao LIKE '%revis?o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Ocorr??ncias', 'Ocorrências') WHERE descricao LIKE '%Ocorr??ncias%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Ocorr?ncias', 'Ocorrências') WHERE descricao LIKE '%Ocorr?ncias%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'a??es', 'ações') WHERE descricao LIKE '%a??es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'a?es', 'ações') WHERE descricao LIKE '%a?es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Solicita??o', 'Solicitação') WHERE descricao LIKE '%Solicita??o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Solicita?o', 'Solicitação') WHERE descricao LIKE '%Solicita?o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'permiss??es', 'permissões') WHERE descricao LIKE '%permiss??es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'permiss?es', 'permissões') WHERE descricao LIKE '%permiss?es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'usu??rios', 'usuários') WHERE descricao LIKE '%usu??rios%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'usu?rios', 'usuários') WHERE descricao LIKE '%usu?rios%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Configura??es', 'Configurações') WHERE descricao LIKE '%Configura??es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Configura?es', 'Configurações') WHERE descricao LIKE '%Configura?es%';

UPDATE funcionalidade SET secao = REPLACE(secao, 'Publica??es', 'Publicações') WHERE secao LIKE '%Publica??es%';
UPDATE funcionalidade SET secao = REPLACE(secao, 't??cnicas', 'técnicas') WHERE secao LIKE '%t??cnicas%';
UPDATE funcionalidade SET secao = REPLACE(secao, 't?cnicas', 'técnicas') WHERE secao LIKE '%t?cnicas%';
UPDATE funcionalidade SET secao = REPLACE(secao, 'Administra??o', 'Administração') WHERE secao LIKE '%Administra??o%';
UPDATE funcionalidade SET secao = REPLACE(secao, 'Administra?o', 'Administração') WHERE secao LIKE '%Administra?o%';
UPDATE funcionalidade SET secao = REPLACE(secao, 'Gest??o', 'Gestão') WHERE secao LIKE '%Gest??o%';
UPDATE funcionalidade SET secao = REPLACE(secao, 'Gest?o', 'Gestão') WHERE secao LIKE '%Gest?o%';
UPDATE funcionalidade SET secao = REPLACE(secao, 'Comunica??o', 'Comunicação') WHERE secao LIKE '%Comunica??o%';
UPDATE funcionalidade SET secao = REPLACE(secao, 'Comunica?o', 'Comunicação') WHERE secao LIKE '%Comunica?o%';
UPDATE funcionalidade SET secao = REPLACE(secao, 'A??es R??pidas', 'Ações Rápidas') WHERE secao LIKE '%A??es R%pidas%';
UPDATE funcionalidade SET secao = REPLACE(secao, 'A?es R?pidas', 'Ações Rápidas') WHERE secao LIKE '%A?es R%pidas%';

-- funcionalidade_externa (portal), se existir
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = 'funcionalidade_externa') > 0,
  'UPDATE funcionalidade_externa SET descricao = REPLACE(descricao, ''servi??os'', ''serviços'') WHERE descricao LIKE ''%servi??os%''',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ---------------------------------------------------------------------------
-- 3) Estoque, auditoria e padroes ?? residuais
-- ---------------------------------------------------------------------------

UPDATE funcionalidade SET nome = 'Arquivos Tipo Serviço', descricao = 'Gerenciar arquivos de tipos de serviço', updated_at = NOW()
WHERE codigo = 'ARQUIVOS_TIPO_SERVICO';

UPDATE funcionalidade SET descricao = 'Consulta de histórico de alterações em Ordens de Serviço', updated_at = NOW()
WHERE codigo = 'AUDITORIA_OS';

UPDATE funcionalidade SET descricao = 'Chat interno para comunicação entre usuários', updated_at = NOW()
WHERE codigo = 'chat';

UPDATE funcionalidade SET descricao = 'Permissão para criar produtos', updated_at = NOW()
WHERE codigo = 'CREATE_PRODUTO';

UPDATE funcionalidade SET descricao = 'Página inicial do sistema', updated_at = NOW()
WHERE codigo = 'DASHBOARD';

UPDATE funcionalidade SET descricao = 'Permissão para excluir produtos', updated_at = NOW()
WHERE codigo = 'DELETE_PRODUTO';

UPDATE funcionalidade SET descricao = 'Permissão para editar produtos', updated_at = NOW()
WHERE codigo = 'EDIT_PRODUTO';

UPDATE funcionalidade SET descricao = 'Visão geral do estoque', updated_at = NOW()
WHERE codigo = 'ESTOQUE_DASHBOARD';

UPDATE funcionalidade SET descricao = 'Documentos de Importação', updated_at = NOW()
WHERE codigo = 'ESTOQUE_INVOICES';

UPDATE funcionalidade SET nome = 'Estoque Mín. (Lote)', descricao = 'Importar planilha CSV para estoque mínimo/ideal', updated_at = NOW()
WHERE codigo = 'ESTOQUE_MINIMO_LOTE';

UPDATE funcionalidade SET nome = 'Movimentações', descricao = 'Histórico de Movimentações', updated_at = NOW()
WHERE codigo = 'ESTOQUE_MOVIMENTACOES';

UPDATE funcionalidade SET nome = 'Ordem de Serviço', descricao = 'Gerenciar Ordens de Serviço', updated_at = NOW()
WHERE codigo = 'ORDEM_SERVICO';

UPDATE funcionalidade SET descricao = 'Gerenciar perfis de usuário', updated_at = NOW()
WHERE codigo = 'PERFIS';

UPDATE funcionalidade SET nome = 'Relatório', descricao = 'Gerar relatórios do sistema', updated_at = NOW()
WHERE codigo = 'RELATORIO';

UPDATE funcionalidade SET descricao = 'Permissão para visualizar o dashboard', updated_at = NOW()
WHERE codigo = 'VIEW_DASHBOARD';

UPDATE funcionalidade SET descricao = 'Permissão para visualizar produtos', updated_at = NOW()
WHERE codigo = 'VIEW_PRODUTO';

UPDATE funcionalidade SET nome = REPLACE(nome, 'Servi??o', 'Serviço') WHERE nome LIKE '%Servi??o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'servi??o', 'serviço') WHERE descricao LIKE '%servi??o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Servi??o', 'Serviço') WHERE descricao LIKE '%Servi??o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Permiss??o', 'Permissão') WHERE descricao LIKE '%Permiss??o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'P??gina', 'Página') WHERE descricao LIKE '%P??gina%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'hist??rico', 'histórico') WHERE descricao LIKE '%hist??rico%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'altera????es', 'alterações') WHERE descricao LIKE '%altera????es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'comunica????o', 'comunicação') WHERE descricao LIKE '%comunica????o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Vis??o', 'Visão') WHERE descricao LIKE '%Vis??o%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Importa????o', 'Importação') WHERE descricao LIKE '%Importa????o%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'M??n.', 'Mín.') WHERE nome LIKE '%M??n.%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'm??nimo', 'mínimo') WHERE descricao LIKE '%m??nimo%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Movimenta????es', 'Movimentações') WHERE nome LIKE '%Movimenta????es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Hist??rico', 'Histórico') WHERE descricao LIKE '%Hist??rico%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'Movimenta????es', 'Movimentações') WHERE descricao LIKE '%Movimenta????es%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'usu??rio', 'usuário') WHERE descricao LIKE '%usu??rio%';
UPDATE funcionalidade SET nome = REPLACE(nome, 'Relat??rio', 'Relatório') WHERE nome LIKE '%Relat??rio%';
UPDATE funcionalidade SET descricao = REPLACE(descricao, 'relat??rios', 'relatórios') WHERE descricao LIKE '%relat??rios%';

-- ---------------------------------------------------------------------------
-- 4) Relatorio pos-correcao
-- ---------------------------------------------------------------------------

SELECT 'funcionalidade com ? restante' AS relatorio,
       codigo, nome, descricao, secao
FROM funcionalidade
WHERE nome LIKE '%?%' OR descricao LIKE '%?%' OR secao LIKE '%?%'
ORDER BY codigo;

SELECT 'fix_funcionalidade_texto_utf8 concluido' AS resultado;
