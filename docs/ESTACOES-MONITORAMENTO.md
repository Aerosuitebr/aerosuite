# Monitoramento e aprovação de máquinas por estação

- Gestão: `/os/fluxo/estacoes`. O dispositivo precisa abrir `/os/fluxo/estacao` e manter a solicitação de pareamento válida; não há varredura da rede local.
- A solicitação aparece no painel sem transcrição do código. Selecionar dispositivo, escolher estação, informar apelido e salvar. O servidor revalida permissão de gestão, tenant, expiração e consumo da solicitação sob bloqueio transacional.
- “Vincular esta máquina” usa o identificador deste navegador, cria a solicitação e abre a aprovação. Outro navegador/perfil ou a limpeza do armazenamento local representa outro terminal; não é identificação física por MAC ou número de série.
- Mantido o pareamento por código como alternativa. Transferir/remover continuam exigindo gestão.
- V103 cria monitoramento por tenant/estação e eventos de vínculo. A primeira observação inicia a linha de base; o passado não é reconstruído. A remoção/transferência da última máquina inicia o período sem vínculo, a nova vinculação o encerra. Remover uma entre várias máquinas não inicia o período.
- Eventos persistem ação, terminal, apelido, estação anterior/nova, responsável e data do servidor. Drawer exibe os últimos 100 eventos da estação.
- Cards ficam críticos após 24h sem vínculo observadas. O período anterior ao início do monitoramento é desconhecido.
- Presença usa o último acesso recebido pelo servidor: sinal recente até 2 minutos. Isso é separado do vínculo cadastrado e não equivale a ping de rede. O simples ato de reconfigurar um vínculo não simula presença.
- Gestão atualiza a cada 30s, suspendendo durante edição/aprovação. A Estação de bipagem mantém o fluxo existente de solicitação e atualização do terminal.
- Sem autenticação de gestão, a aprovação pelo painel e a consulta de histórico são recusadas pelo servidor.
