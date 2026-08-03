# Corrigir Notificações de Mensagens e Chamadas

## 🔍 Problemas Identificados

1. **Mensagens não estão notificando o destinatário**: O sistema de polling está funcionando, mas as notificações podem não estar sendo exibidas corretamente.
2. **Chamadas não estão funcionando**: A tabela `chamada` pode não existir no banco de dados.

## ✅ Soluções

### 1. Criar Tabela de Chamadas

A tabela `chamada` é necessária para o sistema de chamadas de áudio funcionar.

#### Opção A: Via Endpoint (Recomendado)

1. Acesse: `http://localhost:8080/api/fix/criar-tabela-chamada`
2. Ou execute via curl:
```bash
curl http://localhost:8080/api/fix/criar-tabela-chamada
```

#### Opção B: Via SQL Manual

Execute o script SQL:
```sql
-- Arquivo: backend/EstruturaBanco/criar_tabelas_chat_e_notificacao.sql
-- A tabela chamada foi adicionada ao final do script
```

### 2. Verificar Notificações de Mensagens

O sistema de notificações funciona através de:
- **Polling**: O frontend verifica novas mensagens a cada 3 segundos
- **Comparação**: Compara a última mensagem com o estado anterior
- **Notificação**: Emite notificação se detectar nova mensagem

#### Possíveis Problemas:

1. **Permissão de Notificação do Navegador**:
   - O navegador precisa ter permissão para exibir notificações
   - Verifique se a permissão foi concedida

2. **Polling não está ativo**:
   - Verifique se `chatService.iniciarPolling(usuarioId)` foi chamado
   - Verifique no console do navegador se há erros

3. **Mensagens não estão sendo detectadas**:
   - O sistema compara IDs de mensagens
   - Se o ID não mudar, a notificação não será emitida

## 🔧 Como Testar

### Testar Notificações:

1. Abra o sistema em dois navegadores diferentes (ou abas anônimas)
2. Faça login com usuários diferentes em cada navegador
3. Envie uma mensagem de um usuário para o outro
4. Verifique se a notificação aparece no navegador do destinatário

### Testar Chamadas:

1. Certifique-se de que a tabela `chamada` foi criada
2. Abra o sistema em dois navegadores diferentes
3. Faça login com usuários diferentes
4. Tente iniciar uma chamada de áudio
5. Verifique se o receptor recebe a notificação de chamada

## 📋 Checklist

- [ ] Tabela `chamada` criada no banco de dados
- [ ] Permissão de notificação concedida no navegador
- [ ] Polling de mensagens está ativo (verificar console)
- [ ] Polling de chamadas está ativo (verificar console)
- [ ] Testar envio de mensagem entre dois usuários
- [ ] Testar chamada de áudio entre dois usuários

## 🐛 Debug

### Verificar Logs do Backend:

```bash
docker logs aerosuite-backend --tail 100 | findstr /i "chamada mensagem notificacao"
```

### Verificar Console do Navegador:

1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Procure por erros relacionados a:
   - `ChatService`
   - `AudioCallService`
   - `Notification`

### Verificar Requisições HTTP:

1. Abra o DevTools (F12)
2. Vá para a aba Network
3. Filtre por `/api/chat` ou `/api/chamadas`
4. Verifique se as requisições estão retornando 200 OK

## 📝 Notas Técnicas

### Sistema de Notificações:

- **Frontend**: `frontend/src/app/core/chat.service.ts`
  - Polling a cada 3 segundos
  - Compara última mensagem com estado anterior
  - Emite notificação via `_novaMensagem.next(notif)`

- **Componente de Notificação**: `frontend/src/app/shared/chat-notification/chat-notification.component.ts`
  - Escuta `chatService.novaMensagem$`
  - Exibe notificação visual na tela
  - Também usa notificações do navegador (se permitido)

### Sistema de Chamadas:

- **Backend**: `backend/src/main/java/com/aerosuite/service/ChamadaService.java`
  - Gerencia estado das chamadas
  - Busca chamadas recebidas via `findChamadaRecebida(receptorId)`

- **Frontend**: `frontend/src/app/core/audio-call.service.ts`
  - Polling a cada 3 segundos
  - Verifica chamadas recebidas via `/api/chamadas/recebida`
  - Usa WebRTC para conexão de áudio
