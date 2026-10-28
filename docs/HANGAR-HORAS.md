# Histórico de horas do Hangar

A aba Horas apresenta uma tabela com data, duração, atividade, ferramenta/instrumento, colaborador e estado. O total registrado no servidor é destacado em um cartão; horas filtradas e horas aguardando sincronização são calculadas separadamente.

Filtros por dia e colaborador podem ser combinados. O seletor de agrupamento permite visualizar todos os registros juntos, separados por dia ou por colaborador, com subtotais dos registros confirmados e das pendências locais. A ordenação temporal usa os dias mais recentes primeiro.

A origem online/offline histórica não é armazenada na API atual. Descrições contendo termos como smoke ou offline são preservadas como texto e não são usadas para inventar origem, atividade ou status. Registros retornados pela API são identificados como registrados; a fila local real informa os apontamentos ainda aguardando sincronização, sem atribuir um autor ainda não confirmado pelo servidor.

O formulário de lançamento permanece abaixo do histórico. A tabela tem cabeçalho fixo, linhas alternadas, foco para navegação/rolagem por teclado e rolagem local em telas estreitas. Não houve alteração nem exclusão de registros existentes.

Validação: build Angular e 21 testes do Hangar aprovados (8 de horas, 8 de assinaturas e 5 do quadro). Os testes de horas verificam filtros combinados, agrupamentos, subtotais, pendências separadas, precisão decimal, ausência de autor e preservação dos dados originais.
