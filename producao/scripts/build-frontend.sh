#!/bin/bash
# Script de Build do Frontend - Linux/Mac
# Aero Suite Aeronáutica - Ambiente de Produção

echo "========================================"
echo "Build do Frontend"
echo "========================================"
echo ""

SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_PATH="$(cd "$SCRIPT_PATH/../.." && pwd)"
FRONTEND_PATH="$ROOT_PATH/frontend"

if [ ! -d "$FRONTEND_PATH" ]; then
    echo "✗ Diretório frontend não encontrado em $FRONTEND_PATH"
    exit 1
fi

echo "Navegando para: $FRONTEND_PATH"
cd "$FRONTEND_PATH"

echo "Instalando dependências..."
npm install
if [ $? -ne 0 ]; then
    echo "✗ Erro ao instalar dependências"
    exit 1
fi

echo "Executando build de produção..."
npm run build:prod
if [ $? -ne 0 ]; then
    echo "✗ Erro ao fazer build"
    exit 1
fi

echo "Copiando arquivos para producao/frontend..."
DIST_PATH="$FRONTEND_PATH/dist/aerosuite-frontend"
PROD_FRONTEND_PATH="$SCRIPT_PATH/../frontend"

if [ -d "$PROD_FRONTEND_PATH" ]; then
    rm -rf "$PROD_FRONTEND_PATH"
fi
mkdir -p "$PROD_FRONTEND_PATH"

cp -r "$DIST_PATH"/* "$PROD_FRONTEND_PATH/"

echo ""
echo "========================================"
echo "✓ Build concluído com sucesso!"
echo "========================================"
echo ""
echo "Arquivos copiados para: $PROD_FRONTEND_PATH"
echo ""

