@echo off
title SEAF-PNAE - Parar Sistema
color 0C

echo ========================================
echo  SEAF-PNAE - Parando Sistema
echo ========================================
echo.

cd /d "%~dp0"

echo [1/1] Parando Backend e Frontend...
taskkill /F /FI "WINDOWTITLE eq SEAF-Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq SEAF-Frontend*" >nul 2>&1

for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" ^| findstr /i "node.exe"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Processos Node encerrados.

echo.
echo ========================================
echo  Sistema SEAF-PNAE parado!
echo ========================================
echo.
pause
