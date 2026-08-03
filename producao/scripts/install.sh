#!/bin/bash
# Script de Instalação - Linux/Mac
# Aero Suite Aeronáutica - Ambiente de Produção

echo "========================================"
echo "Aero Suite Aeronáutica - Instalação"
echo "========================================"
echo ""

# Verificar se está executando como root (para algumas operações)
if [ "$EUID" -ne 0 ]; then 
    echo "AVISO: Algumas operações podem requerer privilégios de root"
fi

# Verificar Node.js
echo "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js encontrado: $NODE_VERSION"
else
    echo "✗ Node.js não encontrado. Instale Node.js 18+"
    exit 1
fi

# Verificar Nginx
echo "Verificando Nginx..."
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1)
    echo "✓ Nginx encontrado: $NGINX_VERSION"
else
    echo "✗ Nginx não encontrado. Instale com: sudo apt install nginx"
    exit 1
fi

# Criar diretórios necessários
echo "Criando diretórios..."
DIRECTORIES=("backend" "frontend" "logs" "config")

for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "✓ Diretório criado: $dir"
    fi
done

# Copiar configurações padrão se não existirem
echo "Configurando arquivos..."
if [ ! -f "config/backend.env" ]; then
    if [ -f "config/backend.env.example" ]; then
        cp "config/backend.env.example" "config/backend.env"
        echo "✓ Arquivo de configuração criado: config/backend.env"
        echo "  IMPORTANTE: Edite config/backend.env com suas configurações!"
    fi
fi

# Verificar se o frontend foi buildado
if [ ! -f "frontend/index.html" ]; then
    echo "AVISO: Frontend não encontrado em frontend/"
    echo "Execute: cd ../frontend && npm install && npm run build:prod"
fi

# Verificar se o backend foi compilado
if [ ! -f backend/*.jar ] && [ ! -f backend/*.war ]; then
    echo "AVISO: Backend não encontrado em backend/"
    echo "Copie o JAR/WAR do backend para backend/"
fi

# Definir permissões
chmod +x scripts/*.sh 2>/dev/null || true

echo ""
echo "========================================"
echo "Instalação concluída!"
echo "========================================"
echo ""
echo "Próximos passos:"
echo "1. Edite config/backend.env com suas configurações"
echo "2. Execute ./scripts/start.sh para iniciar o sistema"
echo ""

