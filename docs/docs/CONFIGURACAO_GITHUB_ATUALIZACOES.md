# Configuração de Verificação de Atualizações via GitHub

O sistema agora está integrado com a API do GitHub para verificar automaticamente se há novas versões disponíveis.

## Como Funciona

1. O sistema verifica a cada 30 minutos se há novas releases/tags no repositório GitHub
2. Compara a versão mais recente com a versão atual do sistema
3. Se encontrar uma versão mais nova, notifica administradores e diretores
4. Apenas admin/diretor podem aprovar a atualização
5. Após aprovação, todos os usuários são notificados com contador regressivo de 5 minutos
6. O sistema é atualizado automaticamente

## Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no seu sistema ou no `docker-compose.yml`:

```bash
# Habilitar/desabilitar verificação GitHub (padrão: true)
GITHUB_ENABLED=true

# Owner do repositório (seu usuário ou organização)
GITHUB_OWNER=seu-usuario

# Nome do repositório
GITHUB_REPO=aerosuite-fullstack-pro

# Token do GitHub (opcional, mas recomendado para aumentar rate limit)
# Crie em: https://github.com/settings/tokens
GITHUB_TOKEN=ghp_seu_token_aqui

# Usar releases ou tags (padrão: true - usa releases)
GITHUB_USE_RELEASES=true
```

### 2. Configuração no application.properties

Alternativamente, você pode configurar no `application.properties`:

```properties
# Configurações do GitHub para verificação de atualizações
github.enabled=true
github.owner=seu-usuario
github.repo=aerosuite-fullstack-pro
github.token=ghp_seu_token_aqui
github.use-releases=true
```

### 3. Configuração no Docker Compose

Adicione as variáveis no `docker-compose.yml`:

```yaml
services:
  api:
    environment:
      # ... outras variáveis ...
      GITHUB_ENABLED: "true"
      GITHUB_OWNER: "seu-usuario"
      GITHUB_REPO: "aerosuite-fullstack-pro"
      GITHUB_TOKEN: "ghp_seu_token_aqui"
      GITHUB_USE_RELEASES: "true"
```

## Criando um Token do GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" > "Generate new token (classic)"
3. Dê um nome descritivo (ex: "Aero Suite Sistema Atualizacao")
4. Selecione o escopo: `public_repo` (para repositórios públicos) ou `repo` (para privados)
5. Clique em "Generate token"
6. Copie o token e use na variável `GITHUB_TOKEN`

**Importante:** Sem token, a API do GitHub tem rate limit de 60 requisições/hora. Com token, são 5000 requisições/hora.

## Formato de Versões

O sistema suporta versões no formato semântico:
- `1.0.0`
- `1.2.3`
- `v1.0.0` (prefixo 'v' é removido automaticamente)
- `1.0.0-beta` (sufixos são ignorados na comparação)

## Releases vs Tags

### Usando Releases (Recomendado)
- Mais organizado e fácil de gerenciar
- Permite adicionar notas de release
- Ignora automaticamente drafts e prereleases
- Configure: `GITHUB_USE_RELEASES=true`

### Usando Tags
- Mais simples, apenas tags versionadas
- Configure: `GITHUB_USE_RELEASES=false`

## Como Criar uma Release no GitHub

1. Vá para o seu repositório no GitHub
2. Clique em "Releases" > "Create a new release"
3. Escolha uma tag (ou crie uma nova, ex: `v1.1.0`)
4. Preencha o título e descrição
5. Marque como "Latest release" se for a versão mais recente
6. Publique a release

## Testando

Para testar a integração:

1. Certifique-se de que as configurações estão corretas
2. Crie uma release no GitHub com versão maior que a atual (ex: se atual é `1.0.0`, crie `1.0.1`)
3. Aguarde até 30 minutos (ou reinicie o backend para verificação imediata)
4. O sistema deve detectar e notificar os administradores

## Desabilitar Verificação GitHub

Se quiser desabilitar a verificação via GitHub:

```bash
GITHUB_ENABLED=false
```

Ou no `application.properties`:
```properties
github.enabled=false
```

## Logs

O sistema registra logs sobre a verificação:
- `Verificando atualizações no GitHub: owner/repo`
- `Última release encontrada: x.y.z`
- `Nova versão disponível: x.y.z (atual: a.b.c)`
- `Sistema está atualizado. Versão atual: x.y.z`

Verifique os logs do backend para acompanhar o processo.

