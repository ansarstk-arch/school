@echo off
:: Silent version - runs in background without window

:: Check if already running
tasklist /FI "WINDOWTITLE eq School Backend Server*" 2>NUL | find /I /N "cmd.exe">NUL
if "%ERRORLEVEL%"=="0" (
    exit /b 0
)

:: Start server in minimized window
cd backend
start "School Backend Server" /MIN cmd /c "node server.js"
