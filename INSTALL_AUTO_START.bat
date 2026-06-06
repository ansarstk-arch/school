@echo off
chcp 65001 >nul
color 0B
title School Management System - Install Auto-Start

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo          🎓 SCHOOL MANAGEMENT SYSTEM - AUTO-START SETUP 🎓
echo ════════════════════════════════════════════════════════════════
echo.
echo  This will configure the system to start automatically when
echo  Windows boots.
echo.
echo  ✅ What will happen:
echo  • Server starts automatically on Windows boot
echo  • Runs silently in background (no window)
echo  • Shows notification when ready
echo  • Access from this PC: http://localhost:3000
echo  • Access from phones/tablets: http://192.168.43.215:3000
echo.
echo  📱 Both backend and frontend will work!
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
echo.

:: Get current directory
set "CURRENT_DIR=%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo [1/3] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js not installed!
    echo    Install from: https://nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js found
echo.

echo [2/3] Creating startup VBS script...
> "%CURRENT_DIR%START_AUTO.vbs" echo Set WshShell = CreateObject("WScript.Shell")
>> "%CURRENT_DIR%START_AUTO.vbs" echo Set fso = CreateObject("Scripting.FileSystemObject")
>> "%CURRENT_DIR%START_AUTO.vbs" echo ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
>> "%CURRENT_DIR%START_AUTO.vbs" echo BackendDir = ScriptDir ^& "\backend"
>> "%CURRENT_DIR%START_AUTO.vbs" echo WshShell.CurrentDirectory = BackendDir
>> "%CURRENT_DIR%START_AUTO.vbs" echo WshShell.Run "node server.js", 0, False
>> "%CURRENT_DIR%START_AUTO.vbs" echo WScript.Sleep 5000
>> "%CURRENT_DIR%START_AUTO.vbs" echo WshShell.Popup "School Management Server Started!" ^& vbCrLf ^& vbCrLf ^& "This PC: http://localhost:3000" ^& vbCrLf ^& "Phones: http://192.168.43.215:3000", 8, "School System Ready", 64
echo ✅ Startup script created
echo.

echo [3/3] Adding to Windows Startup...

:: Create shortcut in startup folder
> CreateShortcut.vbs echo Set oWS = WScript.CreateObject("WScript.Shell")
>> CreateShortcut.vbs echo sLinkFile = "%STARTUP_FOLDER%\School Management Server.lnk"
>> CreateShortcut.vbs echo Set oLink = oWS.CreateShortcut(sLinkFile)
>> CreateShortcut.vbs echo oLink.TargetPath = "%CURRENT_DIR%START_AUTO.vbs"
>> CreateShortcut.vbs echo oLink.WorkingDirectory = "%CURRENT_DIR%"
>> CreateShortcut.vbs echo oLink.Description = "School Management System - Auto Start"
>> CreateShortcut.vbs echo oLink.Save

cscript //nologo CreateShortcut.vbs
del CreateShortcut.vbs

if exist "%STARTUP_FOLDER%\School Management Server.lnk" (
    echo ✅ Successfully added to Windows Startup!
) else (
    echo ❌ Failed to create startup shortcut
    pause
    exit /b 1
)

echo.
echo.
echo ════════════════════════════════════════════════════════════════
echo                    ✅ INSTALLATION COMPLETE! ✅
echo ════════════════════════════════════════════════════════════════
echo.
echo  🎉 System will now start automatically when Windows boots!
echo.
echo  📱 ACCESS URLS:
echo  ┌────────────────────────────────────────────────────────────┐
echo  │  This PC (Offline):   http://localhost:3000               │
echo  │  Phones/Tablets:      http://192.168.43.215:3000          │
echo  │  (Must be on same WiFi)                                    │
echo  └────────────────────────────────────────────────────────────┘
echo.
echo  ⚡ WHAT HAPPENS ON BOOT:
echo  • PC starts → Windows loads
echo  • Server starts automatically (hidden)
echo  • Popup notification appears for 8 seconds
echo  • System ready to use immediately!
echo.
echo  🔧 MANAGE THE SERVER:
echo  • Check status:  CHECK_SERVER_STATUS.bat
echo  • Stop server:   STOP_SERVER.bat
echo  • Remove auto-start: UNINSTALL_AUTO_START.bat
echo.
echo  💡 TIP: Restart your PC now to test!
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
