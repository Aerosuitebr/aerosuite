# Debug - Botão de Telefone Não Funciona

## ✅ Tabela Chamada
A tabela `chamada` já existe, então o problema não é esse.

## 🔍 Como Debugar

### 1. Abrir o Console do Navegador
1. Abra o chat no navegador
2. Pressione **F12** para abrir o DevTools
3. Vá para a aba **Console**

### 2. Verificar Logs ao Clicar no Telefone

Quando você clicar no botão de telefone, você DEVE ver os seguintes logs no console:

```
=== INICIAR CHAMADA CLICADO ===
Current User: {id: X, nome: "..."}
Conversa Atual: {id: Y, tipo: "DIRETA", ...}
Outro participante: {usuarioId: Z, nome: "..."}
Iniciando chamada... {conversaId: Y, receptorId: Z, ...}
=== INICIANDO CHAMADA (Frontend) ===
Conversa: Y Receptor: Z
UsuarioId: X
Estado atual: idle
Obtendo permissão do microfone...
```

### 3. Possíveis Problemas e Soluções

#### ❌ Nenhum log aparece ao clicar
**Problema**: O evento click não está sendo disparado ou o método não está sendo chamado.

**Soluções**:
- Verifique se o botão não está desabilitado (deve estar habilitado se não há chamada em andamento)
- Verifique se há erros no console antes de clicar
- Tente recarregar a página (Ctrl+F5)

#### ❌ Log aparece mas para em "Obtendo permissão do microfone..."
**Problema**: O navegador está bloqueando ou negando a permissão de microfone.

**Soluções**:
1. Verifique as permissões do site:
   - Chrome/Edge: Clique no ícone de cadeado na barra de endereços → Permissões → Microfone → Permitir
   - Firefox: Clique no ícone de cadeado → Mais informações → Permissões → Microfone → Permitir
2. Recarregue a página e tente novamente
3. Se estiver em HTTP (não HTTPS), o navegador pode bloquear. Use HTTPS ou localhost.

#### ❌ Erro: "Usuário não identificado"
**Problema**: O `usuarioId` não está definido no `AudioCallService`.

**Soluções**:
- Verifique se o usuário está autenticado
- Verifique se o log "Iniciando polling de chamadas para usuário: X" aparece no console
- Se não aparecer, o polling não foi iniciado. Recarregue a página.

#### ❌ Erro: "Não foi possível identificar o destinatário da chamada"
**Problema**: A conversa não tem participantes ou não é uma conversa direta.

**Soluções**:
- Verifique se a conversa é do tipo "DIRETA" (não "GRUPO")
- Verifique se a conversa tem participantes
- Tente criar uma nova conversa direta com outro usuário

#### ❌ Erro: "Já existe uma chamada em andamento"
**Problema**: Há uma chamada ativa que não foi encerrada corretamente.

**Soluções**:
- Recarregue a página (Ctrl+F5)
- Ou aguarde alguns segundos e tente novamente

#### ❌ Erro no servidor (erro HTTP 400, 500, etc.)
**Problema**: O backend está retornando um erro.

**Soluções**:
1. Verifique os logs do backend:
   ```bash
   docker logs aerosuite-backend --tail 50
   ```
2. Verifique se a tabela `chamada` realmente existe:
   ```sql
   SHOW TABLES LIKE 'chamada';
   ```
3. Verifique se há erros de permissão ou estrutura na tabela

### 4. Verificar Requisições HTTP

1. No DevTools, vá para a aba **Network** (Rede)
2. Filtre por "chamadas" ou "iniciar"
3. Clique no botão de telefone
4. Verifique se a requisição `POST /api/chamadas/iniciar` aparece
5. Se aparecer, clique nela e verifique:
   - **Status**: Deve ser 200 OK
   - **Response**: Deve retornar um objeto com `id`, `status`, etc.
   - **Request Payload**: Deve ter `conversaId` e `receptorId`

### 5. Verificar Estado do Serviço

No console do navegador, execute:

```javascript
// Verificar se o serviço está inicializado
window.audioCallService = angular.injector(['ng']).get('AudioCallService');
// Isso não vai funcionar diretamente, mas você pode verificar no código
```

Ou adicione um breakpoint no método `iniciarChamada()` do componente.

## 📝 Checklist de Verificação

- [ ] Console do navegador aberto (F12)
- [ ] Usuário está autenticado
- [ ] Conversa está selecionada
- [ ] Conversa é do tipo "DIRETA" (não "GRUPO")
- [ ] Conversa tem participantes
- [ ] Permissão de microfone concedida
- [ ] Não há chamada em andamento
- [ ] Tabela `chamada` existe no banco
- [ ] Backend está rodando e acessível
- [ ] Logs aparecem no console ao clicar

## 🐛 Próximos Passos

Se após seguir todos os passos acima o problema persistir:

1. **Copie todos os logs do console** (desde o carregamento da página até o clique)
2. **Copie a resposta da requisição HTTP** (se houver)
3. **Copie os logs do backend** (últimas 50 linhas)
4. **Descreva exatamente o que acontece** quando você clica no botão

Com essas informações, será possível identificar o problema exato.
