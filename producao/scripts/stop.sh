#!/bin/bash
# Script de Parada - Linux/Mac
# Aero Suite Aeronáutica - Ambiente de Produção

echo "========================================"
echo "Parando Aero Suite Aeronáutica"
echo "========================================"
echo ""

# Parar Backend
echo "Parando Backend..."
BACKEND_PID=$(cat logs/backend.pid 2>/dev/null)
if [ ! -z "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "  Parando processo (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    sleep 2
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill -9 $BACKEND_PID 2>/dev/null
    fi
    rm -f logs/backend.pid
    echo "✓ Backend parado"
else
    # Tentar encontrar por nome
    BACKEND_PIDS=$(pgrep -f "aerosuite.*jar")
    if [ ! -z "$BACKEND_PIDS" ]; then
        echo "$BACKEND_PIDS" | xargs kill 2>/dev/null
        echo "✓ Backend parado"
    else
        echo "  Backend não está em execução"
    fi
fi

# Parar Nginx
echo "Parando Nginx..."
if pgrep -x "nginx" > /dev/null; then
    sudo nginx -s quit 2>/dev/null || sudo pkill nginx
    sleep 1
    echo "✓ Nginx parado"
else
    echo "  Nginx não está em execução"
fi

echo ""
echo "========================================"
echo "Sistema parado!"
echo "========================================"
echo ""

