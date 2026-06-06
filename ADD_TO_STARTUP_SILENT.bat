@echo off
chcp 65001 >nul
color 0B
title Add School System to Windows Startup (Silent Mode)

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo        ⚡ ADD TO WINDOWS STARTUP - SILENT MODE ⚡
echo ════════════════════════════════════════════════════════════════
echo.
echo  This will make the server start automatically when Windows boots.
echo.
echo  The server will:
echo  ✓ Start automatically when you turn on your PC
echo  ✓ Run HIDDEN in background (no window)
echo  ✓ Show notification when started
echo  ✓ Be ready for use immediately
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
echo.

:: Get current directory
set "CURRENT_DIR=%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo [1/2] Creating startup shortcut...

:: Create VBS script to make shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%STARTUP_FOLDER%\School Management Server.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%CURRENT_DIR%START_SERVER_BACKGROUND.vbs" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> CreateShortcut.vbs
echo oLink.Description = "School Management System Server - Silent" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

:: Run VBS script
cscript //nologo CreateShortcut.vbs

:: Delete VBS script
del CreateShortcut.vbs

echo ✅ Shortcut created in Startup folder
echo.

echo [2/2] Testing location...
if exist "%STARTUP_FOLDER%\School Management Server.lnk" (
    echo ✅ Successfully added to startup!
) else (
    echo ❌ Failed to create shortcut
    pause
    exit /b 1
)

echo.
echo.
echo ════════════════════════════════════════════════════════════════
echo                    ✅ SUCCESS! ✅
echo ════════════════════════════════════════════════════════════════
echo.
echo  The server will now start SILENTLY when you boot Windows!
echo.
echo  📍 What happens on boot:
echo  1. Server starts hidden in background
echo  2. You'll see a popup notification for 5 seconds
echo  3. Access at: http://localhost:3000
echo.
echo  🔍 TO CHECK IF SERVER IS RUNNING:
echo  - Open Task Manager
echo  - Look for "node.exe" process
echo.
echo  🛑 TO STOP THE SERVER:
echo  - Open Task Manager
echo  - Find "node.exe" and end task
echo.
echo  🗑️  TO REMOVE FROM STARTUP:
echo  - Run: REMOVE_FROM_STARTUP.bat
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
