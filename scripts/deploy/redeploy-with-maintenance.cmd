@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title Aero Suite — Deploy com manutencao

set AEROSUITE_DEPLOY_PAUSE=1
cd /d "%~dp0..\.."

echo.
echo Aero Suite — deploy com pagina de manutencao
echo ^(pode levar varios minutos — nao feche esta janela^)
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0redeploy-with-maintenance.ps1" %*
set "RC=%ERRORLEVEL%"

echo.
if %RC% neq 0 (
    echo Deploy terminou com avisos ou erro. Codigo: %RC%
) else (
    echo Deploy concluido. Sistema: http://127.0.0.1:8081
)
echo.
pause
exit /b %RC%
