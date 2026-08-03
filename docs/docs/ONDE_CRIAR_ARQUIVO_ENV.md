# Onde Criar o Arquivo .env

## 📍 Localização

O arquivo `.env` deve ser criado na **raiz do projeto**, no mesmo nível que:
- `docker-compose.yml`
- `backend/`
- `frontend/`
- `.gitignore`

## 📁 Estrutura de Pastas

```
aerosuite-fullstack-pro/
├── .env                    ← CRIE AQUI!
├── .gitignore
├── docker-compose.yml
├── backend/
├── frontend/
├── docs/
└── ...
```

## 🔧 Como Criar

### Opção 1: Criar Manualmente

1. Abra o explorador de arquivos
2. Navegue até: `C:\Aero Suite\Migracao\aerosuite-fullstack-pro`
3. Crie um novo arquivo chamado `.env` (sem extensão, apenas `.env`)
4. Cole o conteúdo do arquivo `.env.example` e preencha com seus valores

### Opção 2: Usar o Terminal

No terminal, na raiz do projeto:

```bash
# Copiar o exemplo
cp .env.example .env

# Ou criar novo
touch .env
```

### Opção 3: Usar o Editor de Código

1. No VS Code ou seu editor
2. Clique com botão direito na raiz do projeto
3. "New File"
4. Digite: `.env`
5. Cole o conteúdo e preencha

## 📝 Conteúdo Mínimo do .env

Para o sistema de atualizações funcionar, você precisa de:

```env
GITHUB_ENABLED=true
GITHUB_OWNER=wellemlyra
GITHUB_REPO=aerosuite-fullstack-pro
GITHUB_TOKEN=ghp_seu_token_aqui
GITHUB_USE_RELEASES=true
```

## ✅ Verificar se Está Correto

O arquivo `.env` deve estar:
- ✅ Na raiz do projeto
- ✅ Com o nome exato `.env` (ponto no início, sem extensão)
- ✅ No `.gitignore` (já está configurado - não será commitado)

## 🔍 Verificar se o Arquivo Existe

No terminal:

```bash
# Windows PowerShell
Test-Path .env

# Git Bash / Linux
ls -la .env
```

## ⚠️ Importante

- O arquivo `.env` **NÃO** será commitado no Git (está no `.gitignore`)
- **NUNCA** commite o arquivo `.env` com tokens reais
- Use `.env.example` como template (sem valores sensíveis)

## 🎯 Exemplo Completo

Arquivo `.env` na raiz:

```env
GITHUB_ENABLED=true
GITHUB_OWNER=wellemlyra
GITHUB_REPO=aerosuite-fullstack-pro
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USE_RELEASES=true
```

