@echo off
title SEAF-PNAE - Iniciar Sistema
color 0A

echo ========================================
echo  SEAF-PNAE - Iniciando Sistema
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando MySQL local...
powershell -NoProfile -Command "if (-not (Test-NetConnection 127.0.0.1 -Port 3306 -InformationLevel Quiet)) { exit 1 }"
if %errorlevel% neq 0 (
    echo ERRO: MySQL local nao esta acessivel em 127.0.0.1:3306.
    echo Configure/inicie o MySQL com usuario seaf, senha seaf123 e banco seaf_pnae.
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando o ALVO da migracao (guarda fail-closed)...
node "%~dp0apps\backend\scripts\guardiar-migracao.js"
if %errorlevel% neq 0 (
    echo ERRO: Guarda de migracao BLOQUEOU a execucao (identidade do banco ou politica).
    echo Nenhuma migration foi aplicada. Revise DATABASE_URL em apps\backend\.env.
    pause
    exit /b 1
)

echo.
echo [3/4] Aplicando Prisma migrations...
cd /d "%~dp0apps\backend"
call npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo ERRO: Falha ao aplicar migrations. Confira DATABASE_URL e credenciais do MySQL.
    pause
    exit /b 1
)

echo.
echo [4/4] Iniciando Backend e Frontend...
start "SEAF-Backend" cmd /k "cd /d %~dp0apps\backend && npm run dev"
timeout /t 3 /nobreak >nul
start "SEAF-Frontend" cmd /k "cd /d %~dp0apps\frontend && npm run dev"

echo.
echo ========================================
echo  Sistema SEAF-PNAE iniciado!
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5173
echo  Banco:    mysql://seaf@127.0.0.1:3306/seaf_pnae
echo ========================================
echo.
pause
