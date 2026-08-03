#!/bin/bash
# Script de Inicialização - Linux/Mac
# Aero Suite Aeronáutica - Ambiente de Produção

echo "========================================"
echo "Iniciando Aero Suite Aeronáutica"
echo "========================================"
echo ""

# Carregar configurações
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_PATH="$(cd "$SCRIPT_PATH/.." && pwd)"
cd "$ROOT_PATH"

# Verificar se já está rodando
BACKEND_PID=$(pgrep -f "aerosuite.*jar" | head -1)
if [ ! -z "$BACKEND_PID" ]; then
    echo "AVISO: Backend já está em execução (PID: $BACKEND_PID)"
    echo "Execute ./scripts/stop.sh primeiro se desejar reiniciar"
fi

# Verificar Nginx
if pgrep -x "nginx" > /dev/null; then
    echo "AVISO: Nginx já está em execução"
else
    echo "Iniciando Nginx..."
    if command -v nginx &> /dev/null; then
        sudo nginx -c "$ROOT_PATH/nginx/nginx.conf" -p "$ROOT_PATH"
        sleep 2
        echo "✓ Nginx iniciado"
    else
        echo "✗ Nginx não encontrado"
        exit 1
    fi
fi

# Iniciar Backend
echo "Iniciando Backend..."
BACKEND_JAR=$(find backend -name "*.jar" -o -name "*.war" | head -1)
if [ ! -z "$BACKEND_JAR" ]; then
    # Carregar variáveis de ambiente
    if [ -f "config/backend.env" ]; then
        export $(grep -v '^#' config/backend.env | xargs)
    fi
    
    # Definir porta
    export QUARKUS_HTTP_PORT=8080
    
    # Criar diretório de logs se não existir
    mkdir -p logs
    
    # Iniciar backend em background
    nohup java -jar "$BACKEND_JAR" > logs/backend.log 2> logs/backend-error.log &
    BACKEND_PID=$!
    sleep 3
    
    if ps -p $BACKEND_PID > /dev/null; then
        echo "✓ Backend iniciado (PID: $BACKEND_PID)"
        echo "$BACKEND_PID" > logs/backend.pid
        echo "  Logs: logs/backend.log"
    else
        echo "✗ Erro ao iniciar backend. Verifique logs/backend-error.log"
    fi
else
    echo "✗ Backend JAR não encontrado em backend/"
fi

echo ""
echo "========================================"
echo "Sistema iniciado!"
echo "========================================"
echo ""
echo "Acesse: http://localhost:8085"
echo ""
echo "Para verificar status: ./scripts/status.sh"
echo "Para parar: ./scripts/stop.sh"
echo ""

