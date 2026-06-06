@echo off
chcp 65001 >nul
color 0C
title School Management System - Uninstall Auto-Start

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo       🗑️  SCHOOL MANAGEMENT SYSTEM - REMOVE AUTO-START 🗑️
echo ════════════════════════════════════════════════════════════════
echo.
echo  This will remove automatic startup from Windows boot.
echo.
pause
echo.

set "CURRENT_DIR=%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo [1/2] Removing startup shortcut...
if exist "%STARTUP_FOLDER%\School Management Server.lnk" (
    del "%STARTUP_FOLDER%\School Management Server.lnk"
    echo ✅ Startup shortcut removed
) else (
    echo ℹ️  No startup shortcut found
)
echo.

echo [2/2] Cleaning up files...
if exist "%CURRENT_DIR%START_AUTO.vbs" (
    del "%CURRENT_DIR%START_AUTO.vbs"
    echo ✅ Startup script removed
)

echo.
echo.
echo ════════════════════════════════════════════════════════════════
echo                  ✅ UNINSTALL COMPLETE! ✅
echo ════════════════════════════════════════════════════════════════
echo.
echo  The server will no longer start automatically.
echo  
echo  To start manually: Double-click START_SERVER.bat
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
