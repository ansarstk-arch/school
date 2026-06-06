@echo off
chcp 65001 >nul
color 0C
title Stop School Management Server

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo            🛑 STOP SCHOOL MANAGEMENT SERVER 🛑
echo ════════════════════════════════════════════════════════════════
echo.

:: Check if node.exe is running
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo  ℹ️  Server is not running.
    echo.
    pause
    exit /b 0
)

echo  Server is running. Stopping...
echo.

:: Kill all node.exe processes
taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo  ✅ Server stopped successfully!
) else (
    echo  ⚠️  Could not stop server. May require administrator privileges.
    echo.
    echo  Try:
    echo  1. Right-click this file and "Run as administrator"
    echo  2. Or open Task Manager and manually end "node.exe"
)

echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
