# Debug - Chamada Não Chega no Destinatário

## 🔍 Problema
A chamada é criada e aparece na tela do chamador, mas o destinatário não recebe a notificação.

## ✅ O Que Foi Adicionado

1. **Logs no Backend**:
   - Quando a chamada é criada (mostra receptorId, status, etc.)
   - Quando verifica chamadas recebidas (mostra se encontrou ou não)

2. **Logs no Frontend**:
   - Quando verifica chamadas recebidas (polling)
   - Quando encontra uma chamada recebida

## 🔧 Como Debugar

### 1. Verificar Logs do Backend

Execute:
```bash
docker logs aerosuite-backend --tail 100 | findstr /i "chamada recebida iniciando"
```

Você deve ver:
```
=== INICIANDO CHAMADA ===
Chamador ID: X
Receptor ID: Y
✓ Chamada criada com sucesso!
  - Receptor ID: Y
  - Status: CHAMANDO
```

E depois, a cada 3 segundos (quando o destinatário verifica):
```
=== VERIFICANDO CHAMADA RECEBIDA ===
Receptor ID: Y
✓ Chamada recebida encontrada para receptor Y - ID: Z, Status: CHAMANDO
```

### 2. Verificar Console do Navegador (Destinatário)

1. Abra o chat no navegador do **destinatário**
2. Pressione **F12** → Console
3. Você deve ver a cada 3 segundos:
   ```
   Polling: Nenhuma chamada recebida (status 204)
   ```
   Ou quando encontrar:
   ```
   ✓ CHAMADA RECEBIDA ENCONTRADA! {id: X, ...}
   === NOVA CHAMADA RECEBIDA ===
   ```

### 3. Verificar Requisições HTTP (Destinatário)

1. No DevTools, aba **Network**
2. Filtre por "recebida"
3. Você deve ver requisições `GET /api/chamadas/recebida?receptorId=Y` a cada 3 segundos
4. Verifique:
   - **Status**: Deve ser 200 (quando encontra) ou 204 (quando não encontra)
   - **Response**: Se for 200, deve ter o objeto da chamada

## 🐛 Possíveis Problemas

### ❌ Backend não mostra "Chamada recebida encontrada"
**Causa**: A query não está encontrando a chamada.

**Verificar**:
1. O `receptorId` na chamada está correto?
2. O `status` está como "CHAMANDO"?
3. Execute no MySQL:
   ```sql
   SELECT * FROM chamada WHERE receptor_id = [ID_DO_DESTINATARIO] AND status = 'CHAMANDO';
   ```

### ❌ Frontend não mostra "CHAMADA RECEBIDA ENCONTRADA"
**Causa**: O polling não está funcionando ou o backend está retornando 204.

**Verificar**:
1. O polling está rodando? (deve aparecer logs a cada 3 segundos)
2. O `usuarioId` do destinatário está correto?
3. A requisição HTTP está retornando 200 ou 204?

### ❌ Polling não está rodando
**Causa**: O `iniciarPolling()` não foi chamado ou o estado não está 'idle'.

**Verificar**:
1. No console do destinatário, deve aparecer:
   ```
   Iniciando polling de chamadas para usuário: X
   ```
2. Se não aparecer, o polling não foi iniciado. Recarregue a página.

### ❌ Estado não está 'idle'
**Causa**: O destinatário já está em uma chamada.

**Verificar**:
1. O estado da chamada no destinatário está como 'idle'?
2. Se não, encerre qualquer chamada ativa e tente novamente.

## 📋 Checklist

- [ ] Backend mostra "Chamada criada" com receptorId correto
- [ ] Backend mostra "Chamada recebida encontrada" quando o destinatário verifica
- [ ] Frontend do destinatário mostra "Iniciando polling"
- [ ] Frontend do destinatário faz requisições a cada 3 segundos
- [ ] Requisições retornam 200 (não 204) quando há chamada
- [ ] Frontend mostra "CHAMADA RECEBIDA ENCONTRADA" quando encontra

## 🔧 Próximos Passos

1. **Teste com dois navegadores diferentes** (ou abas anônimas)
2. **Faça login com usuários diferentes** em cada navegador
3. **Inicie uma chamada** de um usuário para o outro
4. **Verifique os logs** em ambos os lados (chamador e destinatário)
5. **Copie os logs** e compartilhe para análise

## 💡 Dica

Se o problema persistir, verifique se há alguma diferença entre os IDs:
- O `receptorId` salvo na chamada
- O `usuarioId` usado no polling do destinatário
- O `receptorId` usado na requisição `/recebida`

Eles devem ser **exatamente iguais** (mesmo tipo e mesmo valor).
