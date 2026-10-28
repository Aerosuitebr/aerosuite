# Aba Execução do Hangar

A aba separa início e conclusão em dois blocos responsivos. Um único botão, no rodapé, grava os dois blocos. O início pode ser registrado antes de preencher a conclusão; os campos mantêm a compatibilidade com registros textuais e datas já existentes.

O resumo usa dados carregados da OS: marcos informados, horas registradas e quantidade de assinaturas. Término informado não é apresentado como aprovação técnica ou emissão de CRS.

A linha de origem de proposta comercial é exibida como metadado de leitura. O prefixo é separado somente quando corresponde ao formato gerado pelo sistema em português, inglês, espanhol ou francês, no começo do texto. No salvamento, o prefixo original é reinserido, preservando a rastreabilidade e o armazenamento legado. Observações livres não são classificadas como metadados.

A barra de gravação distingue alterações ainda não salvas, gravação em andamento, gravação confirmada e pendência de sincronização offline. Atualizações de outras abas preservam rascunhos da execução. Respostas atrasadas de leitura ou gravação são ignoradas quando o usuário já abriu outra OS.

Validação: 34 testes do Hangar aprovados (8 de metadados de execução, 5 de gravação, 8 de horas, 8 de assinaturas e 5 do quadro). Build Angular aprovado. Nenhuma migração ou alteração destrutiva de dados foi necessária.
