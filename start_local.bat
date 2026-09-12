@echo off
echo Starting OrLife Connect Local Dev Servers...
start "OrLife UI (Port 3002)" cmd /k "cd /d %~dp0 && npm run dev"
start "WhatsApp Engine (Port 8080)" cmd /k "cd /d %~dp0whatsapp-engine && node server.js"
echo Local servers launched!
echo Next.js Dashboard: http://localhost:3002
echo WhatsApp Engine: http://localhost:8080
pause
