# Configurando Repositório Privado e Acesso Seguro

## 1. Tornar o Repositório Privado no GitHub

### Se o repositório já existe:

1. Acesse: https://github.com/SEU-USUARIO/aerosuite-fullstack-pro/settings
2. Role até a seção **"Danger Zone"**
3. Clique em **"Change visibility"**
4. Selecione **"Make private"**
5. Digite o nome do repositório para confirmar
6. Clique em **"I understand, change repository visibility"**

### Se ainda não criou o repositório:

Ao criar em https://github.com/new:
- Escolha **"Private"** ao invés de "Public"

## 2. Criar Token de Acesso para a Aplicação

A aplicação precisa de um token especial para acessar o repositório privado.

### Passo a Passo:

1. **Acesse:** https://github.com/settings/tokens
2. Clique em **"Generate new token"** > **"Generate new token (classic)"**
3. Preencha:
   - **Note**: `Aero Suite Sistema Atualizacao` (nome descritivo)
   - **Expiration**: Escolha um prazo (recomendo 1 ano ou "No expiration")
   - **Scopes**: Marque APENAS:
     - ✅ `repo` (acesso completo a repositórios privados)
     - OU mais específico:
       - ✅ `public_repo` (se quiser limitar apenas a repositórios públicos)
       - ✅ `repo:status` (status do repositório)
       - ✅ `repo_deployment` (deployments)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN IMEDIATAMENTE** (você não verá novamente!)
   - Exemplo: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 3. Configurar Token na Aplicação

### Opção A: Variáveis de Ambiente (Recomendado)

#### No Docker Compose:

```yaml
services:
  api:
    environment:
      # ... outras variáveis ...
      GITHUB_ENABLED: "true"
      GITHUB_OWNER: "seu-usuario"
      GITHUB_REPO: "aerosuite-fullstack-pro"
      GITHUB_TOKEN: "ghp_seu_token_aqui"  # ⚠️ Token do passo anterior
      GITHUB_USE_RELEASES: "true"
```

#### No application.properties:

```properties
github.enabled=true
github.owner=seu-usuario
github.repo=aerosuite-fullstack-pro
github.token=ghp_seu_token_aqui  # ⚠️ Token do passo anterior
github.use-releases=true
```

### Opção B: Arquivo .env (Mais Seguro)

Crie um arquivo `.env` na raiz do projeto:

```env
GITHUB_ENABLED=true
GITHUB_OWNER=seu-usuario
GITHUB_REPO=aerosuite-fullstack-pro
GITHUB_TOKEN=ghp_seu_token_aqui
GITHUB_USE_RELEASES=true
```

**⚠️ IMPORTANTE:** Adicione `.env` ao `.gitignore` para não subir o token!

## 4. Segurança Adicional

### A. Restringir Acesso por IP (Opcional)

Se sua aplicação roda em servidor fixo, você pode restringir o token:

1. No GitHub, vá em: https://github.com/settings/tokens
2. Edite o token criado
3. Configure restrições de IP (se disponível na sua conta)

### B. Usar Token com Escopo Mínimo

Para máxima segurança, crie um token com apenas:
- ✅ `repo:status` - Ver status do repositório
- ✅ `public_repo` ou `repo` - Acessar releases/tags

### C. Rotacionar Tokens Regularmente

- Troque o token a cada 6-12 meses
- Revogue tokens antigos em: https://github.com/settings/tokens

### D. Usar GitHub App (Avançado)

Para produção, considere criar uma GitHub App ao invés de token pessoal:
- Mais seguro
- Permissões granulares
- Melhor auditoria

## 5. Verificar Acesso

### Testar se a aplicação consegue acessar:

1. Configure o token
2. Inicie a aplicação
3. Verifique os logs - deve aparecer:
   ```
   Verificando atualizações no GitHub: seu-usuario/aerosuite-fullstack-pro
   Última release encontrada: x.y.z
   ```

### Se der erro de autenticação:

- Verifique se o token está correto
- Verifique se o token tem permissão `repo`
- Verifique se o repositório está privado e o token tem acesso

## 6. Boas Práticas

### ✅ FAZER:
- ✅ Usar variáveis de ambiente para tokens
- ✅ Adicionar `.env` ao `.gitignore`
- ✅ Usar tokens com escopo mínimo necessário
- ✅ Rotacionar tokens periodicamente
- ✅ Revogar tokens não utilizados

### ❌ NÃO FAZER:
- ❌ Commitar tokens no código
- ❌ Compartilhar tokens por email/chat
- ❌ Usar tokens pessoais em produção (use GitHub App)
- ❌ Deixar tokens sem expiração em produção

## 7. Monitoramento

### Verificar uso do token:

1. Acesse: https://github.com/settings/tokens
2. Veja quando o token foi usado pela última vez
3. Monitore atividades suspeitas

### Logs da aplicação:

A aplicação registra quando verifica atualizações:
- Sucesso: `Verificando atualizações no GitHub: owner/repo`
- Erro: `Erro ao verificar atualização no GitHub: ...`

## 8. Em Caso de Token Comprometido

Se suspeitar que o token foi exposto:

1. **IMEDIATAMENTE:** Revogue o token em: https://github.com/settings/tokens
2. Crie um novo token
3. Atualize a aplicação com o novo token
4. Verifique logs do GitHub para atividades suspeitas

## Resumo de Segurança

```
Repositório: PRIVADO ✅
Acesso: Apenas você + aplicação (via token) ✅
Token: Armazenado em variáveis de ambiente ✅
Token: Escopo mínimo necessário ✅
Token: Rotacionado periodicamente ✅
```

