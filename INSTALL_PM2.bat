@echo off
chcp 65001 >nul
color 0B
title Install PM2 - Production Server Manager

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo          📦 INSTALLING PM2 - PRODUCTION SERVER MANAGER 📦
echo ════════════════════════════════════════════════════════════════
echo.
echo  PM2 is a professional process manager that will:
echo  ✅ Auto-restart server if it crashes
echo  ✅ Auto-start on Windows boot
echo  ✅ Keep logs of all activities
echo  ✅ Monitor server health
echo.
echo  This is the BEST solution for production use!
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
echo.

echo [1/4] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js not installed!
    pause
    exit /b 1
)
echo ✅ Node.js found
echo.

echo [2/4] Installing PM2 globally...
echo (This may take 1-2 minutes)
echo.
call npm install -g pm2
if %errorlevel% neq 0 (
    echo ❌ Failed to install PM2
    pause
    exit /b 1
)
echo ✅ PM2 installed
echo.

echo [3/4] Starting server with PM2...
cd backend
call pm2 start server.js --name "school-server"
if %errorlevel% neq 0 (
    echo ❌ Failed to start server
    pause
    exit /b 1
)
echo ✅ Server started
echo.

echo [4/4] Setting up auto-start on Windows boot...
call pm2 save
call pm2 startup
echo.
echo ⚠️  IMPORTANT: You'll see a command above.
echo     Copy it and run in a NEW Command Prompt (as Administrator)
echo.

cd ..

echo.
echo.
echo ════════════════════════════════════════════════════════════════
echo                    ✅ PM2 INSTALLATION COMPLETE! ✅
echo ════════════════════════════════════════════════════════════════
echo.
echo  📊 PM2 COMMANDS:
echo  ┌────────────────────────────────────────────────────────────┐
echo  │  pm2 status        - Check server status                   │
echo  │  pm2 logs          - View server logs                      │
echo  │  pm2 restart all   - Restart server                        │
echo  │  pm2 stop all      - Stop server                           │
echo  │  pm2 monit         - Live monitoring                       │
echo  └────────────────────────────────────────────────────────────┘
echo.
echo  📱 ACCESS URLS:
echo  This PC:     http://localhost:3000
echo  Phones:      http://192.168.43.215:3000
echo.
echo  ✅ Server is now running and will:
echo  • Auto-restart if it crashes
echo  • Auto-start when PC boots
echo  • Keep running 24/7
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
