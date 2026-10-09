@echo off
echo Parando SigSeaf...

taskkill /F /IM node.exe
taskkill /F /IM nginx.exe

taskkill /F /IM cmd.exe

echo Sistema parado.
pause
