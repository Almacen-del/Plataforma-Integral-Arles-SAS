@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0infra\onlyoffice-local\sync-vercel.ps1"
pause
