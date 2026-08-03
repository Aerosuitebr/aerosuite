#!/bin/bash
# Script de Status - Linux/Mac
# Aero Suite Aeronáutica - Ambiente de Produção

echo "========================================"
echo "Status do Sistema"
echo "========================================"
echo ""

# Verificar Backend
echo "Backend:"
BACKEND_PID=$(cat logs/backend.pid 2>/dev/null)
if [ ! -z "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
    CPU=$(ps -p $BACKEND_PID -o %cpu --no-headers | tr -d ' ')
    MEM=$(ps -p $BACKEND_PID -o rss --no-headers | awk '{printf "%.2f", $1/1024}')
    echo "  ✓ Rodando (PID: $BACKEND_PID, CPU: ${CPU}%, Memória: ${MEM}MB)"
    
    # Verificar se está respondendo na porta 8080
    if nc -z localhost 8080 2>/dev/null; then
        echo "    ✓ Porta 8080 está aberta"
    else
        echo "    ✗ Porta 8080 não está respondendo"
    fi
else
    echo "  ✗ Não está em execução"
fi

echo ""

# Verificar Nginx
echo "Nginx:"
if pgrep -x "nginx" > /dev/null; then
    NGINX_PID=$(pgrep -x "nginx" | head -1)
    CPU=$(ps -p $NGINX_PID -o %cpu --no-headers | tr -d ' ')
    MEM=$(ps -p $NGINX_PID -o rss --no-headers | awk '{printf "%.2f", $1/1024}')
    echo "  ✓ Rodando (PID: $NGINX_PID, CPU: ${CPU}%, Memória: ${MEM}MB)"
    
    # Verificar se está respondendo na porta 8085
    if nc -z localhost 8085 2>/dev/null; then
        echo "    ✓ Porta 8085 está aberta"
    else
        echo "    ✗ Porta 8085 não está respondendo"
    fi
else
    echo "  ✗ Não está em execução"
fi

echo ""
echo "========================================"
echo ""
echo "Acesse: http://localhost:8085"
echo ""

