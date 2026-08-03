#!/usr/bin/env bash
# Deploy com página de manutenção (Linux / produção).
# Uso: ./scripts/deploy/redeploy-with-maintenance.sh [--skip-build]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SKIP_BUILD=0
if [[ "${1:-}" == "--skip-build" ]]; then
  SKIP_BUILD=1
fi

cd "$ROOT"

# Produção (VPS): export AEROSUITE_COMPOSE_FILES="-f docker-compose.yml -f docker-compose.local-mysql.yml -f docker-compose.production.yml"
COMPOSE_FILES=(${AEROSUITE_COMPOSE_FILES:--f docker-compose.yml})
compose() {
  docker compose "${COMPOSE_FILES[@]}" "$@"
}

echo "Aero Suite — deploy com manutenção"

echo "1/4 Parando frontend e ativando manutenção..."
compose stop web 2>/dev/null || true
compose --profile maintenance up -d maintenance

if [[ "$SKIP_BUILD" -eq 1 ]]; then
  echo "2/4 Reiniciando API (sem rebuild)..."
  compose up -d api
else
  echo "2/4 Rebuild da API e do frontend..."
  compose build api web
  compose up -d api
fi

echo "3/4 Troca rápida: manutenção → frontend..."
compose --profile maintenance stop maintenance 2>/dev/null || true
compose --profile maintenance rm -f maintenance 2>/dev/null || true
compose up -d --no-deps web

echo "4/4 Aguardando frontend..."
ready=0
for _ in $(seq 1 24); do
  if curl -sf -o /dev/null --max-time 4 http://127.0.0.1:8081/; then
    ready=1
    break
  fi
  sleep 5
done

if [[ "$ready" -eq 1 ]]; then
  echo "Deploy concluído — http://127.0.0.1:8081"
else
  echo "AVISO: frontend ainda não respondeu; verifique docker logs aerosuite-frontend" >&2
  exit 1
fi
