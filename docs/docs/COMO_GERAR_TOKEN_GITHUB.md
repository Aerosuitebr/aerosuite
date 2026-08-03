# Como Gerar Token do GitHub - Passo a Passo

## 📋 Passo a Passo Completo

### 1. Acesse a Página de Tokens

Abra no navegador:
**https://github.com/settings/tokens**

Ou acesse manualmente:
1. Faça login no GitHub
2. Clique na sua foto de perfil (canto superior direito)
3. Clique em **"Settings"**
4. No menu lateral esquerdo, clique em **"Developer settings"**
5. Clique em **"Personal access tokens"** > **"Tokens (classic)"**

### 2. Criar Novo Token

1. Clique no botão **"Generate new token"**
2. Selecione **"Generate new token (classic)"**

### 3. Preencher Informações do Token

#### Note (Nome do Token)
Digite um nome descritivo, por exemplo:
```
Aero Suite Sistema Atualizacao
```
ou
```
Aero Suite - Verificação de Atualizações
```

#### Expiration (Expiração)
Escolha uma das opções:
- **30 days** (30 dias)
- **60 days** (60 dias)
- **90 days** (90 dias)
- **Custom** (personalizado - ex: 365 dias = 1 ano)
- **No expiration** (sem expiração) ⚠️ Use apenas se necessário

**Recomendação:** Use **90 days** ou **1 year** para não ter que renovar frequentemente.

#### Select scopes (Permissões)
Marque **APENAS** o necessário:

Para repositório **PRIVADO**, marque:
- ✅ **`repo`** (Full control of private repositories)
  - Isso inclui:
    - ✅ repo:status
    - ✅ repo_deployment
    - ✅ public_repo
    - ✅ repo:invite
    - ✅ security_events

**⚠️ IMPORTANTE:** 
- Se o repositório for **PRIVADO**, você **PRECISA** marcar `repo`
- Se o repositório for **PÚBLICO**, pode usar apenas `public_repo`

### 4. Gerar o Token

1. Role a página até o final
2. Clique no botão verde **"Generate token"**

### 5. COPIAR O TOKEN (MUITO IMPORTANTE!)

⚠️ **ATENÇÃO:** Você só verá o token **UMA VEZ**!

1. O token aparecerá na tela (exemplo: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
2. **COPIE IMEDIATAMENTE** clicando no ícone de copiar ou selecionando todo o texto
3. Cole em um local seguro (bloco de notas, gerenciador de senhas, etc.)

**Formato do token:**
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. Usar o Token na Aplicação

#### Opção A: Docker Compose

No arquivo `docker-compose.yml`, adicione:

```yaml
services:
  api:
    environment:
      # ... outras variáveis ...
      GITHUB_TOKEN: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Cole aqui
```

#### Opção B: Arquivo .env

Crie um arquivo `.env` na raiz do projeto:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ LEMBRE-SE:** O arquivo `.env` já está no `.gitignore` e **NÃO** será commitado!

#### Opção C: Variável de Ambiente do Sistema

No Windows (PowerShell):
```powershell
$env:GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

No Linux/Mac:
```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 🔍 Verificar se o Token Funciona

### Teste Manual (Opcional)

Você pode testar o token manualmente usando curl:

```bash
curl -H "Authorization: token ghp_seu_token_aqui" \
     https://api.github.com/repos/SEU-USUARIO/aerosuite-fullstack-pro/releases/latest
```

Se retornar informações da release, o token está funcionando!

### Teste na Aplicação

1. Configure o token na aplicação
2. Inicie a aplicação
3. Verifique os logs - deve aparecer:
   ```
   Verificando atualizações no GitHub: seu-usuario/aerosuite-fullstack-pro
   Última release encontrada: x.y.z
   ```

## 🔒 Segurança do Token

### ✅ FAZER:
- ✅ Guardar o token em local seguro
- ✅ Usar variáveis de ambiente
- ✅ Adicionar `.env` ao `.gitignore` (já está configurado)
- ✅ Rotacionar o token periodicamente
- ✅ Revogar tokens não utilizados

### ❌ NÃO FAZER:
- ❌ Commitar o token no código
- ❌ Compartilhar o token por email/chat
- ❌ Deixar o token visível em logs públicos
- ❌ Usar o mesmo token em múltiplos projetos (crie um por projeto)

## 🔄 Gerenciar Tokens Existentes

### Ver Todos os Tokens

Acesse: https://github.com/settings/tokens

Você verá:
- Nome do token
- Última vez que foi usado
- Expiração
- Permissões

### Revogar um Token

1. Acesse: https://github.com/settings/tokens
2. Encontre o token que deseja revogar
3. Clique em **"Revoke"**
4. Confirme a revogação

### Editar um Token

⚠️ **IMPORTANTE:** Você **NÃO** pode ver o token novamente após criá-lo.

Você pode apenas:
- Renomear
- Alterar expiração
- Alterar permissões

Se precisar do valor do token novamente, você deve **revogar** e **criar um novo**.

## 📝 Resumo Rápido

1. ✅ Acesse: https://github.com/settings/tokens
2. ✅ Clique em "Generate new token" > "Generate new token (classic)"
3. ✅ Dê um nome (ex: "Aero Suite Sistema Atualizacao")
4. ✅ Escolha expiração (recomendo 90 dias ou 1 ano)
5. ✅ Marque `repo` (para repositórios privados)
6. ✅ Clique em "Generate token"
7. ✅ **COPIE O TOKEN IMEDIATAMENTE** (você só verá uma vez!)
8. ✅ Cole no `docker-compose.yml` ou arquivo `.env`

## 🆘 Problemas Comuns

### "Token inválido"
- Verifique se copiou o token completo
- Verifique se não há espaços antes/depois
- Verifique se o token não expirou

### "Repository not found"
- Verifique se o token tem permissão `repo`
- Verifique se o repositório está privado e o token tem acesso
- Verifique se o nome do repositório está correto

### "Rate limit exceeded"
- Sem token: 60 requisições/hora
- Com token: 5000 requisições/hora
- Se exceder, aguarde 1 hora ou use um token

## 📞 Precisa de Ajuda?

- Documentação oficial: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- Suporte GitHub: https://support.github.com

