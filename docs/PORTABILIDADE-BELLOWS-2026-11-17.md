# Atualização Bellows → AeroSuite — 17/11/2026

Origem: alterações do Bellows Fullstack posteriores a `250dd95`, até `fc27f9b`, incluindo o trabalho local de ferramentas por PN existente em 17/11/2026. As funcionalidades de estações e ferramentaria já integradas no AeroSuite foram preservadas.

## Módulos atualizados

- **OS / estoque:** opção “Não atualizar Estoque”, marcada inicialmente, dispensa consulta de déficit e baixa automática do kit na criação e na inclusão posterior de FCU. Desmarcada, mantém a confirmação de déficit. O diálogo fica acima do formulário da OS.
- **Publicações / Biblioteca:** PN do Manual separado do Tipo de Manual, preenchimento pela publicação vinculada ao FCU e acesso do perfil Biblioteca à gestão de arquivos da OS.
- **Comercial:** solicitação de serviços FORM-MNT-045, link público de aceite/recusa, registro do responsável, data, IP e declaração. O aceite público autoriza a proposta sem criar OS automaticamente. Há acesso ao formulário pelo portal externo e pré-preenchimento da OS a partir da proposta.
- **Envio de propostas:** seleção de canal, condições comerciais predefinidas, cotação PTAX consultada pelo backend e sessão temporária de WhatsApp com QR e alternativa PDF/WhatsApp manual. A sessão depende da configuração existente `whatsapp.api.enabled`, `whatsapp.api.url` e `whatsapp.api.token`.
- **Ferramentaria:** vínculos de ferramentas por PN, consulta do plano na OS e no fluxo, solicitação pelo mecânico responsável e preparação/conferência no balcão.
- **Interface:** controle de tela cheia nos cabeçalhos das páginas.

## Adaptações do AeroSuite

Os novos vínculos têm discriminador de organização; a busca SQL de PN filtra todas as fontes pelo tenant. As sessões de WhatsApp ficam vinculadas à organização e ao usuário criador. O link público resolve o tenant pelo token antes de abrir a sessão Hibernate; o token é validado e as operações de aceite usam bloqueio de escrita para serializar decisões concorrentes.

Foram mantidos JWT, permissões, portal comercial existente, moedas BRL/USD/EUR e identidade comercial configurada. Dados fixos da Bellows, endereço e selos não são exibidos na página pública do AeroSuite. Não foram importados dados operacionais nem alteradas permissões de usuários externos por migração.

## Banco de dados

Migrações preparadas, sem execução em banco nesta tarefa:

| Migração | Finalidade |
| --- | --- |
| V108 | Ampliar IP de origem na auditoria da OS |
| V109 | Solicitação de serviços e evidências de aceite na proposta |
| V110 | PN do Manual na publicação e Tipo de Manual na OS |
| V111 | Corrigir referência de manual das OS legadas |
| V112 | Vínculos por PN e rastreabilidade da solicitação de ferramentas |

O `frontend.url` deve apontar para a URL pública do AeroSuite para gerar links de aceite corretos.

## Validação

- Build Angular em configuração de desenvolvimento.
- Suíte frontend: **229 testes aprovados**, em 29 arquivos, incluindo estoque da OS e conversões BRL/USD/EUR do aceite público.
- Backend: compilação e **30 testes selecionados aprovados**, abrangendo resolução de tenant pelo token, regras de ferramentas, conferência, terminais e etapas das estações.
- O teste com Mockito foi executado com o agente Byte Buddy fornecido na inicialização da JVM, pois o attach dinâmico não funcionou neste ambiente.
- O empacotamento Quarkus passou fora do sandbox. No sandbox, tanto o formato padrão quanto a tentativa de uber-jar encontraram `ReadOnlyFileSystemException`.

Envio real de e-mail/WhatsApp, aplicação das migrações e operação ponta a ponta com banco não foram executados nesta tarefa.
