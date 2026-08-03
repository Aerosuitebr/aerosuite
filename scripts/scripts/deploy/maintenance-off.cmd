@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title Aero Suite — Desativar manutencao

set AEROSUITE_DEPLOY_PAUSE=1
cd /d "%~dp0..\.."

echo.
echo Aero Suite — desativando manutencao
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0maintenance-off.ps1"
set "RC=%ERRORLEVEL%"

echo.
if %RC% neq 0 (
    echo Falhou com codigo %RC%.
) else (
    echo Pronto. Sistema: http://127.0.0.1:8081
)
echo.
pause
exit /b %RC%
