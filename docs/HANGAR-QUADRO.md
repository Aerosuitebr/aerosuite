# Quadro do Hangar

## Interação

- Arraste pela alça do cartão até uma coluna destacada. Botões de ação no cartão oferecem o mesmo comando por teclado e toque.
- A fazer → Em andamento registra início de serviço.
- Em andamento → Concluído registra fim de serviço quando as duas assinaturas já existem.
- Aguardando peça continua derivado das pendências reais; o arraste não apaga solicitações de troca. CRS e conclusão continuam obedecendo às regras do job card.
- Somente os destinos enviados pela API são habilitados. Offline, durante uma consulta e durante uma gravação, as movimentações ficam desabilitadas.
- A gravação é feita no servidor antes de recarregar o quadro. Falhas e alterações concorrentes recarregam os dados oficiais sem deixar cartões em posições fictícias.
- A API bloqueia a OS durante a transação, revalida a fase de origem e reutiliza o serviço de execução, incluindo verificação de conformidade, isolamento por organização e auditoria.

## Informação visual

- AOG vem de prioridadeFila; prazo vencido vem de dataPrevistaConclusao. Não são geradas prioridades fictícias.
- Progresso iniciado tem barra azul; completo, verde; pendente, cinza.
- Colunas vazias começam recolhidas e podem ser expandidas. Durante um arraste, destinos permitidos são destacados e ganham espaço.

## Validação

Cinco testes do frontend verificam destinos, modo offline, gravação única, recuperação de falhas, recolhimento de colunas e prevenção de clique após arraste. Três testes Java verificam início, exigência das duas assinaturas e preservação de pendências/conclusões.
