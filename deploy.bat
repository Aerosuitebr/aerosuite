@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title Aero Suite — Deploy

cd /d "%~dp0"
if not exist "docker-compose.yml" (
    echo ERRO: execute este arquivo na raiz do projeto Aero Suite.
    pause
    exit /b 1
)

set "SCRIPTS=%~dp0scripts\deploy"
set AEROSUITE_DEPLOY_PAUSE=1

:menu
cls
echo.
echo  ========================================
echo   Aero Suite — Deploy
echo  ========================================
echo.
echo   1. Deploy completo com manutencao
echo      ^(rebuild API + frontend^)
echo.
echo   2. Deploy rapido ^(sem rebuild^)
echo      ^(reinicia containers, mantem manutencao^)
echo.
echo   3. Ativar manutencao
echo      ^("Opa! Voltaremos em seguida..."^)
echo.
echo   4. Desativar manutencao
echo      ^(volta ao sistema normal^)
echo.
echo   5. Sair
echo.
set "opcao="
set /p opcao=Escolha [1-5]:

if "%opcao%"=="1" goto deploy_full
if "%opcao%"=="2" goto deploy_fast
if "%opcao%"=="3" goto maint_on
if "%opcao%"=="4" goto maint_off
if "%opcao%"=="5" exit /b 0

echo.
echo Opcao invalida.
timeout /t 2 >nul
goto menu

:deploy_full
echo.
echo Iniciando deploy completo...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPTS%\redeploy-with-maintenance.ps1"
goto fim

:deploy_fast
echo.
echo Iniciando deploy rapido ^(sem rebuild^)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPTS%\redeploy-with-maintenance.ps1" -SkipBuild
goto fim

:maint_on
echo.
echo Ativando pagina de manutencao...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPTS%\maintenance-on.ps1"
goto fim

:maint_off
echo.
echo Desativando manutencao...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPTS%\maintenance-off.ps1"
goto fim

:fim
echo.
if errorlevel 1 (
    echo Concluido com avisos ou erro. Codigo: %ERRORLEVEL%
) else (
    echo Concluido com sucesso.
)
echo.
pause
goto menu
