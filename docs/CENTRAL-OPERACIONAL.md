# Central operacional

Entrada: /operacoes. O menu fica em Oficina > Central operacional; resultados financeiros ficam também em Gestão > Resultados por OS.

## Fluxos entregues

| Área | Comportamento |
|---|---|
| Impedimentos | OS, motivo, responsável, prazo e próxima ação; lista/quadro e histórico de situação. |
| Materiais | Demanda convertível em reserva por item/lote, separação, consumo pela saída existente e cancelamento com liberação de saldo. Consumo parcial externo atualiza a reserva. |
| Compras | Solicitação a partir de demanda, consolidação por PN, cotação, fornecedor, pedido e referência do recebimento. |
| Prontidão | Conferências de execução/entrega com evidência; indicadores derivados dos dados reais da OS. Pendências cadastradas impedem início no fluxo de execução/quadro, fechamento e emissão do CRS. |
| Resultados | Custo previsto e realizado, materiais consumidos, lançamentos e estorno justificado. Receita e resultado quando há proposta aprovada em BRL, com aditivos aprovados. |
| Planejamento | Alocação por período/recurso, distribuição diária das horas e rejeição de sobrecarga; alocação de técnico valida treinamentos segundo a política existente. |
| Ferramentas | Retirada, responsável, devolução prevista e devolução; rejeição de instrumento inativo, sem calibração válida ou já retirado. |
| Reincidências | Histórico de OS do mesmo PN/SN e registro de garantia/retrabalho vinculado à OS anterior. |

## Interface

Navegação por oito áreas, indicadores derivados do recorte, filtros por OS e situação, busca sem acentos na lista, busca remota de catálogo, lista ou quadro por situação, detalhes com trilha, formulários específicos, estados vazios, erros recuperáveis e carregamento. Navegação em grade em telas menores, formulários em uma coluna no celular, foco visível e modais acima do menu/rodapé. Cancelados permanecem na trilha; o filtro inicial mostra registros em acompanhamento (resultados inicia com todos).

## Dados e segurança

Flyway V99 adiciona operacao_registro e operacao_evento. Os dados usam @TenantId; vínculos são validados no tenant atual. Não há exclusão de registros pela API. Edição usa @Version e o cliente deve enviar version. Atualização com versão desatualizada retorna 409.

CENTRAL_OPERACIONAL é herdada pelos perfis com ORDEM_SERVICO na migração. CUSTOS_OPERACIONAIS é concedida aos perfis administrativos/gestão definidos na migração e validada no servidor. Consumo físico exige também ESTOQUE_SAIDA. Reservas e débitos compartilham bloqueio de escrita no item. Ajustes não podem reduzir o saldo abaixo das reservas; PN/lote/invoice e exclusão são protegidos enquanto houver comprometimento. Planejamento serializa validação de capacidade por tenant.

## Limites explícitos desta entrega

- Compras são acompanhadas internamente: não há envio automático de pedido de compra ao fornecedor ou ao Bling. A entrada física continua no estoque, preservando as validações de documentos/certificados existentes.
- Custo de material usa quantidade movimentada e valor unitário BRL atual do item, não um novo razão contábil de custo histórico. Horas são mostradas, mas a mão de obra é lançada em valor total. Valores em moedas diferentes não são somados sem conversão.
- Planejamento distribui horas uniformemente entre datas inclusivas. Não usa calendário de feriados, turnos, férias ou sequenciamento automático. A política existente de treinamentos é aplicada; a conferência de habilitação específica da tarefa continua com a gestão técnica.
- A central não substitui a certificação ou liberação técnica. As conferências automáticas são indicadores; as conferências cadastradas por fase são as novas pendências que bloqueiam o avanço.
- Custódia de ferramentas integra o cadastro e a calibração, mas a regra global de calibração existente não foi removida.
- Não foram ativadas mensagens externas, notificações ao cliente ou compras reais durante a implantação.
- Consulta de registros limitada a 500 por área/OS; catálogos têm limite de 100 resultados e busca remota.

## Validação

- Compilação Angular de produção e pacote Quarkus uber-jar.
- OperacaoRegrasTest, OperacaoReservaGuardTest, OperacaoAcessoTest, CapacidadeFilaServiceTest, OsExecucaoServiceTest e testes de segregação CRS: 30 testes sem falhas.
- scripts/test/operacoes-smoke.ps1: autenticação, oito áreas, resumo, status inválido e acesso anônimo.
- Integração HTTP local: criação/atualização/auditoria, conflito de versão (409), reserva acima do saldo (400), cancelamento liberando reserva sem débito físico e sobrecarga diária de recurso (400).
- Registros de teste locais foram cancelados; nenhuma saída física ou alteração de OS foi executada nos testes.
- Inspeção visual em navegador nas larguras padrão e 390 px; modais e navegação responsiva conferidos.

## Operação local

Frontend publicado no container aerosuite-frontend. Backend publicado em aerosuite-backend. Antes da atualização inicial, o executável anterior foi preservado em /app/app-pre-operacoes-20261025.jar. Para recriar os containers no futuro, usar o código/Dockerfiles atualizados: a cópia dos artefatos para os containers em execução não altera a imagem antiga.
