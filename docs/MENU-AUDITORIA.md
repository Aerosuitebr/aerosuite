# Auditoria do menu — 27/10/2026

Foram comparados o catálogo da tabela funcionalidade do banco local, as rotas Angular, as regras de montagem/cache do menu e a navegação do plano de controle.

## Problemas encontrados e correções

- Arquivos Tipo Serviço: cadastro ativo e visível, mas ocultado pelo frontend. Filtro removido.
- Página inicial: cadastro Dashboard ocultado pelo frontend. Restaurado.
- Configurações: cadastro apontava para /test. Normalizado para /configuracoes.
- Publicações Técnicas: cadastro apontava para /publicacoes-tecnicas, sem tela correspondente. Normalizado para /publicacoes-tecnicas/cadastro, com deduplicação.
- 19 destinos sem entrada própria: incluídos por catálogo complementar, usando as permissões das rotas existentes (sem criar permissões nem alterar perfis).
- Onboarding: Central de boas-vindas já existia em /plataforma/boas-vindas, acessível apenas dentro do plano de controle. O menu principal passa a listar os nove destinos dessa área para usuários cuja elegibilidade já foi confirmada. Autenticação e MFA continuam exigidos; após autenticar, o destino selecionado é preservado e validado por lista de rotas permitidas.
- Cache: revisão incrementada para buscar o catálogo atualizado sem exigir novo login.

## Destinos complementares

| Destino | Rota |
| --- | --- |
| Página inicial | / |
| Meu perfil | /perfil |
| Carga dos mecânicos | /os/carga-mecanicos |
| Assinatura e faturamento | /billing |
| Privacidade e dados | /privacidade-dados |
| Hangares e recursos | /capacidade/hangares |
| Associação de usuários e perfis | /associacao-usuario-perfil |
| Consulta de permissões por usuário | /consulta-funcionalidades-usuario |
| Contingência e reconciliação | /conformidade/contingencia |
| Aceite de versões | /conformidade/releases |
| E-mails em cópia de propostas | /propostas-comerciais/cco-emails |
| Rastreio de saídas automáticas | /estoque/rastreio-saidas-automaticas |
| Impedimentos | /operacoes/impedimentos |
| Materiais e reservas | /operacoes/materiais |
| Compras operacionais | /operacoes/compras |
| Prontidão da OS | /operacoes/prontidao |
| Planejamento operacional | /operacoes/planejamento |
| Ferramentas | /operacoes/ferramentas |
| Reincidências e retornos | /operacoes/retornos |

## Critérios

- Aero Studio permanece fora do menu.
- Não conformidades (módulo antigo) permanece desativado por solicitação anterior. A rota redireciona para RNC.
- Permissões de ação sem tela própria (editar/excluir/emitir CRS) não viram links vazios.
- Formulários e detalhes dependentes de um registro continuam acessíveis pela tela principal do módulo; não se criam links sem ID ou token.
- Rotas públicas de login, recuperação, aceite legal e formulário de onboarding por token não são funcionalidades internas de navegação.
- O portal externo mantém sua navegação de clientes.
- Rotas do plano de controle aparecem apenas para usuários elegíveis; isso não concede acesso nem substitui MFA.
- Seções e funcionalidades continuam em ordem alfabética pelo nome traduzido.

## Validação

65 testes passaram: organização/cache do menu, catálogo complementar, destinos existentes, permissões, submódulos operacionais e navegação do plano de controle. Sete testes adicionais verificam o retorno após autenticação/MFA e rejeitam destinos externos ou não cadastrados. O teste de catálogo verifica os destinos e as permissões declaradas nas rotas Angular.
