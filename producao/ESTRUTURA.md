# 📁 Estrutura do Diretório de Produção

```
producao/
│
├── 📄 README.md                    # Documentação principal
├── 📄 QUICKSTART.md                # Guia rápido de início
├── 📄 ESTRUTURA.md                 # Este arquivo
├── 📄 .gitignore                   # Arquivos ignorados pelo Git
│
├── 📂 backend/                      # Backend compilado
│   └── (aqui você coloca o JAR/WAR do backend)
│
├── 📂 frontend/                     # Frontend buildado
│   └── (gerado automaticamente pelo script build-frontend)
│
├── 📂 nginx/                        # Configuração do Nginx
│   └── nginx.conf                   # Configuração (porta 8085)
│
├── 📂 scripts/                      # Scripts de gerenciamento
│   ├── install.ps1                 # Instalação (Windows)
│   ├── install.sh                  # Instalação (Linux/Mac)
│   ├── start.ps1                   # Iniciar sistema (Windows)
│   ├── start.sh                    # Iniciar sistema (Linux/Mac)
│   ├── stop.ps1                    # Parar sistema (Windows)
│   ├── stop.sh                     # Parar sistema (Linux/Mac)
│   ├── restart.ps1                 # Reiniciar (Windows)
│   ├── restart.sh                  # Reiniciar (Linux/Mac)
│   ├── status.ps1                  # Verificar status (Windows)
│   ├── status.sh                   # Verificar status (Linux/Mac)
│   ├── logs.ps1                   # Ver logs (Windows)
│   ├── logs.sh                     # Ver logs (Linux/Mac)
│   ├── build-frontend.ps1          # Build frontend (Windows)
│   └── build-frontend.sh           # Build frontend (Linux/Mac)
│
├── 📂 config/                       # Arquivos de configuração
│   ├── backend.env.example         # Exemplo de configuração do backend
│   ├── backend.env                 # Configuração real (criar a partir do exemplo)
│   └── nginx-path.txt              # Caminho do Nginx (Windows)
│
├── 📂 logs/                         # Logs do sistema
│   ├── backend.log                 # Log do backend
│   ├── backend-error.log           # Erros do backend
│   ├── backend.pid                  # PID do backend (Linux/Mac)
│   ├── nginx-access.log            # Log de acesso do Nginx
│   ├── nginx-error.log             # Log de erros do Nginx
│   └── nginx.pid                   # PID do Nginx
│
└── 📂 docs/                         # Documentação detalhada
    └── INSTALL.md                  # Guia completo de instalação
```

## 🔑 Arquivos Importantes

### Configuração
- `config/backend.env` - **CRÍTICO**: Configure com suas credenciais de banco e email
- `nginx/nginx.conf` - Configuração do Nginx (porta 8085)

### Scripts Principais
- `scripts/install.*` - Primeira instalação
- `scripts/start.*` - Iniciar sistema
- `scripts/stop.*` - Parar sistema
- `scripts/status.*` - Verificar status

### Build
- `scripts/build-frontend.*` - Build do frontend Angular

## 📝 Fluxo de Trabalho

1. **Build do Frontend**
   ```bash
   ./scripts/build-frontend.sh
   ```

2. **Copiar Backend**
   - Compile o backend e copie o JAR para `backend/`

3. **Configurar**
   ```bash
   cp config/backend.env.example config/backend.env
   # Editar config/backend.env
   ```

4. **Instalar**
   ```bash
   ./scripts/install.sh
   ```

5. **Iniciar**
   ```bash
   ./scripts/start.sh
   ```

6. **Acessar**
   - http://localhost:8085

## 🔒 Segurança

⚠️ **IMPORTANTE**: 
- Nunca commite `config/backend.env` no Git (já está no .gitignore)
- Mantenha backups das configurações
- Use senhas fortes em produção
- Configure firewall adequadamente

## 📊 Portas

- **8085**: Frontend (Nginx) - **EXPOSTA**
- **8080**: Backend (interno) - **NÃO EXPOSTA DIRETAMENTE**

O Nginx faz proxy reverso de `/api/*` e `/auth/*` para o backend na porta 8080.

