#!/bin/bash
# Script de Reinicialização - Linux/Mac
# Aero Suite Aeronáutica - Ambiente de Produção

SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Reiniciando sistema..."
"$SCRIPT_PATH/stop.sh"
sleep 2
"$SCRIPT_PATH/start.sh"

