#!/bin/bash
# Script para verificar logs de email do backend

echo "=== Verificando logs de email do backend ==="
echo ""

# Verificar últimos 200 logs e filtrar por email/mail/sendgrid
docker logs aerosuite-backend --tail 200 2>&1 | grep -i -E "email|mail|sendgrid|smtp" || echo "Nenhum log de email encontrado nos últimos 200 registros"

echo ""
echo "=== Para ver todos os logs de email, execute: ==="
echo "docker logs aerosuite-backend 2>&1 | grep -i -E 'email|mail|sendgrid|smtp'"
