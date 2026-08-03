@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title Aero Suite — Ativar manutencao

set AEROSUITE_DEPLOY_PAUSE=1
cd /d "%~dp0..\.."

echo.
echo Aero Suite — ativando pagina de manutencao em :8081
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0maintenance-on.ps1"
set "RC=%ERRORLEVEL%"

echo.
if %RC% neq 0 (
    echo Falhou com codigo %RC%.
) else (
    echo Pronto. Teste: http://127.0.0.1:8081
)
echo.
pause
exit /b %RC%
