#!/bin/bash
# Script de Visualização de Logs - Linux/Mac
# Aero Suite Aeronáutica - Ambiente de Produção

SERVICE=${1:-all}
LINES=${2:-50}

SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_PATH="$(cd "$SCRIPT_PATH/.." && pwd)"
cd "$ROOT_PATH"

echo "========================================"
echo "Logs do Sistema"
echo "========================================"
echo ""

if [ "$SERVICE" = "backend" ] || [ "$SERVICE" = "all" ]; then
    if [ -f "logs/backend.log" ]; then
        echo "Backend Log (últimas $LINES linhas):"
        echo "----------------------------------------"
        tail -n $LINES logs/backend.log
        echo ""
    else
        echo "Backend log não encontrado"
    fi
    
    if [ -f "logs/backend-error.log" ]; then
        echo "Backend Error Log (últimas $LINES linhas):"
        echo "----------------------------------------"
        tail -n $LINES logs/backend-error.log
        echo ""
    fi
fi

if [ "$SERVICE" = "nginx" ] || [ "$SERVICE" = "all" ]; then
    if [ -f "logs/nginx-access.log" ]; then
        echo "Nginx Access Log (últimas $LINES linhas):"
        echo "----------------------------------------"
        tail -n $LINES logs/nginx-access.log
        echo ""
    fi
    
    if [ -f "logs/nginx-error.log" ]; then
        echo "Nginx Error Log (últimas $LINES linhas):"
        echo "----------------------------------------"
        tail -n $LINES logs/nginx-error.log
        echo ""
    fi
fi

echo "Uso: ./scripts/logs.sh [backend|nginx|all] [linhas]"
echo ""

