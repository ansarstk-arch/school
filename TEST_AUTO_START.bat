@echo off
chcp 65001 >nul
color 0E
title Test Auto-Start (No Reboot Needed)

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo          🧪 TEST AUTO-START (Without Restart) 🧪
echo ════════════════════════════════════════════════════════════════
echo.
echo  This will test if the auto-start works without rebooting.
echo.
pause
echo.

echo Testing...
echo.

:: Check if START_AUTO.vbs exists
if not exist "START_AUTO.vbs" (
    echo ❌ START_AUTO.vbs not found!
    echo    Run INSTALL_AUTO_START.bat first.
    pause
    exit /b 1
)

echo ✅ Found START_AUTO.vbs
echo.
echo Starting server in background...
echo.

:: Run the VBS script
cscript //nologo START_AUTO.vbs

echo.
echo ✅ Server should now be running!
echo.
echo Wait 10 seconds, then open browser:
echo → http://localhost:3000
echo.
echo Or from phone (same WiFi):
echo → http://192.168.43.215:3000
echo.
pause
