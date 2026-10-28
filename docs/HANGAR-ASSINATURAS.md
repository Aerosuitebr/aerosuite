# Assinaturas do Hangar

- Capturas em blocos compactos de 120px, com borda tracejada e indicação de desenho.
- O desenho usa coordenadas proporcionais às dimensões reais do canvas, evitando deslocamentos em tablets ou telas redimensionadas.
- Salvar fica desabilitado enquanto não houver traço. Limpar e descartar desenhos pedem confirmação e dão foco inicial à opção de manter o trabalho.
- Após salvar, a rubrica aparece como imagem estática, com autor e data/hora recebidos da API. Dados de integridade ficam disponíveis em uma seção recolhível.
- Assinar novamente requer confirmação explícita. A assinatura atual permanece intacta até o novo salvamento; a API exige a intenção de substituição e o hash da versão que foi aberta para edição.
- Gravações concorrentes são serializadas pelo bloqueio da OS, e versões desatualizadas são rejeitadas.
- Assinaturas aguardando sincronização exibem a rubrica local e o estado pendente. Não recebem autor ou horário confirmado antes da resposta do servidor.
- Falhas de gravação preservam o desenho. Recarregar os dados de uma assinatura não apaga o desenho ainda não salvo da outra.
- Respostas atrasadas de uma gravação não alteram a OS aberta após uma navegação.

Validação: 13 testes do frontend (8 de assinaturas e 5 do quadro) e 7 testes Java (4 de substituição e 3 do quadro), sem falhas. Build Angular e imagens da API/frontend verificados.
