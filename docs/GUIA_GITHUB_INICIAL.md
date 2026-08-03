# Guia: Subindo o Projeto para o GitHub

Este guia te ajudará a subir seu projeto local para o GitHub pela primeira vez.

## Pré-requisitos

1. **Conta no GitHub** - Se não tiver, crie em: https://github.com/signup
2. **Git instalado** - Verifique com: `git --version`
3. **Projeto local** - Seu projeto já deve estar em uma pasta local

## Passo 1: Verificar se o Git já está inicializado

Abra o terminal na pasta do projeto e execute:

```bash
git status
```

### Se aparecer "fatal: not a git repository"
O Git ainda não foi inicializado. Pule para o **Passo 2**.

### Se aparecer informações sobre arquivos
O Git já está inicializado. Pule para o **Passo 3**.

## Passo 2: Inicializar o Git (se necessário)

Se o Git não estiver inicializado, execute:

```bash
git init
```

## Passo 3: Criar o arquivo .gitignore

Crie um arquivo `.gitignore` na raiz do projeto para não subir arquivos desnecessários:

```bash
# Criar arquivo .gitignore
```

Conteúdo sugerido do `.gitignore`:

```gitignore
# Backend (Java/Maven)
backend/target/
backend/.mvn/
backend/mvnw
backend/mvnw.cmd
backend/.classpath
backend/.project
backend/.settings/
backend/*.iml
backend/.idea/

# Frontend (Angular/Node)
frontend/node_modules/
frontend/dist/
frontend/.angular/
frontend/.vscode/
frontend/.idea/
frontend/*.log
frontend/npm-debug.log*
frontend/yarn-debug.log*
frontend/yarn-error.log*

# Arquivos de ambiente
.env
.env.local
.env.*.local
*.env

# Uploads e arquivos gerados
uploads/
backend/uploads/
*.jar
*.war

# Logs
*.log
logs/

# Sistema operacional
.DS_Store
Thumbs.db
desktop.ini

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# Banco de dados
*.db
*.sqlite
*.sqlite3

# Docker
docker-compose.override.yml

# Arquivos temporários
*.tmp
*.temp
*.bak
*.backup
```

## Passo 4: Adicionar arquivos ao Git

Adicione todos os arquivos ao Git:

```bash
git add .
```

## Passo 5: Fazer o primeiro commit

```bash
git commit -m "Initial commit: Projeto Aero Suite Fullstack"
```

## Passo 6: Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name**: `aerosuite-fullstack-pro` (ou o nome que preferir)
   - **Description**: "Sistema de gestão aeronáutica AEROSUITE"
   - **Visibility**: Escolha **Public** ou **Private**
   - **NÃO marque** "Add a README file" (já temos arquivos)
   - **NÃO marque** "Add .gitignore" (já criamos)
   - **NÃO marque** "Choose a license"
3. Clique em **"Create repository"**

## Passo 7: Conectar repositório local ao GitHub

Após criar o repositório, o GitHub mostrará instruções. Execute estes comandos:

```bash
# Adicionar o repositório remoto (substitua SEU-USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU-USUARIO/aerosuite-fullstack-pro.git

# Verificar se foi adicionado corretamente
git remote -v
```

**Nota:** Se preferir usar SSH ao invés de HTTPS:
```bash
git remote add origin git@github.com:SEU-USUARIO/aerosuite-fullstack-pro.git
```

## Passo 8: Renomear branch principal (opcional, mas recomendado)

Se sua branch principal não se chama "main":

```bash
# Verificar nome da branch atual
git branch

# Se estiver em "master", renomeie para "main"
git branch -M main
```

## Passo 9: Enviar código para o GitHub

```bash
git push -u origin main
```

**Nota:** Se sua branch se chama "master" ao invés de "main":
```bash
git push -u origin master
```

## Passo 10: Verificar no GitHub

1. Acesse seu repositório: `https://github.com/SEU-USUARIO/aerosuite-fullstack-pro`
2. Verifique se todos os arquivos foram enviados corretamente

## Configuração para o Sistema de Atualizações

Agora que o projeto está no GitHub, configure as variáveis de ambiente para o sistema de atualizações funcionar:

### No application.properties:

```properties
github.owner=SEU-USUARIO
github.repo=aerosuite-fullstack-pro
github.enabled=true
github.use-releases=true
```

### Ou no docker-compose.yml:

```yaml
services:
  api:
    environment:
      GITHUB_OWNER: "SEU-USUARIO"
      GITHUB_REPO: "aerosuite-fullstack-pro"
      GITHUB_ENABLED: "true"
      GITHUB_USE_RELEASES: "true"
```

## Criando a Primeira Release

Para testar o sistema de atualizações:

1. Vá para: `https://github.com/SEU-USUARIO/aerosuite-fullstack-pro/releases`
2. Clique em **"Create a new release"**
3. Preencha:
   - **Tag version**: `v1.0.0` (ou a versão atual do seu sistema)
   - **Release title**: `v1.0.0 - Versão Inicial`
   - **Description**: Descreva as funcionalidades desta versão
4. Clique em **"Publish release"**

## Comandos Git Úteis para o Futuro

### Verificar status
```bash
git status
```

### Adicionar mudanças
```bash
git add .
# ou para arquivos específicos:
git add caminho/do/arquivo
```

### Fazer commit
```bash
git commit -m "Descrição das mudanças"
```

### Enviar para o GitHub
```bash
git push
```

### Atualizar do GitHub
```bash
git pull
```

### Ver histórico
```bash
git log --oneline
```

## Solução de Problemas

### Erro: "remote origin already exists"
Se você já tentou adicionar o remote antes:
```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/aerosuite-fullstack-pro.git
```

### Erro de autenticação no push
Se pedir usuário/senha:
- **Username**: Seu usuário do GitHub
- **Password**: Use um **Personal Access Token** (não sua senha)
  - Crie em: https://github.com/settings/tokens
  - Permissões: `repo`

### Arquivos muito grandes
Se algum arquivo for muito grande (>100MB), adicione ao `.gitignore` ou use Git LFS:
```bash
git lfs install
git lfs track "*.jar"
git lfs track "*.war"
```

## Próximos Passos

1. ✅ Projeto no GitHub
2. ✅ Configurar variáveis do GitHub no sistema
3. ✅ Criar primeira release
4. ✅ Testar sistema de atualizações

Agora seu projeto está no GitHub e pronto para usar o sistema de atualizações automáticas!

