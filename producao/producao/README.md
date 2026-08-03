# Aero Suite Aeronáutica - Ambiente de Produção

Este diretório contém todos os arquivos necessários para implantação em produção do sistema Aero Suite Aeronáutica.

## 📋 Pré-requisitos

- **Node.js** 18.xado
- **Java** 17+ (para o backend)
- **Nginx** (para servir o frontend e fazer proxy reverso)
- **Banco de dados** configurado e acessível

## 📁 Estrutura de Diretórios

```
producao/
├── backend/              # Backend compilado e configurado
├── frontend/             # Frontend buildado (arquivos estáticos)
├── nginx/                # Configuração do Nginx
├── scripts/              # Scripts de instalação e gerenciamento
├── config/               # Arquivos de configuração
└── README.md            # Este arquivo
```

## 🚀 Instalação Rápida

### 1. Preparar o Ambiente

```bash
# Instalar Node.js (se não estiver instalado)
# Windows: Baixar de https://nodejs.org/
# Linux: sudo apt install nodejs npm

# Instalar Nginx
# Windows: Baixar de https://nginx.org/en/download.html
# Linux: sudo apt install nginx
```

### 2. Build do Frontend

```bash
cd ../frontend
npm install
npm run build:prod
```

### 3. Build do Backend

```bash
cd ../backend
# Executar build do backend (Maven/Gradle conforme o projeto)
# Copiar JAR/WAR gerado para producao/backend/
```

### 4. Configurar e Iniciar

```bash
cd producao
# Windows
.\scripts\install.ps1
.\scripts\start.ps1

# Linux
chmod +x scripts/*.sh
./scripts/install.sh
./scripts/start.sh
```

## 🔧 Configuração

### Porta de Produção

O sistema roda na **porta 8085** por padrão.

### Variáveis de Ambiente

Edite `config/backend.env` para configurar:
- Banco de dados
- Email/SMTP
- Outras configurações do backend

### Nginx

A configuração do Nginx está em `nginx/nginx.conf` e já está configurada para:
- Servir o frontend na porta 8085
- Fazer proxy reverso para `/api/*` e `/auth/*` para o backend

## 📝 Scripts Disponíveis

- `install.ps1` / `install.sh` - Instala e configura o ambiente
- `start.ps1` / `start.sh` - Inicia o sistema
- `stop.ps1` / `stop.sh` - Para o sistema
- `restart.ps1` / `restart.sh` - Reinicia o sistema
- `status.ps1` / `status.sh` - Verifica status dos serviços
- `logs.ps1` / `logs.sh` - Visualiza logs

## 🔍 Verificação

Após iniciar, acesse:
- **Frontend**: http://localhost:8085
- **API**: http://localhost:8085/api

## 📞 Suporte

Para problemas ou dúvidas, consulte a documentação completa em `docs/INSTALL.md`.

