@echo off
chcp 65001 >nul
color 0C
title Remove School System from Windows Startup

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo          🗑️  REMOVE FROM WINDOWS STARTUP 🗑️
echo ════════════════════════════════════════════════════════════════
echo.
echo  This will remove auto-start from Windows boot.
echo.
pause
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

if exist "%STARTUP_FOLDER%\School Management Server.lnk" (
    echo Removing shortcut...
    del "%STARTUP_FOLDER%\School Management Server.lnk"
    echo ✅ Successfully removed from startup!
) else (
    echo ℹ️  Shortcut not found in startup folder.
)

echo.
echo.
echo ════════════════════════════════════════════════════════════════
echo  The server will no longer start automatically.
echo  You'll need to manually run START_SERVER.bat when needed.
echo ════════════════════════════════════════════════════════════════
echo.
pause
