# Padronização de páginas — 27/10/2026

## Contrato visual

- Banner navy compartilhado e título legível, colado ao topo da área de conteúdo, sem margem ou padding externo acima.
- Reutilização de cabeçalhos existentes, preservando seus controles e traduções.
- Banner compartilhado criado quando a tela não possui cabeçalho próprio.
- Contêiner da página sem limite máximo de largura, preenchendo a área disponível do layout.
- Diálogos, cartões, campos de entrada e folhas de impressão preservam suas dimensões apropriadas.
- Rolagem vertical no conteúdo e tabelas com rolagem local quando necessário.

## Cobertura

A diretiva SystemPageLayoutDirective está aplicada ao outlet raiz e aos outlets dos layouts principal, Estoque, Suporte, portal externo e plano de controle. Layouts contêineres delegam o tratamento aos seus próprios outlets, evitando banners duplicados. O observador de conteúdo roda fora da zona de detecção de mudanças do Angular para evitar renderizações repetidas.

O padrão global que tornava os banners transparentes foi corrigido. Hangar e Carga de mecânicos passaram a usar o PageHeroComponent. Trocas pendentes deixou de limitar a página a 960px. A grade de filtros da Auditoria de OS passou a se adaptar ao espaço real, com quebra de linha nas ações.

## Validação

- Build Angular aprovado.
- 79 testes selecionados aprovados (menu, permissões, plano de controle e módulos operacionais).
- Conferência de 92 rotas acessíveis na sessão do administrador, incluindo todas as 17 entradas de OS, cadastros e seus formulários, Qualidade, Comercial, RNC, Estoque, Suporte e Chat.
- Verificação no navegador de presença do banner, largura do componente e ausência de estouro horizontal. A primeira passagem identificou um estouro nos filtros de Auditoria de OS, corrigido na grade responsiva.
- Perfil foi conferido novamente após a correção do observador.
- Páginas que exigem uma sessão externa de cliente, elevação MFA ou um registro/token específico receberam o padrão pelo layout compartilhado; não foi efetuado login nessas áreas nem criado dado para a conferência visual.

O relatório de medições do navegador fica em layout-audit.json nos artefatos desta conversa.
