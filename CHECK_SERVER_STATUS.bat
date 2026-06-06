@echo off
chcp 65001 >nul
color 0E
title School Management Server - Status Check

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo          📊 SCHOOL MANAGEMENT SERVER - STATUS CHECK 📊
echo ════════════════════════════════════════════════════════════════
echo.

:: Check if node.exe is running
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo  ✅ SERVER STATUS: RUNNING
    echo.
    echo  📱 Access URLs:
    echo  ──────────────────────────────────────────────────────────
    echo  This PC:        http://localhost:3000
    echo  Other devices:  http://192.168.43.215:3000
    echo.
    echo  🔍 Process Details:
    echo  ──────────────────────────────────────────────────────────
    tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
) else (
    echo  ❌ SERVER STATUS: NOT RUNNING
    echo.
    echo  To start the server:
    echo  - Double-click START_SERVER.bat
    echo  - Or START_SERVER_BACKGROUND.vbs (silent mode)
)

echo.
echo ════════════════════════════════════════════════════════════════
echo.

:: Try to test connection
echo Testing connection to http://localhost:3000...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:3000/health 2>nul
if %errorlevel% equ 0 (
    echo ✅ Server is responding!
) else (
    echo ⚠️  Cannot connect to server
)

echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
