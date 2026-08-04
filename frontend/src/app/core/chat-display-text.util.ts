import type { Conversa, Mensagem, ParticipanteResumo } from './chat.service';
import { repairDisplayText } from './display-text.util';

export function repairChatMessage(message: Mensagem): Mensagem {
  return {
    ...message,
    remetenteNome: repairDisplayText(message.remetenteNome),
    conteudo: repairDisplayText(message.conteudo),
    anexos: message.anexos?.map(anexo => ({
      ...anexo,
      nomeOriginal: repairDisplayText(anexo.nomeOriginal)
    }))
  };
}

export function repairChatConversation(conversation: Conversa): Conversa {
  return {
    ...conversation,
    nome: repairDisplayText(conversation.nome),
    descricao: repairDisplayText(conversation.descricao),
    ultimaMensagem: conversation.ultimaMensagem
      ? repairChatMessage(conversation.ultimaMensagem)
      : undefined,
    participantes: conversation.participantes?.map(repairChatParticipant)
  };
}

export function repairChatParticipant(participant: ParticipanteResumo): ParticipanteResumo {
  return {
    ...participant,
    nome: repairDisplayText(participant.nome)
  };
}
