@echo off
title OrLife Connect - Master Launcher
color 0A
echo ========================================================
echo          🚀 STARTING ALL ORLIFE LOCAL SERVICES
echo ========================================================
echo.

echo [1/3] Starting WhatsApp Engine (Port 8080)...
start "WhatsApp Engine (Port 8080)" cmd /k "cd /d %~dp0 && node whatsapp-engine/server.js"

timeout /t 2 /nobreak >nul

echo [2/3] Starting AI Hub Engine Bridge (Port 8090)...
start "AI Hub Engine (Port 8090)" cmd /k "cd /d %~dp0 && node whatsapp-engine/ai-hub-server.js"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Next.js UI Frontend (Port 3002)...
start "OrLife Connect UI (Port 3002)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================================
echo 🎉 ALL SERVICES LAUNCHED SUCCESSFULLY!
echo --------------------------------------------------------
echo 🌐 Next.js Dashboard UI : http://localhost:3002
echo 💬 WhatsApp Engine      : http://localhost:8080
echo 🤖 Flash AI Hub Engine  : http://localhost:8090
echo ========================================================
echo.
pause
