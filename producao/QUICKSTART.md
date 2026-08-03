# 🚀 Guia Rápido - Aero Suite Aeronáutica Produção

## Instalação Rápida (5 minutos)

### 1. Pré-requisitos
- Node.js 18+
- Java 17+
- Nginx

### 2. Build

```bash
# Frontend
cd producao
./scripts/build-frontend.sh    # Linux/Mac
.\scripts\build-frontend.ps1   # Windows

# Backend (compilar e copiar JAR para producao/backend/)
```

### 3. Configurar

```bash
# Copiar e editar configurações
cp config/backend.env.example config/backend.env
# Editar config/backend.env com suas configurações
```

### 4. Iniciar

```bash
# Windows
.\scripts\install.ps1
.\scripts\start.ps1

# Linux/Mac
./scripts/install.sh
./scripts/start.sh
```

### 5. Acessar

🌐 **http://localhost:8085**

---

## Comandos Úteis

| Ação | Windows | Linux/Mac |
|------|---------|-----------|
| Iniciar | `.\scripts\start.ps1` | `./scripts/start.sh` |
| Parar | `.\scripts\stop.ps1` | `./scripts/stop.sh` |
| Reiniciar | `.\scripts\restart.ps1` | `./scripts/restart.sh` |
| Status | `.\scripts\status.ps1` | `./scripts/status.sh` |
| Logs | `.\scripts\logs.ps1` | `./scripts/logs.sh` |

---

## Estrutura

```
producao/
├── backend/          ← Coloque o JAR aqui
├── frontend/         ← Frontend buildado (gerado automaticamente)
├── nginx/            ← Configuração do Nginx (porta 8085)
├── scripts/          ← Scripts de gerenciamento
├── config/           ← Configurações (edite backend.env)
└── logs/             ← Logs do sistema
```

---

## Troubleshooting Rápido

**Nginx não inicia?**
- Verifique porta 8085: `netstat -ano | findstr :8085` (Windows)
- Verifique caminho do Nginx em `config/nginx-path.txt`

**Backend não inicia?**
- Verifique se JAR está em `backend/`
- Verifique logs: `.\scripts\logs.ps1 backend`
- Verifique `config/backend.env`

**Frontend não carrega?**
- Execute build: `.\scripts\build-frontend.ps1`
- Verifique se arquivos estão em `frontend/`

---

📖 **Documentação completa:** `docs/INSTALL.md`

