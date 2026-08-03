# Guia de Instalação Completo - Aero Suite Aeronáutica

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Build do Frontend](#build-do-frontend)
4. [Build do Backend](#build-do-backend)
5. [Configuração](#configuração)
6. [Instalação](#instalação)
7. [Inicialização](#inicialização)
8. [Verificação](#verificação)
9. [Troubleshooting](#troubleshooting)

## Pré-requisitos

### Windows

1. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verificar instalação: `node --version`

2. **Java 17+**
   - Download: https://adoptium.net/
   - Verificar instalação: `java -version`

3. **Nginx**
   - Download: https://nginx.org/en/download.html
   - Extrair em `C:\nginx` (ou outro diretório de sua escolha)

### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm openjdk-17-jdk nginx

# Verificar versões
node --version
npm --version
java -version
nginx -v
```

### Mac

```bash
# Usando Homebrew
brew install node@18
brew install openjdk@17
brew install nginx

# Verificar versões
node --version
npm --version
java -version
nginx -v
```

## Preparação do Ambiente

### 1. Estrutura de Diretórios

O diretório `producao/` já contém a estrutura necessária:

```
producao/
├── backend/          # Backend compilado (JAR/WAR)
├── frontend/         # Frontend buildado
├── nginx/            # Configuração do Nginx
├── scripts/          # Scripts de gerenciamento
├── config/           # Arquivos de configuração
└── logs/             # Logs do sistema
```

## Build do Frontend

### Opção 1: Usando Script Automatizado

**Windows:**
```powershell
cd producao
.\scripts\build-frontend.ps1
```

**Linux/Mac:**
```bash
cd producao
chmod +x scripts/build-frontend.sh
./scripts/build-frontend.sh
```

### Opção 2: Manual

```bash
# Navegar para o diretório do frontend
cd ../frontend

# Instalar dependências
npm install

# Build de produção
npm run build:prod

# Copiar arquivos para producao/frontend
# Windows PowerShell
Copy-Item -Path "dist\aerosuite-frontend\*" -Destination "..\producao\frontend\" -Recurse -Force

# Linux/Mac
cp -r dist/aerosuite-frontend/* ../producao/frontend/
```

## Build do Backend

### Compilar o Backend

O processo depende do framework usado (Quarkus, Spring Boot, etc.):

**Quarkus:**
```bash
cd ../backend
./mvnw clean package -DskipTests
# Copiar o JAR gerado
cp target/quarkus-app/quarkus-run.jar ../producao/backend/
```

**Spring Boot:**
```bash
cd ../backend
./mvnw clean package -DskipTests
# Copiar o JAR gerado
cp target/*.jar ../producao/backend/
```

**Gradle:**
```bash
cd ../backend
./gradlew clean build -x test
# Copiar o JAR gerado
cp build/libs/*.jar ../producao/backend/
```

## Configuração

### 1. Configurar Backend

Copie o arquivo de exemplo e edite com suas configurações:

```bash
# Windows
copy producao\config\backend.env.example producao\config\backend.env

# Linux/Mac
cp producao/config/backend.env.example producao/config/backend.env
```

Edite `producao/config/backend.env` com:
- URL do banco de dados
- Credenciais do banco
- Configurações de email/SMTP
- Outras variáveis de ambiente necessárias

### 2. Configurar Nginx (Windows)

Se o Nginx não estiver em `C:\nginx`, edite `producao/config/nginx-path.txt` com o caminho correto.

### 3. Configurar Nginx (Linux/Mac)

A configuração do Nginx está em `producao/nginx/nginx.conf`. 

Para usar esta configuração, você pode:
- Copiar para `/etc/nginx/sites-available/aerosuite` e criar symlink
- Ou usar diretamente: `nginx -c /caminho/para/producao/nginx/nginx.conf`

## Instalação

Execute o script de instalação:

**Windows:**
```powershell
cd producao
.\scripts\install.ps1
```

**Linux/Mac:**
```bash
cd producao
chmod +x scripts/*.sh
./scripts/install.sh
```

Este script irá:
- Verificar pré-requisitos
- Criar diretórios necessários
- Configurar arquivos padrão

## Inicialização

### Iniciar o Sistema

**Windows:**
```powershell
cd producao
.\scripts\start.ps1
```

**Linux/Mac:**
```bash
cd producao
./scripts/start.sh
```

### Verificar Status

**Windows:**
```powershell
.\scripts\status.ps1
```

**Linux/Mac:**
```bash
./scripts/status.sh
```

### Parar o Sistema

**Windows:**
```powershell
.\scripts\stop.ps1
```

**Linux/Mac:**
```bash
./scripts/stop.sh
```

### Reiniciar

**Windows:**
```powershell
.\scripts\restart.ps1
```

**Linux/Mac:**
```bash
./scripts/restart.sh
```

## Verificação

Após iniciar o sistema:

1. **Verificar Frontend:**
   - Acesse: http://localhost:8085
   - Deve carregar a tela de login

2. **Verificar Backend:**
   - Acesse: http://localhost:8085/api/health (se disponível)
   - Ou verifique os logs: `.\scripts\logs.ps1 backend`

3. **Verificar Portas:**
   - Porta 8085: Frontend (Nginx)
   - Porta 8080: Backend (interno, não exposto diretamente)

## Troubleshooting

### Problema: Nginx não inicia

**Windows:**
- Verifique se o caminho em `config/nginx-path.txt` está correto
- Verifique se a porta 8085 não está em uso: `netstat -ano | findstr :8085`
- Execute como administrador se necessário

**Linux/Mac:**
- Verifique se a porta 8085 não está em uso: `sudo lsof -i :8085`
- Verifique permissões: `sudo chmod +x scripts/*.sh`
- Verifique logs: `tail -f logs/nginx-error.log`

### Problema: Backend não inicia

1. Verifique se o JAR está em `backend/`
2. Verifique Java: `java -version`
3. Verifique logs: `.\scripts\logs.ps1 backend` ou `tail -f logs/backend-error.log`
4. Verifique configurações em `config/backend.env`
5. Verifique se a porta 8080 não está em uso

### Problema: Frontend não carrega

1. Verifique se os arquivos estão em `frontend/`
2. Verifique se o Nginx está rodando: `.\scripts\status.ps1`
3. Verifique logs do Nginx: `.\scripts\logs.ps1 nginx`
4. Verifique se o arquivo `frontend/index.html` existe

### Problema: Erro 502 Bad Gateway

- Backend não está rodando ou não está acessível na porta 8080
- Verifique: `.\scripts\status.ps1`
- Verifique logs do backend: `.\scripts\logs.ps1 backend`

### Problema: Erro de CORS

- Verifique se o backend está configurado para aceitar requisições de `http://localhost:8085`
- Verifique headers no `nginx.conf`

## Logs

Visualizar logs:

```bash
# Todos os logs (últimas 50 linhas)
.\scripts\logs.ps1

# Logs do backend (últimas 100 linhas)
.\scripts\logs.ps1 backend 100

# Logs do Nginx
.\scripts\logs.ps1 nginx
```

## Manutenção

### Atualizar Frontend

1. Fazer build: `.\scripts\build-frontend.ps1`
2. Reiniciar: `.\scripts\restart.ps1`

### Atualizar Backend

1. Compilar novo JAR
2. Substituir em `backend/`
3. Reiniciar: `.\scripts\restart.ps1`

### Backup

Faça backup regular de:
- `config/backend.env` (configurações)
- Banco de dados
- `logs/` (para análise)

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `.\scripts\logs.ps1`
2. Verifique o status: `.\scripts\status.ps1`
3. Consulte a documentação do projeto

