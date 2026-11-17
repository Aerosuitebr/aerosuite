@echo off
setlocal
if not "%~1"=="" goto run
:menu
echo.
echo Aero Suite - Esteira
echo 1. Iniciar local (build + API + frontend)
echo 2. Parar local
echo 3. Status local
echo 4. Logs local
echo 5. Deploy em producao
echo 6. Verificar producao
echo 0. Sair
choice /c 1234560 /n /m "Escolha: "
if errorlevel 7 exit /b 0
if errorlevel 6 (set "action=prod-status") else if errorlevel 5 (set "action=deploy") else if errorlevel 4 (set "action=logs") else if errorlevel 3 (set "action=status") else if errorlevel 2 (set "action=stop") else (set "action=start")
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy\esteira.ps1" -Action %action%
pause
goto menu
:run
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy\esteira.ps1" %*
exit /b %errorlevel%
