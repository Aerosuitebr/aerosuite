# Quick Start: Repositório Privado e Seguro

## ✅ Passo 1: Tornar Repositório Privado

1. Acesse: https://github.com/SEU-USUARIO/aerosuite-fullstack-pro/settings
2. Role até **"Danger Zone"**
3. Clique em **"Change visibility"** > **"Make private"**
4. Confirme digitando o nome do repositório

## ✅ Passo 2: Criar Token para Aplicação

1. Acesse: https://github.com/settings/tokens
2. **"Generate new token"** > **"Generate new token (classic)"**
3. Preencha:
   - **Note**: `Aero Suite Sistema Atualizacao`
   - **Expiration**: 1 ano (ou "No expiration")
   - **Scopes**: ✅ Marque `repo` (acesso completo)
4. **"Generate token"**
5. **COPIE O TOKEN** (ex: `ghp_xxxxxxxxxxxxx`)

## ✅ Passo 3: Configurar na Aplicação

### Opção A: Docker Compose (Recomendado)

Adicione ao `docker-compose.yml` na seção `environment` do serviço `api`:

```yaml
environment:
  # ... outras variáveis existentes ...
  GITHUB_ENABLED: "true"
  GITHUB_OWNER: "seu-usuario-github"
  GITHUB_REPO: "aerosuite-fullstack-pro"
  GITHUB_TOKEN: "ghp_seu_token_aqui"  # ⚠️ Cole o token aqui
  GITHUB_USE_RELEASES: "true"
```

### Opção B: Arquivo .env (Mais Seguro)

1. Crie arquivo `.env` na raiz do projeto
2. Adicione:
```env
GITHUB_ENABLED=true
GITHUB_OWNER=seu-usuario-github
GITHUB_REPO=aerosuite-fullstack-pro
GITHUB_TOKEN=ghp_seu_token_aqui
GITHUB_USE_RELEASES=true
```

3. **IMPORTANTE:** O `.env` já está no `.gitignore` - não será commitado!

## ✅ Passo 4: Verificar

1. Reinicie a aplicação
2. Verifique os logs - deve aparecer:
   ```
   Verificando atualizações no GitHub: seu-usuario/aerosuite-fullstack-pro
   ```

## 🔒 Segurança Garantida

- ✅ Repositório: **PRIVADO**
- ✅ Acesso: Apenas você + aplicação (via token)
- ✅ Token: Armazenado em variáveis de ambiente (não no código)
- ✅ Token: Escopo mínimo (`repo` apenas)
- ✅ `.env` no `.gitignore` (não será commitado)

## ⚠️ Lembrete

- **NUNCA** commite o token no código
- **NUNCA** compartilhe o token
- **ROTACIONE** o token a cada 6-12 meses
- **REVOQUE** tokens antigos não utilizados

