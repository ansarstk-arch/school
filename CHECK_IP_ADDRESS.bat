@echo off
chcp 65001 >nul
color 0B
title Check Server IP Address

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo              📍 CHECKING YOUR SERVER IP ADDRESS 📍
echo ════════════════════════════════════════════════════════════════
echo.
echo  Use this IP for other devices to connect:
echo.

ipconfig | findstr /i "IPv4"

echo.
echo ════════════════════════════════════════════════════════════════
echo  Look for "IPv4 Address" under "Wireless LAN adapter Wi-Fi"
echo  Example: 192.168.43.215
echo.
echo  Share this URL with others:
echo  http://YOUR_IP_HERE:3000
echo.
echo  Example: http://192.168.43.215:3000
echo ════════════════════════════════════════════════════════════════
echo.
pause
