@echo off
chcp 65001 >nul
color 0B
title Add School System to Windows Startup

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo        ⚡ ADD TO WINDOWS STARTUP - AUTO START ON BOOT ⚡
echo ════════════════════════════════════════════════════════════════
echo.
echo  This will make the server start automatically when Windows boots.
echo.
echo  The server will:
echo  ✓ Start automatically when you turn on your PC
echo  ✓ Run minimized in background
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
echo oLink.TargetPath = "%CURRENT_DIR%START_SERVER.bat" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> CreateShortcut.vbs
echo oLink.WindowStyle = 7 >> CreateShortcut.vbs
echo oLink.Description = "School Management System Server" >> CreateShortcut.vbs
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
echo  The server will now start automatically when you boot Windows!
echo.
echo  📍 Shortcut location:
echo  %STARTUP_FOLDER%
echo.
echo  ⚠️  IMPORTANT:
echo  - Server will start minimized
echo  - Look for command window in taskbar
echo  - To stop: Right-click taskbar icon and close
echo.
echo  🗑️  TO REMOVE FROM STARTUP:
echo  - Run: REMOVE_FROM_STARTUP.bat
echo  - Or manually delete the shortcut from Startup folder
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
