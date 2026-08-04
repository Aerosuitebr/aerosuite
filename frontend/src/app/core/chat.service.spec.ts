import { describe, expect, it } from 'vitest';
import type { Conversa } from './chat.service';
import { repairChatConversation, repairChatMessage } from './chat-display-text.util';

describe('chat display text repair', () => {
  it('repairs names and message content returned by the API', () => {
    const repaired = repairChatMessage({
      id: 1,
      conversaId: 2,
      remetenteId: 3,
      remetenteNome: 'Guimar??es',
      conteudo: 'Informa??o de manutenÃ§Ã£o',
      tipo: 'TEXTO',
      dataEnvio: '2026-08-03T12:00:00Z',
      editada: false,
      ativo: true
    });

    expect(repaired.remetenteNome).toBe('Guimarães');
    expect(repaired.conteudo).toBe('Informação de manutenção');
  });

  it('repairs conversation and participant names', () => {
    const conversation = {
      id: 2,
      tipo: 'DIRETA',
      nome: 'Mec??nico',
      criadorId: 3,
      dataCriacao: '2026-08-03T12:00:00Z',
      dataAtualizacao: '2026-08-03T12:00:00Z',
      ativo: true,
      naoLidas: 0,
      participantes: [{ usuarioId: 4, nome: '??LCIO', email: 'user@example.com' }]
    } satisfies Conversa;

    const repaired = repairChatConversation(conversation);
    expect(repaired.nome).toBe('Mecânico');
    expect(repaired.participantes?.[0].nome).toBe('ÉLCIO');
  });
});
