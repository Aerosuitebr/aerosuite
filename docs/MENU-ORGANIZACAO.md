# Organização do menu por fluxo de trabalho

O menu do usuário foi consolidado em sete seções. São apresentadas somente as funcionalidades que já chegam autorizadas do servidor. O agrupamento é de navegação: não altera permissões, códigos, rotas nem o cadastro de funcionalidades no banco.

| Seção | Conteúdo |
| --- | --- |
| OS | Ordens de serviço, capacidade, hangar/job card, Central operacional, painel de fluxo, bipagem, etiquetas e trocas |
| Estoque | Operações de recebimento, itens, invoices, saídas, quarentena e rastreio |
| Comercial | Propostas e Aero Studio |
| Cadastros | Produtos, fabricantes, tipos de serviço, fornecedores, lotes, usuários, perfis, funcionalidades, estações, hangares, publicações, associações e modelos |
| Técnica e documentos | AD/SB, consultas técnicas, biblioteca e editor |
| Administração | Auditorias e relatórios de todos os módulos, resultados por OS, controles técnicos, configurações, integrações e acessos |
| Ajuda e comunicação | Chat, atendimento, chamados, suporte e vídeos de treinamento |

Cadastros possui quatro divisões: Produtos e serviços; Pessoas e acessos; Estrutura da oficina; Publicações e modelos.

Administração possui quatro divisões internas: Auditorias e relatórios; Controles técnicos; Configurações e integrações; Usuários e acessos. Funcionalidades futuras não mapeadas continuam visíveis em uma divisão compatível; não são descartadas.

Estações e hangares ficam em Cadastros. Ajustes do fluxo ficam em Administração. Bipagem, consulta do fluxo e impressão de etiquetas ficam em OS. As exceções administrativas são classificadas antes dos prefixos operacionais.

Links repetidos para o mesmo destino aparecem uma vez. O catálogo de autorização permanece intacto. O plano de controle da plataforma continua separado do menu do tenant e conserva suas proteções atuais.

A ordem das seções é operacional. Os itens de OS seguem o ciclo de trabalho; os demais são ordenados por nome dentro de seu grupo. A seção ativa usa a correspondência de rota mais específica.

A organização está centralizada em `frontend/src/app/core/menu-organization.ts`. A revisão do cache força atualização dos menus existentes e reagrupa menus de sessões anteriores. Os nomes das seções e divisões têm traduções em português, inglês, espanhol e francês.