@echo off
chcp 65001 >nul
color 0A
title School Management System - Server

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo          🎓 SCHOOL MANAGEMENT SYSTEM - SERVER STARTER 🎓
echo ════════════════════════════════════════════════════════════════
echo.
echo  Starting Backend ^& Frontend Server...
echo.

cd backend

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo                    ✅ SERVER IS NOW RUNNING! ✅
echo ════════════════════════════════════════════════════════════════
echo.
echo  🖥️  ACCESS FROM THIS COMPUTER:
echo  ┌────────────────────────────────────────────────────────────┐
echo  │  👉 http://localhost:3000                                  │
echo  └────────────────────────────────────────────────────────────┘
echo.
echo  📱 ACCESS FROM PHONES/TABLETS (Same WiFi):
echo  ┌────────────────────────────────────────────────────────────┐
echo  │  👉 http://192.168.43.215:3000                             │
echo  │                                                            │
echo  │  Share this URL with teachers and staff                   │
echo  │  They must be connected to the same WiFi network          │
echo  └────────────────────────────────────────────────────────────┘
echo.
echo  💡 BOTH FRONTEND AND BACKEND ARE SERVED FROM ONE URL!
echo     Just open the URL in any browser - everything works!
echo.
echo ════════════════════════════════════════════════════════════════
echo  ⚠️  KEEP THIS WINDOW OPEN - Don't close while using system!
echo  🛑 Press Ctrl+C to stop the server
echo ════════════════════════════════════════════════════════════════
echo.
echo  📊 Server Logs:
echo  ──────────────────────────────────────────────────────────────
echo.

node server.js
