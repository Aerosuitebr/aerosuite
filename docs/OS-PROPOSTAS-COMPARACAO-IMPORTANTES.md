# OS e propostas comerciais — comparação com C:\Importantes

Comparação realizada em 23/10/2026. O destino das alterações é `backend/src` e `frontend/src` do AeroSuite. As cópias antigas em subdiretórios duplicados não são a aplicação principal e foram preservadas.

## Fontes e critério de integração

- `C:\Importantes\frontend\src - frontend\app`: referência mais completa das telas de OS e propostas.
- `C:\Importantes\frontend\src\app`: conferência das variantes de telas e estilos.
- `C:\Importantes\backend\src\main`: fontes e migrações disponíveis da referência.

O backend da referência está incompleto: contém `OsFluxoResource`, mas não contém os serviços, DTOs e entidades importados por esse recurso. Por isso, a implementação desses contratos foi reconstruída no backend do AeroSuite, mantendo seu modelo de empresas, autenticação e permissões. Não é uma cópia integral de um backend executável da referência.

## Funcionalidades integradas

| Área | Resultado no AeroSuite |
| --- | --- |
| Atribuição de OS | Mecânico ativo da empresa, responsável e autor da atribuição, data e justificativa de reencaminhamento. |
| Execução | Iniciar, pausar, retomar e finalizar; validação de transições, bloqueio de OS encerrada e eventos persistidos. |
| Acesso às OS | Mecânico consulta suas atribuições; campos técnicos de biblioteca e campos de execução do mecânico têm edição parcial no servidor. Campos de controle não podem ser alterados pelo PUT genérico. |
| Listagem | Filtros por fila/status, identificação do responsável e alerta de OS sem atribuição há mais de cinco dias. |
| Carga de mecânicos | Painel diário, semanal e mensal, contagens e abertura das listas correspondentes. |
| Fluxo por etapas | Leituras de entrada/saída, validação da sequência, avanço justificado e histórico por OS. |
| Indicadores do fluxo | Passagens, tempos, percentis, espera, cumprimento de metas, produção por dia e por usuário, rejeições e estornos. |
| Correções do fluxo | Estorno auditável e simulação de ajuste sem gravação, com justificativa ao aplicar. Registros anteriores são anulados, preservando o histórico. |
| Estações | Agrupamento por setor, cinco estações de oficina, nomes personalizados e máquinas vinculadas. |
| Pareamento | Código de oito dígitos com validade de cinco minutos; gestão autoriza a vinculação e pode revogar a máquina. |
| Etiquetas e códigos | Impressão de etiquetas por OS e folhas de códigos; etiqueta oferecida após criação. |
| Não conformidades | Acesso ao módulo CAPA existente com filtro pela OS e contagem de vínculos na listagem. O módulo existente foi reutilizado. |
| Déficit do kit FCU | Distinção entre ausência de cadastro, ausência de entrada, indisponibilidade e insuficiência; lista de conferência para copiar/imprimir. |
| Arquivos | Contratos de upload de documentos diversos, download/visualização e verificação do acesso do mecânico à OS. |
| CCo de propostas | Cadastro por empresa, seleção de usuários ativos, ausência de duplicatas e remoção de destinatários. |
| Envio de propostas | CCo padrão carregada no diálogo, edição para cada envio, validação de endereços e envio efetivo como Bcc no mesmo e-mail/PDF. O destinatário principal não é repetido em CCo. |
| Documentos e telefone | Máscara de CPF/CNPJ completos e formatação de telefone, preservando os formatos internacionais já aceitos pelo AeroSuite. |

As funcionalidades mais recentes já existentes no AeroSuite — portal externo, aditivos, moedas, vínculo proposta/OS, integração Bling e requisitos de conformidade — não foram substituídas pelas versões antigas da referência.

## Banco e acesso

Novas migrações Flyway: V91 a V95. Criam as tabelas de CCo, eventos de execução, etapas, registros, eventos de fluxo, terminais e nomes de estações, além dos campos de atribuição e controle de edição na OS. Não são alterações em migrações anteriormente publicadas.

Os dados novos têm `tenant_id` e seguem o isolamento Hibernate do AeroSuite. Os códigos de permissão `OS_FLUXO_PAINEL`, `OS_FLUXO_ESTACAO`, `OS_FLUXO_AJUSTE`, `OS_FLUXO_CODIGOS` e `OS_FLUXO_ESTACOES` são cadastrados por migração. Administrador, diretor e coordenador recebem acesso ao conjunto; mecânicos recebem estação e códigos. O controle de execução é reservado ao responsável e ao administrador.

As etapas iniciais reconstruídas são Recebimento, Desmontagem, Limpeza, Inspeção, Ensaio não destrutivo, Montagem, Teste, Inspeção final e Expedição. A referência disponibilizada não contém a definição original completa dessas etapas; essa sequência é uma decisão de implementação, não uma equivalência comprovada com o banco da referência. A criação inicial é feita uma vez por empresa, com bloqueio para evitar inicialização concorrente.

## Validação e limites

O frontend é verificado com a compilação Angular e testes das funções de documento/telefone. O backend possui testes de transições, política de acesso, CCo, código de barras, migrações, pareamento e fluxo completo, além da regressão do vínculo proposta/OS e do fluxo Bling.

Os testes de integração usam H2 em modo MySQL e dados descartáveis; as migrações também são executadas contra uma estrutura anterior simplificada para verificar preservação dos dados. Isso não substitui a homologação das migrações no MySQL da instalação. Não houve alteração do banco de produção, envio real de proposta por e-mail, pareamento em computador físico de oficina ou teste com leitor físico de código de barras.

Resultados da execução ficam em `backend/target/os-propostas-tests.log`, `backend/target/surefire-reports` e `frontend/build-os-propostas.log`.

Resultado da rodada final: 53 testes de backend e 13 testes de frontend aprovados; compilação Angular de desenvolvimento concluída sem erros.
